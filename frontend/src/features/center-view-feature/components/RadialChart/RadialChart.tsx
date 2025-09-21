import ChartTooltip from "@/features/center-view-feature/components/Tooltips/Tooltip";
import { useChartData } from "@/features/center-view-feature/hooks/useChartData";
import { useTooltip } from "@/features/center-view-feature/hooks/useTooltip";
import { useZoom } from "@/features/center-view-feature/hooks/useZoom";
import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import type { CombinedData } from "@/types/network";
import * as d3 from "d3";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
  type RefObject,
} from "react";
import calculateBounds from "./calculateBounds";
import drawArcs from "./drawArcs";
import drawBounds, { updateBoundHighlight } from "./drawBounds";
import drawLabels, { updateLabelHighlight } from "./drawLabels";
import drawLinks, { updateLinkHighlight } from "./drawLinks";

export type ArcData = {
  key: string;
  0: number;
  1: number;
  data: CombinedData;
  value: any;
  id: string;
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

type RadialChartProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  combinedData: CombinedData[];
  combinedDataMap: Map<string, CombinedData>;
};

const RadialChart = forwardRef(function RadialChart(
  { containerRef, combinedData, combinedDataMap }: RadialChartProps,
  resetRef: Ref<() => void>,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rawDimensions = useResizeObserver(containerRef);
  const dimensions = useDebouncedValue(rawDimensions, 200);

  const centralityKeys = useCentralityStore((s) => s.enabledCentralityKeys);
  const networkData = useNetworkStore((s) => s.network);
  const attributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const attributeInfo = useAttributeStore((s) => s.attributeInfo);

  const setHoveredNode = useNetworkStore((s) => s.setHoveredNode);
  const centralityRanges = useCentralityStore((s) => s.centralityRanges);
  const { setupZoom, resetZoom } = useZoom();

  const radialSettings = useChartSettings((s) => s.radialSettings);
  const displayMode = useChartSettings((s) => s.displayMode);
  const { innerRadius, outerRadius, fontSize, groupGapEnabled } =
    radialSettings;
  const nodeMap = useNetworkStore((s) => s.nodeMap);

  const allKeys = useMemo(() => {
    if (displayMode === "attributes") return attributeKeys;
    if (displayMode === "centrality") return centralityKeys;
    return [...centralityKeys, ...attributeKeys];
  }, [centralityKeys, attributeKeys, displayMode]);

  const chartData = useChartData(combinedData, allKeys);

  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  useImperativeHandle(resetRef, () => () => resetZoom(svgRef), [resetZoom]);

  const handleNodeHover = (nodeId: string) => {
    const data = combinedDataMap.get(nodeId);
    if (data) setHoveredNode(data);
  };

  const showArcTooltip = (data: {
    nodeId: string;
    x: number;
    y: number;
    arcKey: string;
  }) =>
    showTooltip(
      { type: "arc", visible: true, ...data },
      `${data.nodeId}-${data.arcKey}`,
    );

  const showLabelTooltip = (data: { nodeId: string; x: number; y: number }) =>
    showTooltip(
      { type: "label", visible: true, ...data },
      `label-${data.nodeId}`,
    );

  useEffect(() => {
    if (!svgRef.current || !dimensions?.width || !dimensions?.height) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const svgGroup = svg.append("g").attr("class", "zoom-group");
    setupZoom(svg, svgRef, svgGroup);
    if (!chartData) return;
    const { series, arcData } = chartData;

    const dataLength = combinedData.length;
    const outerPadding = scalePadding(dataLength, 50, 0.25);
    const innerPadding = scalePadding(dataLength, 50, 0.5);

    const x = d3
      .scaleBand<string>()
      .domain(combinedData.map((d) => d.id))
      .range([0, 2 * Math.PI])
      .align(0.5)
      .padding(outerPadding)
      .paddingInner(innerPadding);

    const centralityCount = centralityKeys.length;
    const attributeCount = attributeKeys.length;
    const gap = groupGapEnabled ? 1 : 0;
    let totalWithGap = centralityCount + gap + attributeCount;
    if (displayMode === "attributes" || centralityCount === 0)
      totalWithGap = attributeCount;
    if (displayMode === "centrality" || attributeCount === 0)
      totalWithGap = centralityCount;

    const y = d3
      .scaleLinear<number, number>()
      .domain([0, totalWithGap])
      .range([innerRadius, outerRadius]);

    const getKeyIndex = (key: string) => {
      const cIndex = centralityKeys.indexOf(key);
      if (cIndex !== -1) return cIndex;

      const aIndex = attributeKeys.indexOf(key);
      if (aIndex !== -1) {
        if (displayMode === "attributes" || centralityCount === 0)
          return aIndex;
        return centralityCount + gap + aIndex;
      }

      return 0;
    };

    const bounds = calculateBounds(series, x, y, getKeyIndex);
    drawArcs(
      svgGroup,
      arcData,
      x,
      y,
      getColorForKey,
      centralityRanges,
      handleNodeHover,
      showArcTooltip,
      hideTooltip,
      attributeInfo,
      getKeyIndex,
    );
    drawLinks(svgGroup, networkData.links, x, innerRadius, selectedNodes);
    drawBounds(svgGroup, bounds, innerRadius, outerRadius, selectedNodes);
    drawLabels(
      svgGroup,
      x,
      outerRadius,
      selectedNodes,
      fontSize,
      handleNodeHover,
      showLabelTooltip,
      hideTooltip,
      nodeMap,
    );
  }, [dimensions, radialSettings, allKeys, combinedData]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    updateBoundHighlight(svg, selectedNodes);
    updateLabelHighlight(svg, selectedNodes);
    updateLinkHighlight(svg, selectedNodes);
  }, [selectedNodes]);

  return !dimensions?.width || !dimensions?.height ? (
    <div className="flex h-full items-center justify-center"></div>
  ) : (
    <div className="relative h-full">
      <svg
        ref={svgRef}
        viewBox="-800 -800 1600 1600"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        style={{ shapeRendering: "geometricPrecision" }}
      />
      <ChartTooltip {...tooltip} combinedDataMap={combinedDataMap} />
    </div>
  );
});

export default RadialChart;
