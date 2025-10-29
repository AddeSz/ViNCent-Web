import type { ContextType } from "@/features/center-view/CenterView";
import ChartTooltip from "@/features/center-view/Tooltips/ChartTooltip";
import {
  useTooltip,
  type InteractionProps,
} from "@/features/center-view/Tooltips/useTooltip";
import { useChartData } from "@/features/center-view/hooks/useChartData";
import { useZoom } from "@/features/center-view/hooks/useZoom";
import { useKeys } from "@/hooks/useKeys";
import { useSettingsStore } from "@/stores/useChartSettingsStore";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData, Link, NodeChange } from "@/types/network";
import { scalePadding } from "@/utils/utils";
import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";
import calculateBounds from "./calculateBounds";
import { createAngleMap } from "./calculateLinks";
import drawArcs from "./drawArcs";
import drawBounds, { updateBoundHighlight } from "./drawBounds";
import { drawChangeCircles } from "./drawChangeCircles";
import drawLabels, { updateLabelHighlight, updateLabels } from "./drawLabels";
import drawLinks, { updateFDEBLinks, updateLinkHighlight } from "./drawLinks";
import drawSelectionBrush from "./drawSelectionBrush";

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
  changes: NodeChange;
  links: Link[];
  isViewActive: boolean;
}

const RadialChart = ({
  dimensions,
  data,
  dataMap,
  onContextMenuTarget,
  changes,
  links,
  isViewActive,
}: RadialChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const radialZoom = useNetworkStore((s) => s.radialZoom);
  const setRadialZoom = useNetworkStore((s) => s.setRadialZoom);
  const attributeInfo = useMetricsStore((s) => s.metricsInfo);
  const setHoveredNode = useNetworkStore((s) => s.setHoveredNode);
  const hoveredNode = useNetworkStore((s) => s.hoveredNode);
  const { setupZoom, resetZoom } = useZoom();
  const radialSettings = useSettingsStore((s) => s.radialSettings);
  const {
    innerRadius,
    outerRadius,
    fontSize,
    truncateLabels,
    labelWidth,
    maxLabelWidth,
    separateMetrics,
    linkRenderingMode,
    fdebSettings,
  } = radialSettings;
  const displayMode = useSettingsStore((s) => s.displaySettings.displayMode);
  const { allKeys, enabledAttributeKeys, enabledCentralityKeys } = useKeys();
  const resetZoomFlag = useNetworkStore((s) => s.resetRadialZoomFlag);
  const chartData = useChartData(data, allKeys);
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  const handleNodeHover = (nodeId: string | null) => {
    if (nodeId === null) {
      setHoveredNode(null);
      return;
    }

    const data = dataMap.get(nodeId);
    if (data) {
      setHoveredNode(data);
    }
  };

  const interactionProps: InteractionProps = {
    onHover: handleNodeHover,
    onTooltipShow: showTooltip,
    onTooltipHide: hideTooltip,
    onContextMenu: onContextMenuTarget,
  };

  useEffect(() => {
    if (resetZoomFlag) {
      resetZoom(svgRef, () => setRadialZoom(d3.zoomIdentity));
      useNetworkStore.setState({ resetRadialZoomFlag: false });
    }
  }, [resetZoomFlag]);

  const visibleData = useMemo(() => {
    return data.filter((d) => !d.hidden);
  }, [data]);

  const xScale = useMemo(() => {
    const dataLength = visibleData.length;
    const outerPadding = scalePadding(dataLength, 50, 0.25);
    const innerPadding = scalePadding(dataLength, 50, 0.5);

    return d3
      .scaleBand<string>()
      .domain(visibleData.map((d) => d.id))
      .range([0, 2 * Math.PI])
      .align(0.5)
      .padding(outerPadding)
      .paddingInner(innerPadding);
  }, [visibleData]);

  const angleMap = useMemo(() => {
    if (!xScale) return new Map<string, number>();
    return createAngleMap(xScale);
  }, [xScale]);

  const removedIds = useMemo(
    () => new Set(Object.keys(changes.removed)),
    [changes.removed],
  );

  const { yScale, getKeyIndex } = useMemo(() => {
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

    return { yScale: y, getKeyIndex };
  }, [
    innerRadius,
    outerRadius,
    separateMetrics,
    displayMode,
    enabledCentralityKeys,
    enabledAttributeKeys,
  ]);

  const totalLabelWidth = truncateLabels ? maxLabelWidth : labelWidth;

  useEffect(() => {
    if (
      !svgRef.current ||
      !dimensions?.width ||
      !dimensions?.height ||
      !chartData
    )
      return;

    const svg = d3.select(svgRef.current);
    let svgGroup = svg.select<SVGGElement>("g.zoom-group");

    if (svgGroup.empty()) {
      svgGroup = svg.append("g").attr("class", "zoom-group");
      setupZoom(svg, svgGroup, radialZoom, setRadialZoom);
    }

    const { series, arcData } = chartData;

    const bounds = calculateBounds(series, xScale, yScale, getKeyIndex);
    drawArcs(
      svgGroup,
      arcData,
      xScale,
      yScale,
      attributeInfo,
      interactionProps,
      getKeyIndex,
    );

    drawLinks(
      svgGroup,
      links,
      xScale,
      innerRadius,
      selectedNodes,
      linkRenderingMode,
      removedIds,
      fdebSettings,
      angleMap,
      hoveredNode,
    );
    drawBounds(
      svgGroup,
      bounds,
      innerRadius,
      outerRadius,
      selectedNodes,
      hoveredNode,
    );
    drawLabels(
      svgGroup,
      xScale,
      outerRadius + 25,
      selectedNodes,
      fontSize,
      totalLabelWidth,
      truncateLabels,
      interactionProps,
      hoveredNode,
    );

    drawChangeCircles(svgGroup, xScale, outerRadius, changes, interactionProps);

    drawSelectionBrush(
      svgGroup,
      outerRadius,
      totalLabelWidth,
      xScale,
      isViewActive,
    );
  }, [
    dimensions,
    innerRadius,
    outerRadius,
    separateMetrics,
    chartData,
    linkRenderingMode,
    changes,
  ]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    updateBoundHighlight(svg, selectedNodes, hoveredNode);
    updateLabelHighlight(svg, selectedNodes, hoveredNode);
    updateLinkHighlight(svg, selectedNodes, hoveredNode);
  }, [selectedNodes, hoveredNode]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    updateLabels(svg, fontSize, totalLabelWidth, truncateLabels);
  }, [fontSize, totalLabelWidth, truncateLabels]);

  useEffect(() => {
    if (!svgRef.current || linkRenderingMode !== "fdeB") return;
    const svg = d3.select(svgRef.current);
    updateFDEBLinks(svg, innerRadius, fdebSettings, angleMap);
  }, [fdebSettings]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");
    if (svgGroup.empty()) return;
    drawSelectionBrush(
      svgGroup,
      outerRadius,
      totalLabelWidth,
      xScale,
      isViewActive,
    );
  }, [totalLabelWidth, isViewActive]);

  useEffect(() => {
    if (!hoveredNode) return;
    const freshData = dataMap.get(hoveredNode.id);
    if (freshData) {
      setHoveredNode(freshData);
    } else {
      setHoveredNode(null);
    }
  }, [dataMap, hoveredNode?.id]);

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
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      />
      <ChartTooltip {...tooltip} dataMap={dataMap} />
    </div>
  );
};

export default RadialChart;
