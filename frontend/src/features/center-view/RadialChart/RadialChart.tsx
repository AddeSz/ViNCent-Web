import { Spinner } from "@/components/ui/spinner";
import type { ContextType } from "@/features/center-view/CenterView";
import { useRadialChartData } from "@/features/center-view/RadialChart/utils/useRadialChartData";
import {
  getClosestZoomLevel,
  useZoom,
} from "@/features/center-view/hooks/useZoom";
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
import drawArcsCanvas, { redrawArcsCanvasOnZoom } from "./drawArcsCanvas";
import {
  drawBoundsHighlight,
  updateBoundsHighlight,
} from "./drawBoundsHighlight ";
import drawLabels, {
  updateLabelHighlight,
  updateLabels,
  updateLabelVisibility,
} from "./drawLabels";
import drawLinksCanvas, {
  redrawLinksCanvasOnZoom,
  updateLinkHighlightCanvas,
} from "./drawLinksCanvas";
import drawSelectionBrush from "./drawSelectionBrush";
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
  const lastZoomLevel = useRef(1);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isDrawReady, setIsDrawReady] = useState(false);
  const attributeInfo = useMetricsStore((s) => s.metricsInfo);
  const resetZoomFlag = useNetworkStore((s) => s.resetRadialZoomFlag);
  const hoveredNode = useNetworkStore((state) => state.hoveredNode);
  const selectedNodes = useNetworkStore((state) => state.selectedNodes);
  const { setupZoom, resetZoom, getCurrentTransform } = useZoom([0.3, 10]);
  const radialSettings = useSettingsStore(useShallow((s) => s.radialSettings));
  const { separateMetrics, linkRenderingMode, fdebSettings, showLabels } =
    radialSettings;
  const { enabledNodeKeys, enabledAttributeKeys, enabledCentralityKeys } =
    useKeys();

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

  const {
    chartData,
    xScale,
    angleMap,
    yScale,
    getKeyIndex,
    totalLabelWidth,
    radius,
    innerRadius,
    outerRadius,
    fontSize,
    truncateLabels,
  } = useRadialChartData({
    data,
    allKeys: enabledNodeKeys,
    enabledCentralityKeys,
    enabledAttributeKeys,
  });

  const latestValuesRef = useRef({
    chartData,
    innerRadius,
    outerRadius,
    radius,
    showLabels,
  });

  useEffect(() => {
    latestValuesRef.current = {
      chartData,
      innerRadius,
      outerRadius,
      radius,
      showLabels,
    };
  }, [chartData, innerRadius, outerRadius, radius, showLabels]);

  const redrawCanvas = useRef(
    throttle((currentK: number) => {
      const { chartData, innerRadius, outerRadius, radius, showLabels } =
        latestValuesRef.current;

      if (!svgRef.current || !chartData) return;

      const zoomLevel = getClosestZoomLevel(currentK);

      if (zoomLevel === lastZoomLevel.current) return;
      lastZoomLevel.current = zoomLevel;
      const hoveredNode = useNetworkStore.getState().hoveredNode;
      const selectedNodes = useNetworkStore.getState().selectedNodes;
      requestAnimationFrame(() => {
        if (!svgRef.current || !chartData) return;

        const svg = d3.select(svgRef.current);
        const svgGroup = svg.select<SVGGElement>("g.zoom-group");
        if (svgGroup.empty()) return;
        redrawArcsCanvasOnZoom(svgGroup, outerRadius, radius, currentK);
        redrawLinksCanvasOnZoom(svgGroup, innerRadius, currentK);
        updateLabelVisibility(
          svgGroup,
          nodeMap,
          selectedNodes,
          hoveredNode,
          zoomLevel,
          radius,
          showLabels,
        );
      });
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
      if (!svgRef.current || !chartData || !dimensions) return;
      if (isCanvasReady) onUpdateStateChange(true);

      const svg = d3.select(svgRef.current);
      let svgGroup = svg.select<SVGGElement>("g.zoom-group");

      if (svgGroup.empty()) {
        svgGroup = svg.append("g").attr("class", "zoom-group");
        setupZoom(svg, svgGroup, getCurrentTransform(), (k) => redrawCanvas(k));
      }

      const { series } = chartData;
      const bounds = calculateBounds(series, xScale, yScale, getKeyIndex);
      const zoomLevel = getClosestZoomLevel(getCurrentTransform().k);

      await drawLinksCanvas(
        svgGroup,
        edgeMap,
        xScale,
        selectedNodes,
        linkRenderingMode,
        edgeChanges,
        fdebSettings,
        angleMap,
        hoveredNode,
        innerRadius,
        zoomLevel,
        abortController.signal,
      );

      if (cancelled) return;

      drawArcsCanvas(
        svgGroup,
        series,
        xScale,
        yScale,
        attributeInfo,
        interactionProps,
        getKeyIndex,
        innerRadius,
        outerRadius,
        bounds,
        nodeChanges,
        radius,
        zoomLevel,
      );

      drawBoundsHighlight(svgGroup, bounds, innerRadius, outerRadius);

      drawLabels(
        svgGroup,
        xScale,
        outerRadius,
        fontSize,
        totalLabelWidth,
        truncateLabels,
        interactionProps,
        radius,
        showLabels,
      );

      requestAnimationFrame(() => {
        updateLabelHighlight(
          svgGroup,
          nodeMap,
          selectedNodes,
          hoveredNode,
          zoomLevel,
          radius,
          showLabels,
        );
        updateBoundsHighlight(svgGroup, nodeMap, selectedNodes, hoveredNode);
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
  }, [
    dimensions,
    innerRadius,
    outerRadius,
    separateMetrics,
    chartData,
    linkRenderingMode,
  ]);

  useEffect(() => {
    if (!isDrawReady) return;
    let previousHoveredNode = useNetworkStore.getState().hoveredNode;
    let previousSelectedNodes = useNetworkStore.getState().selectedNodes;

    const unsubscribe = useNetworkStore.subscribe((state) => {
      if (
        state.hoveredNode === previousHoveredNode &&
        state.selectedNodes === previousSelectedNodes
      )
        return;
      previousHoveredNode = state.hoveredNode;
      previousSelectedNodes = state.selectedNodes;

      if (!svgRef.current) return;

      const svgGroup = d3
        .select(svgRef.current)
        .select<SVGGElement>("g.zoom-group");
      requestAnimationFrame(() => {
        updateLabelHighlight(
          svgGroup,
          nodeMap,
          state.selectedNodes,
          state.hoveredNode,
          getClosestZoomLevel(getCurrentTransform().k),
          radius,
          showLabels,
        );
        updateBoundsHighlight(
          svgGroup,
          nodeMap,
          state.selectedNodes,
          state.hoveredNode,
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
    updateLabels(svg, fontSize, totalLabelWidth, truncateLabels, radius);
    updateLabelHighlight(
      svg.select<SVGGElement>("g.zoom-group"),
      nodeMap,
      selectedNodes,
      hoveredNode,
      getClosestZoomLevel(getCurrentTransform().k),
      radius,
      showLabels,
    );
  }, [fontSize, totalLabelWidth, truncateLabels, showLabels]);

  useEffect(() => {
    if (!svgRef.current || linkRenderingMode !== "fdeB" || !dimensions) {
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
        linkRenderingMode,
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
  }, [fdebSettings]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");
    drawSelectionBrush(svgGroup, outerRadius, xScale, isViewActive);
  }, [totalLabelWidth, isViewActive, xScale]);

  const showSpinner =
    !dimensions?.width || !dimensions?.height || !chartData || !isCanvasReady;

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
