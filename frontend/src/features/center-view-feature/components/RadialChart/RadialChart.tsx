import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  type RefObject,
  type Ref,
} from "react";
import * as d3 from "d3";
import useResizeObserver from "@/hooks/useResizeObserver";
import type { CombinedNodeData } from "@/types/network";
import drawArcs from "./drawArcs";
import drawBounds, { updateBoundHighlight } from "./drawBounds";
import drawLabels, { updateLabelHighlight } from "./drawLabels";
import drawLinks, { updateLinkHighlight } from "./drawLinks";
import calculateBounds from "./calculateBounds";
import { useZoom } from "@/features/center-view-feature/hooks/useZoom";
import { useChartSettings } from "@/hooks/useChartSettings";
import useFilteredCentralityData from "@/features/center-view-feature/hooks/useFilteredCentralityData";
import {
  ArcTooltip,
  type ArcTooltipProps,
} from "@/features/center-view-feature/components/Tooltips/ArcTooltip";
import { useTooltip } from "@/features/center-view-feature/hooks/useTooltip";
import {
  LabelTooltip,
  type LabelTooltipProps,
} from "@/features/center-view-feature/components/Tooltips/LabelTooltip";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import useDebouncedValue from "@/hooks/useDebouncedValue";

export type ArcData = {
  key: string;
  0: number;
  1: number;
  data: CombinedNodeData;
  value: number;
};

function scalePadding(
  value: number,
  maxItems: number,
  maxPadding: number,
): number {
  if (value <= 1) return 0;
  if (value <= 2) return 0.01;
  return Math.min(value / maxItems, 1) * maxPadding;
}

const RadialChart = forwardRef(function RadialChart(
  {
    containerRef,
  }: {
    containerRef: RefObject<HTMLDivElement | null>;
  },
  resetRef: Ref<() => void>,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rawDimensions = useResizeObserver(containerRef);
  const dimensions = useDebouncedValue(rawDimensions, 200);

  const centralityKeys = useCentralityStore(
    (state) => state.enabledCentralityKeys,
  );
  const networkData = useNetworkStore((state) => state.network);
  const attributeKeys = useAttributeStore((state) => state.attributeKeys);
  const nodeAttributes = useAttributeStore((state) => state.nodeAttributes);
  const selectedNodes = useNetworkStore((state) => state.selectedNodes);
  const getColorForKey = useVisualizationStore((state) => state.getColorForKey);

  const setHoveredNode = useNetworkStore((state) => state.setHoveredNode);
  const centralityRanges = useCentralityStore(
    (state) => state.centralityRanges,
  );
  const centralityData = useFilteredCentralityData();
  const { setupZoom, resetZoom } = useZoom();
  const { radialSettings } = useChartSettings();
  const { innerRadius, outerRadius, fontSize, displayMode } = radialSettings;
  const nodeMap = useNetworkStore((state) => state.nodeMap);

  const combinedData = useMemo((): CombinedNodeData[] => {
    return centralityData.map((node) => ({
      ...node,
      ...(nodeAttributes[node.id] || {}),
    }));
  }, [centralityData, nodeAttributes]);

  const allKeys = useMemo(() => {
    if (displayMode === "attributes") return attributeKeys;
    if (displayMode === "centrality") return centralityKeys;
    return [...centralityKeys, ...attributeKeys];
  }, [centralityKeys, attributeKeys, displayMode]);

  const {
    tooltip,
    showTooltip: handleTooltipShow,
    hideTooltip: handleTooltipHide,
  } = useTooltip<ArcTooltipProps>({
    nodeId: "",
    centralityKey: "",
    value: undefined,
    x: 0,
    y: 0,
    visible: false,
  });

  const {
    tooltip: labelTooltip,
    showTooltip: handleLabelTooltipShow,
    hideTooltip: handleLabelTooltipHide,
  } = useTooltip<LabelTooltipProps>({
    nodeId: "",
    label: undefined,
    x: 0,
    y: 0,
    visible: false,
  });

  useImperativeHandle(
    resetRef,
    () => () => {
      resetZoom(svgRef);
    },
    [resetZoom],
  );

  const handleNodeHover = (nodeData: CombinedNodeData) => {
    setHoveredNode(nodeData);
  };

  useEffect(() => {
    if (!svgRef.current || !dimensions?.width || !dimensions?.height) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const svgGroup = svg.append("g").attr("class", "zoom-group");
    setupZoom(svg, svgRef, svgGroup);

    const dataLength = combinedData.length;
    const outerPadding = scalePadding(dataLength, 50, 0.25);
    const innerPadding = scalePadding(dataLength, 50, 0.5);

    const series = d3
      .stack<CombinedNodeData>()
      .keys(allKeys)
      .value(() => 1)(combinedData);

    const x = d3
      .scaleBand<string>()
      .domain(combinedData.map((d) => d.id))
      .range([0, 2 * Math.PI])
      .align(0.5)
      .padding(outerPadding)
      .paddingInner(innerPadding);

    const y = d3
      .scaleLinear<number, number>()
      .domain([0, allKeys.length])
      .range([innerRadius, outerRadius]);

    if (dataLength > 0) {
      const arcData = series.flatMap((layer) =>
        layer.map((d) => {
          return {
            ...d,
            key: layer.key,
            value: d.data[layer.key as keyof CombinedNodeData],
          };
        }),
      );

      const groupBounds = calculateBounds(series, x, y);
      const maxOuter = Math.max(...groupBounds.map((d) => d.outer));

      drawArcs(
        svgGroup,
        arcData,
        x,
        y,
        getColorForKey,
        centralityRanges,
        handleNodeHover,
        (tooltipData) =>
          handleTooltipShow(
            tooltipData,
            `${tooltipData.nodeId}-${tooltipData.centralityKey}`,
          ),
        handleTooltipHide,
      );
      drawLinks(svgGroup, networkData.links, x, innerRadius, selectedNodes);
      drawBounds(svgGroup, groupBounds, innerRadius, maxOuter, selectedNodes);
      drawLabels(
        svgGroup,
        x,
        maxOuter,
        selectedNodes,
        fontSize,
        arcData,
        handleNodeHover,
        (tooltipData) =>
          handleLabelTooltipShow(tooltipData, `label-${tooltipData.nodeId}`),
        handleLabelTooltipHide,
        nodeMap,
      );
    }
  }, [dimensions, centralityData, networkData, radialSettings]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    updateBoundHighlight(svg, selectedNodes);
    updateLabelHighlight(svg, selectedNodes);
    updateLinkHighlight(svg, selectedNodes);
  }, [selectedNodes]);

  return !dimensions?.width || !dimensions?.height ? (
    <div className="flex h-full items-center justify-center bg-card"></div>
  ) : (
    <div className="relative h-full">
      <svg
        ref={svgRef}
        viewBox="-800 -800 1600 1600"
        // viewBox={`${-dimensions.width} ${-dimensions.height} ${dimensions.width * 2} ${dimensions.height * 2}`}
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full bg-card"
        style={{ shapeRendering: "geometricPrecision" }}
      />
      <ArcTooltip {...tooltip} />
      <LabelTooltip {...labelTooltip} />
    </div>
  );
});

export default RadialChart;
