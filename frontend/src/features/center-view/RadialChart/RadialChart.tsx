import { Spinner } from "@/components/ui/spinner";
import type { ContextType } from "@/features/center-view/CenterView";
import {
  getClosestZoomLevel,
  useZoom,
} from "@/features/center-view/hooks/useZoom";
import { useRadialChartData } from "@/features/center-view/RadialChart/utils/useRadialChartData";
import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, FullData } from "@/types/network";
import * as d3 from "d3";
import throttle from "lodash.throttle";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import ChartTooltip from "../Tooltips/ChartTooltip";
import { useTooltip, type InteractionProps } from "../Tooltips/useTooltip";
import drawArcsCanvas, {
  getProcessedArcs,
  redrawArcsCanvasOnZoom,
} from "./drawArcsCanvas";
import {
  drawBoundsCanvas,
  redrawBoundsOnZoom,
  updateBoundsHighlight,
} from "./drawBoundsCanvas";
import drawLabels, { updateLabels, updateLabelStyles } from "./drawLabels";
import drawLinksCanvas, {
  redrawLinksCanvasOnZoom,
  updateLinkHighlightCanvas,
} from "./drawLinksCanvas";
import drawOuterLayersCanvas, {
  redrawOuterLayerOnZoom,
} from "./drawOuterLayersCanvas";
import drawSelectionBrush from "./drawSelectionBrush";
import drawInteractionCanvas, {
  updateInteractionData,
} from "./InteractionCanvas";
import calculateBounds from "./utils/calculateBounds";

interface RadialChartProps {
  dimensions: DOMRectReadOnly | null;
  data: FullData[];
  nodeMap: Map<string, FullData>;
  nodeChanges: DataChanges;
  edgeMap: Map<string, FullData>;
  edgeChanges: DataChanges;
  isViewActive: boolean;
  handleContextMenu: (target: ContextType, data?: any) => void;
  onUpdateStateChange: (isUpdating: boolean) => void;
}

const RadialChart = ({
  dimensions,
  data,
  nodeMap,
  nodeChanges,
  edgeMap,
  edgeChanges,
  isViewActive,
  handleContextMenu,
  onUpdateStateChange,
}: RadialChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [currentZoomLevel, setCurrentZoomLevel] = useState(1);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isDrawReady, setIsDrawReady] = useState(false);
  const attributeInfo = useMetricsStore((s) => s.currentMetricsInfo);
  const resetZoomFlag = useNetworkStore((s) => s.resetRadialZoomFlag);
  const hoveredNode = useNetworkStore((s) => s.hoveredNode);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const hoveredCommunity = useNetworkStore((s) => s.hoveredCommunity);
  const { setupZoom, resetZoom, getCurrentTransform } = useZoom([0.3, 6]);
  const {
    selectedCommunity,
    truncateLabels,
    maxLabelWidth,
    displayLabel,
    innerRadius,
    outerRadius,
    fontSize,
    separateMetrics,
    communitiesInArcs,
    edgeRenderingMode,
    fdebSettings,
    showLabels,
  } = useSettingsStore(
    useShallow((s) => ({
      selectedCommunity: s.displaySettings.selectedCommunity,
      truncateLabels: s.displaySettings.truncateLabels,
      maxLabelWidth: s.displaySettings.maxLabelWidth,
      displayLabel: s.displaySettings.displayLabel,
      innerRadius: s.radialSettings.innerRadius,
      outerRadius: s.radialSettings.outerRadius,
      fontSize: s.radialSettings.fontSize,
      separateMetrics: s.radialSettings.separateMetrics,
      communitiesInArcs: s.radialSettings.communitiesInArcs,
      edgeRenderingMode: s.radialSettings.edgeRenderingMode,
      fdebSettings: s.radialSettings.fdebSettings,
      showLabels: s.radialSettings.showLabels,
    })),
  );

  const {
    enabledNodeAttributeKeys,
    enabledNodeCentralityKeys,
    enabledNodeCommunityKeys,
  } = useKeys();
  const { onNodeHover, showTooltip, hideTooltip } = useTooltip(nodeMap);
  const interactionProps: InteractionProps = useMemo(
    () => ({
      onNodeHover: onNodeHover,
      onTooltipShow: showTooltip,
      onTooltipHide: hideTooltip,
      onContextMenu: handleContextMenu,
    }),
    [onNodeHover, showTooltip, hideTooltip, handleContextMenu],
  );

  const { chartData, xScale, angleMap, yScale, getKeyIndex, outerArcsWidth } =
    useRadialChartData({
      data,
      enabledCentralityKeys: enabledNodeCentralityKeys,
      enabledAttributeKeys: enabledNodeAttributeKeys,
      enabledCommunityKeys: enabledNodeCommunityKeys,
      communitiesInArcs,
      separateMetrics,
      innerRadius,
      outerRadius,
    });

  const latestValuesRef = useRef({
    chartData,
    innerRadius,
    outerRadius,
    outerArcsWidth,
    showLabels,
  });

  useEffect(() => {
    latestValuesRef.current = {
      chartData,
      innerRadius,
      outerRadius,
      outerArcsWidth,
      showLabels,
    };
  }, [chartData, innerRadius, outerRadius, outerArcsWidth, showLabels]);

  const handleZoomChange = useRef(
    throttle((k: number) => {
      const newZoomLevel = getClosestZoomLevel(k);
      setCurrentZoomLevel(newZoomLevel);
    }, 150),
  ).current;

  useEffect(() => {
    if (resetZoomFlag) {
      resetZoom(svgRef);
      useNetworkStore.setState({ resetRadialZoomFlag: false });
    }
  }, [resetZoomFlag]);

  useEffect(() => {
    let cancelled = false;
    let abortController = new AbortController();
    setIsDrawReady(false);
    (async () => {
      if (!svgRef.current || !dimensions) return;
      if (!chartData) {
        setIsCanvasReady(true);
        onUpdateStateChange(false);
        setIsDrawReady(true);
        return;
      }
      if (isCanvasReady) onUpdateStateChange(true);

      const svg = d3.select(svgRef.current);
      let svgGroup = svg.select<SVGGElement>("g.zoom-group");

      if (svgGroup.empty()) {
        svgGroup = svg.append("g").attr("class", "zoom-group");
        setupZoom(svg, svgGroup, getCurrentTransform(), handleZoomChange);
      }

      const { series } = chartData;
      const bounds = calculateBounds(series, xScale, yScale, getKeyIndex);
      const zoomLevel = getClosestZoomLevel(getCurrentTransform().k);

      await drawLinksCanvas(
        svgGroup,
        edgeMap,
        xScale,
        selectedNodes,
        edgeRenderingMode,
        edgeChanges,
        fdebSettings,
        angleMap,
        hoveredNode,
        innerRadius,
        zoomLevel,
        abortController.signal,
      );

      if (cancelled) return;

      const processedArcs = drawArcsCanvas(
        svgGroup,
        series,
        xScale,
        yScale,
        attributeInfo,
        getKeyIndex,
        outerRadius,
        outerArcsWidth,
      );

      drawBoundsCanvas(
        svgGroup,
        bounds,
        innerRadius,
        outerRadius,
        outerArcsWidth,
        zoomLevel,
      );

      drawLabels(
        svgGroup,
        nodeMap,
        xScale,
        outerRadius,
        fontSize,
        maxLabelWidth,
        truncateLabels,
        interactionProps,
        outerArcsWidth,
        showLabels,
        displayLabel,
        selectedCommunity !== "none",
      );

      const outerLayerData = drawOuterLayersCanvas(
        svgGroup,
        nodeMap,
        selectedCommunity,
        xScale,
        outerRadius,
        outerArcsWidth,
        nodeChanges,
        zoomLevel,
      );
      const {
        segments,
        changeCircles,
        innerRadius: communityInnerRadius,
        outerRadius: communityOuterRadius,
        totalCommunities,
      } = outerLayerData;

      drawInteractionCanvas(
        svgGroup,
        processedArcs,
        changeCircles,
        segments,
        outerArcsWidth,
        communityInnerRadius,
        communityOuterRadius,
        outerRadius,
        interactionProps,
        nodeChanges,
        totalCommunities,
      );

      requestAnimationFrame(() => {
        updateLabelStyles(
          svgGroup,
          nodeMap,
          selectedNodes,
          hoveredNode,
          zoomLevel,
          outerArcsWidth,
          showLabels,
          hoveredCommunity,
        );
        updateBoundsHighlight(
          nodeMap,
          selectedNodes,
          hoveredNode,
          hoveredCommunity,
        );
        updateLinkHighlightCanvas(svgGroup, selectedNodes, hoveredNode);

        setIsCanvasReady(true);
        onUpdateStateChange(false);
        setIsDrawReady(true);
      });
    })();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [dimensions, innerRadius, outerRadius, separateMetrics, chartData]);

  useEffect(() => {
    if (!isDrawReady || !svgRef.current || !chartData) return;

    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");

    if (svgGroup.empty()) return;

    const zoomLevel = getClosestZoomLevel(getCurrentTransform().k);

    const outerLayerData = drawOuterLayersCanvas(
      svgGroup,
      nodeMap,
      selectedCommunity,
      xScale,
      outerRadius,
      outerArcsWidth,
      nodeChanges,
      zoomLevel,
    );

    drawLabels(
      svgGroup,
      nodeMap,
      xScale,
      outerRadius,
      fontSize,
      maxLabelWidth,
      truncateLabels,
      interactionProps,
      outerArcsWidth,
      showLabels,
      displayLabel,
      selectedCommunity !== "none",
    );

    updateInteractionData(
      getProcessedArcs(),
      outerLayerData.changeCircles,
      outerLayerData.segments,
      outerLayerData.totalCommunities,
    );
  }, [isDrawReady, selectedCommunity]);

  useEffect(() => {
    if (!isDrawReady || !svgRef.current || !chartData) return;

    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");

    if (svgGroup.empty()) return;

    const hoveredNode = useNetworkStore.getState().hoveredNode;
    const hoveredCommunity = useNetworkStore.getState().hoveredCommunity;

    requestAnimationFrame(() => {
      redrawArcsCanvasOnZoom(
        svgGroup,
        outerRadius,
        outerArcsWidth,
        currentZoomLevel,
      );
      redrawLinksCanvasOnZoom(svgGroup, innerRadius, currentZoomLevel);
      redrawBoundsOnZoom(currentZoomLevel);
      redrawOuterLayerOnZoom(currentZoomLevel);
      updateLabelStyles(
        svgGroup,
        nodeMap,
        selectedNodes,
        hoveredNode,
        currentZoomLevel,
        outerArcsWidth,
        showLabels,
        hoveredCommunity,
        true,
      );
    });
  }, [currentZoomLevel]);

  useEffect(() => {
    if (!isDrawReady) return;
    let previousHoveredNode = useNetworkStore.getState().hoveredNode;
    let previousHoveredCommunity = useNetworkStore.getState().hoveredCommunity;
    let previousSelectedNodes = useNetworkStore.getState().selectedNodes;

    const unsubscribe = useNetworkStore.subscribe((state) => {
      if (
        state.hoveredNode === previousHoveredNode &&
        state.hoveredCommunity === previousHoveredCommunity &&
        state.selectedNodes === previousSelectedNodes
      )
        return;
      previousHoveredNode = state.hoveredNode;
      previousHoveredCommunity = state.hoveredCommunity;
      previousSelectedNodes = state.selectedNodes;

      if (!svgRef.current) return;

      const svgGroup = d3
        .select(svgRef.current)
        .select<SVGGElement>("g.zoom-group");
      requestAnimationFrame(() => {
        updateLabelStyles(
          svgGroup,
          nodeMap,
          state.selectedNodes,
          state.hoveredNode,
          getClosestZoomLevel(getCurrentTransform().k),
          outerArcsWidth,
          showLabels,
          state.hoveredCommunity,
        );
        updateBoundsHighlight(
          nodeMap,
          state.selectedNodes,
          state.hoveredNode,
          state.hoveredCommunity,
        );
        updateLinkHighlightCanvas(
          svgGroup,
          state.selectedNodes,
          state.hoveredNode,
        );
      });
    });

    return unsubscribe;
  }, [isDrawReady, showLabels]);

  useEffect(() => {
    if (!svgRef.current || !chartData || !dimensions) return;
    const svg = d3.select(svgRef.current);
    updateLabels(
      svg,
      nodeMap,
      fontSize,
      maxLabelWidth,
      truncateLabels,
      outerArcsWidth,
      displayLabel,
    );
    updateLabelStyles(
      svg.select<SVGGElement>("g.zoom-group"),
      nodeMap,
      selectedNodes,
      hoveredNode,
      getClosestZoomLevel(getCurrentTransform().k),
      outerArcsWidth,
      showLabels,
      hoveredCommunity,
    );
  }, [
    fontSize,
    maxLabelWidth,
    truncateLabels,
    showLabels,
    hoveredCommunity,
    displayLabel,
    isViewActive,
  ]);

  useEffect(() => {
    if (!svgRef.current || !dimensions) {
      return;
    }
    onUpdateStateChange(true);
    let cancelled = false;
    let abortController = new AbortController();
    (async () => {
      const svgGroup = d3
        .select(svgRef.current)
        .select<SVGGElement>("g.zoom-group");

      const hoveredNode = useNetworkStore.getState().hoveredNode;
      const selectedNodes = useNetworkStore.getState().selectedNodes;
      const zoomLevel = getClosestZoomLevel(getCurrentTransform().k);

      await drawLinksCanvas(
        svgGroup,
        edgeMap,
        xScale,
        selectedNodes,
        edgeRenderingMode,
        edgeChanges,
        fdebSettings,
        angleMap,
        hoveredNode,
        innerRadius,
        zoomLevel,
        abortController.signal,
      );
      if (cancelled) return;
      requestAnimationFrame(() => {
        onUpdateStateChange(false);
      });
    })();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [fdebSettings, edgeRenderingMode]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");
    drawSelectionBrush(svgGroup, outerRadius, xScale, isViewActive);
  }, [isViewActive, xScale, outerRadius]);

  const showSpinner =
    !dimensions?.width || !dimensions?.height || !isCanvasReady;

  return (
    <>
      {showSpinner && (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <Spinner className="size-10" />
          <p className="mt-2 text-center text-muted-foreground">
            Rendering visualization...
          </p>
        </div>
      )}
      <div
        className="relative h-full"
        style={{
          opacity: showSpinner ? 0 : 1,
          transition: "opacity 0.2s ease-in-out",
        }}
        onContextMenu={(e) => {
          if ((e.nativeEvent as any)._handledByChild) return;
          handleContextMenu("radial");
        }}
      >
        <svg
          ref={svgRef}
          viewBox="-800 -800 1600 1600"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
        />
        <ChartTooltip dataMap={nodeMap} />
      </div>
    </>
  );
};

export default RadialChart;
