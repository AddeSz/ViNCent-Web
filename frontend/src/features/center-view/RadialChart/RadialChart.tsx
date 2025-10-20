import type { ContextType } from "@/features/center-view/CenterView";
import ChartTooltip from "@/features/center-view/Tooltips/ChartTooltip";
import { useTooltip } from "@/features/center-view/Tooltips/useTooltip";
import { useChartData } from "@/features/center-view/hooks/useChartData";
import { useZoom } from "@/features/center-view/hooks/useZoom";
import { useKeys } from "@/hooks/useKeys";
import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type { FullData, Link, NodeChange } from "@/types/network";
import { scalePadding } from "@/utils/utils";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import calculateBounds from "./calculateBounds";
import drawArcs from "./drawArcs";
import drawBounds, { updateBoundHighlight } from "./drawBounds";
import { drawChangeCircles, updateChangeCircles } from "./drawChangeCircles";
import drawLabels, {
  updateLabelFontSize,
  updateLabelHighlight,
} from "./drawLabels";
import drawLinks, { updateFDEBLinks, updateLinkHighlight } from "./drawLinks";

export type ArcData = {
  key: string;
  0: number;
  1: number;
  data: FullData;
  value: any;
  id: string;
};

interface RadialChartProps {
  dimensions: DOMRectReadOnly | null;
  data: FullData[];
  dataMap: Map<string, FullData>;
  onContextMenuTarget: (target: ContextType, data?: any) => void;
  lastChanges: NodeChange | null;
  links: Link[];
}

const RadialChart = ({
  dimensions,
  data,
  dataMap,
  onContextMenuTarget,
  lastChanges,
  links,
}: RadialChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const radialZoom = useNetworkStore((s) => s.radialZoom);
  const setRadialZoom = useNetworkStore((s) => s.setRadialZoom);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const attributeInfo = useAttributeStore((s) => s.attributeInfo);

  const setHoveredNode = useNetworkStore((s) => s.setHoveredNode);
  const centralityRanges = useCentralityStore((s) => s.centralityRanges);
  const { setupZoom, resetZoom } = useZoom();
  const [maxLabelWidth, setMaxLabelWidth] = useState(0);

  const radialSettings = useChartSettings((s) => s.radialSettings);
  const {
    innerRadius,
    outerRadius,
    fontSize,
    separateMetrics,
    linkRenderingMode,
    fdebSettings,
  } = radialSettings;
  const displayMode = useChartSettings((s) => s.displaySettings.displayMode);
  const nodeMap = useNetworkStore((s) => s.nodeMap);
  const { allKeys, enabledAttributeKeys, enabledCentralityKeys } = useKeys();
  const resetZoomFlag = useNetworkStore((s) => s.resetRadialZoomFlag);
  const chartData = useChartData(data, allKeys);

  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  const handleNodeHover = (nodeId: string) => {
    const data = dataMap.get(nodeId);
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

  const showChangeCircleTooltip = (data: {
    nodeId: string;
    x: number;
    y: number;
  }) =>
    showTooltip(
      { type: "change", visible: true, ...data },
      `change-${data.nodeId}`,
    );

  useEffect(() => {
    if (resetZoomFlag) {
      resetZoom(svgRef, () => setRadialZoom(d3.zoomIdentity));
      useNetworkStore.setState({ resetRadialZoomFlag: false });
    }
  }, [resetZoomFlag]);

  useEffect(() => {
    if (!svgRef.current || !dimensions?.width || !dimensions?.height) return;
    const svg = d3.select(svgRef.current);
    let svgGroup = svg.select<SVGGElement>("g.zoom-group");

    if (svgGroup.empty()) {
      svgGroup = svg.append("g").attr("class", "zoom-group");
      setupZoom(svg, svgGroup, radialZoom, setRadialZoom);
    }

    if (!chartData) return;
    const { series, arcData } = chartData;
    const visibleData = data.filter((d) => !d.hidden);
    const dataLength = visibleData.length;
    const outerPadding = scalePadding(dataLength, 50, 0.25);
    const innerPadding = scalePadding(dataLength, 50, 0.5);

    const x = d3
      .scaleBand<string>()
      .domain(visibleData.map((d) => d.id))
      .range([0, 2 * Math.PI])
      .align(0.5)
      .padding(outerPadding)
      .paddingInner(innerPadding);

    const centralityCount = enabledCentralityKeys.length;
    const attributeCount = enabledAttributeKeys.length;
    const gap = separateMetrics ? 1 : 0;
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
      const cIndex = enabledCentralityKeys.indexOf(key);
      if (cIndex !== -1) return cIndex;

      const aIndex = enabledAttributeKeys.indexOf(key);
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
      onContextMenuTarget,
    );

    const removedIds = new Set(
      lastChanges?.removed ? Object.keys(lastChanges.removed) : [],
    );

    drawLinks(
      svgGroup,
      links,
      x,
      innerRadius,
      selectedNodes,
      linkRenderingMode,
      removedIds,
      fdebSettings,
    );
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
      setMaxLabelWidth,
      onContextMenuTarget,
    );

    drawChangeCircles(
      svgGroup,
      x,
      outerRadius,
      lastChanges,
      showChangeCircleTooltip,
      hideTooltip,
      maxLabelWidth,
    );
  }, [
    dimensions,
    innerRadius,
    outerRadius,
    separateMetrics,
    chartData,
    linkRenderingMode,
  ]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    updateBoundHighlight(svg, selectedNodes);
    updateLabelHighlight(svg, selectedNodes);
    updateLinkHighlight(svg, selectedNodes);
  }, [selectedNodes]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    updateLabelFontSize(svg, fontSize, nodeMap, setMaxLabelWidth);
    updateChangeCircles(svg, lastChanges, outerRadius, maxLabelWidth);
  }, [fontSize]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    updateChangeCircles(svg, lastChanges, outerRadius, maxLabelWidth);
  }, [lastChanges, maxLabelWidth]);

  useEffect(() => {
    if (!svgRef.current || linkRenderingMode !== "fdeB") return;

    const svg = d3.select(svgRef.current);

    const dataLength = data.length;
    const outerPadding = scalePadding(dataLength, 50, 0.25);
    const innerPadding = scalePadding(dataLength, 50, 0.5);

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.id))
      .range([0, 2 * Math.PI])
      .align(0.5)
      .padding(outerPadding)
      .paddingInner(innerPadding);

    updateFDEBLinks(svg, x, innerRadius, fdebSettings);
  }, [fdebSettings]);

  return !dimensions?.width || !dimensions?.height ? (
    <div className="flex h-full items-center justify-center"></div>
  ) : (
    <div
      className="relative h-full"
      onContextMenu={(e) => {
        if ((e.nativeEvent as any)._handledByChild) return;
        onContextMenuTarget("radial");
      }}
    >
      <svg
        ref={svgRef}
        viewBox="-800 -800 1600 1600"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        style={{ shapeRendering: "geometricPrecision" }}
      />
      <ChartTooltip {...tooltip} dataMap={dataMap} />
    </div>
  );
};

export default RadialChart;
