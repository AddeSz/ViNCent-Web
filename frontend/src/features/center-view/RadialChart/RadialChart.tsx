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
import drawLabels, { updateLabelHighlight, updateLabels } from "./drawLabels";
import drawLinksCanvas, {
  redrawLinksCanvasOnZoom,
  updateLinkHighlightCanvas,
} from "./drawLinksCanvas";
import drawSelectionBrush from "./drawSelectionBrush";
import calculateBounds from "./utils/calculateBounds";

interface RadialChartProps {
  dimensions: DOMRectReadOnly | null;
  data: FullData[];
  dataMap: Map<string, FullData>;
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
  dataMap,
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
  const attributeInfo = useMetricsStore((s) => s.metricsInfo);
  const resetZoomFlag = useNetworkStore((s) => s.resetRadialZoomFlag);

  const { setupZoom, resetZoom, getCurrentTransform } = useZoom([0.3, 6]);
  const radialSettings = useSettingsStore(useShallow((s) => s.radialSettings));
  const { separateMetrics, linkRenderingMode, fdebSettings } = radialSettings;
  const { enabledNodeKeys, enabledAttributeKeys, enabledCentralityKeys } =
    useKeys();

  const { onNodeHover, showTooltip, hideTooltip } = useTooltip(dataMap);

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
  });

  useEffect(() => {
    latestValuesRef.current = {
      chartData,
      innerRadius,
      outerRadius,
      radius,
    };
  }, [chartData, innerRadius, outerRadius, radius]);

  const redrawCanvas = useRef(
    throttle((currentK: number) => {
      const { chartData, innerRadius, outerRadius } = latestValuesRef.current;

      if (!svgRef.current || !chartData) return;

      const zoomLevel = getClosestZoomLevel(currentK);

      if (zoomLevel === lastZoomLevel.current) return;
      lastZoomLevel.current = zoomLevel;
      requestAnimationFrame(() => {
        if (!svgRef.current || !chartData) return;

        const svg = d3.select(svgRef.current);
        const svgGroup = svg.select<SVGGElement>("g.zoom-group");
        if (svgGroup.empty()) return;

        redrawArcsCanvasOnZoom(svgGroup, outerRadius, radius, currentK);
        redrawLinksCanvasOnZoom(svgGroup, innerRadius, currentK);
      });
    }, 150),
  ).current;

  useEffect(() => {
    if (resetZoomFlag) {
      resetZoom(svgRef);
      useNetworkStore.setState({ resetRadialZoomFlag: false });
    }
  }, [resetZoomFlag, resetZoom]);

  useEffect(() => {
    let cancelled = false;
    let abortController = new AbortController();

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

      drawBoundsHighlight(
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
        outerRadius,
        selectedNodes,
        fontSize,
        totalLabelWidth,
        truncateLabels,
        interactionProps,
        hoveredNode,
        radius,
      );

      requestAnimationFrame(() => {
        setIsCanvasReady(true);
        onUpdateStateChange(false);
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

      updateLabelHighlight(svgGroup, state.selectedNodes, state.hoveredNode);
      updateBoundsHighlight(svgGroup, state.selectedNodes, state.hoveredNode);
      updateLinkHighlightCanvas(
        svgGroup,
        state.selectedNodes,
        state.hoveredNode,
      );
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!svgRef.current || !chartData || !dimensions) return;
    const svg = d3.select(svgRef.current);
    updateLabels(svg, fontSize, totalLabelWidth, truncateLabels, radius);
  }, [fontSize, totalLabelWidth, truncateLabels]);

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
    drawSelectionBrush(
      svgGroup,
      outerRadius,
      totalLabelWidth,
      xScale,
      isViewActive,
    );
  }, [totalLabelWidth, isViewActive, xScale]);

  useEffect(() => {
    const hoveredNode = useNetworkStore.getState().hoveredNode;
    if (!hoveredNode) return;
    const freshData = dataMap.get(hoveredNode.id);
    if (freshData) {
      onNodeHover(hoveredNode.id);
    } else {
      onNodeHover(null);
    }
  }, [dataMap]);

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
        <ChartTooltip dataMap={dataMap} />
      </div>
    </>
  );
};

export default RadialChart;
