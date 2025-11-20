import { Spinner } from "@/components/ui/spinner";
import type { ContextType } from "@/features/center-view/CenterView";
import ChartTooltip from "@/features/center-view/Tooltips/ChartTooltip";
import {
  useTooltip,
  type InteractionProps,
} from "@/features/center-view/Tooltips/useTooltip";
import {
  getClosestZoomLevel,
  useZoom,
} from "@/features/center-view/hooks/useZoom";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type {
  DataChanges,
  FullData,
  Link,
  Network,
  Node,
} from "@/types/network";
import type { Simulation } from "d3";
import * as d3 from "d3";
import throttle from "lodash.throttle";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import drawLabels, {
  updateLabelHighlight,
  updateLabelVisibility,
} from "./drawLabels";
import drawSelectionBrush from "./drawSelectionBrush";
import {
  calculateLinkWeights,
  calculateNodeSizes,
  setupNodeEvents,
} from "./nodeLinkUtils";
import createSimulation, {
  updateCollisionRadiuses,
  updateSimulationForces,
} from "./setupSimulation";
import updateGraph, { updateStyle } from "./updateGraph";

interface NodeLinkDiagramProps {
  dimensions: DOMRectReadOnly | null;
  filteredNetwork: Network;
  nodeData: Map<string, FullData>;
  edgeData: Map<string, FullData>;
  handleContextMenu: (target: ContextType, data?: any) => void;
  nodeChanges: DataChanges;
  edgeChanges: DataChanges;
  isViewActive: boolean;
  onUpdateStateChange: (isUpdating: boolean) => void;
}

const NodeLinkDiagram = ({
  dimensions,
  filteredNetwork,
  nodeData,
  edgeData,
  handleContextMenu,
  nodeChanges,
  edgeChanges,
  isViewActive,
  onUpdateStateChange,
}: NodeLinkDiagramProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Link> | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isSimulationStable, setIsSimulationStable] = useState(false);
  const isInitializedRef = useRef(false);
  const { setupZoom, resetZoom, getCurrentTransform } = useZoom([0.1, 6]);
  const networkData = useNetworkStore.getState().network;
  const resetZoomFlag = useNetworkStore((s) => s.resetNodeLinkZoomFlag);
  const lastZoomLevel = useRef(1);
  const { onNodeHover, showTooltip, hideTooltip } = useTooltip(nodeData);
  const restartSimulationFlag = useNetworkStore((s) => s.restartSimulationFlag);
  const setRestartSimulationFlag = useNetworkStore(
    (s) => s.setRestartSimulationFlag,
  );
  const nodeLinkSettings = useSettingsStore(
    useShallow((s) => s.nodeLinkSettings),
  );
  const {
    nodeSizeMode,
    nodeScaleType,
    nodeSizeMetric,
    fixedNodeSize,
    minNodeSize,
    maxNodeSize,
    linkDistance,
    linkScaleType,
    linkThicknessMode,
    maxLinkThickness,
    minLinkThickness,
    fixedLinkThickness,
    chargeStrength,
    collisionEnabled,
    linkThicknessMetric,
    showLabels,
  } = nodeLinkSettings;

  const interactionProps: InteractionProps = useMemo(
    () => ({
      onNodeHover: onNodeHover,
      onTooltipShow: showTooltip,
      onTooltipHide: hideTooltip,
      onContextMenu: handleContextMenu,
    }),
    [onNodeHover, showTooltip, hideTooltip, handleContextMenu],
  );

  const nodeSizes = useMemo(() => {
    return calculateNodeSizes(
      networkData.nodes,
      nodeData,
      nodeSizeMode,
      nodeSizeMetric,
      fixedNodeSize,
      minNodeSize,
      maxNodeSize,
      nodeScaleType,
    );
  }, [
    networkData.nodes,
    nodeData,
    nodeSizeMode,
    nodeSizeMetric,
    fixedNodeSize,
    minNodeSize,
    maxNodeSize,
    nodeScaleType,
  ]);

  const linkWeights = useMemo(() => {
    return calculateLinkWeights(
      networkData.links,
      edgeData,
      linkThicknessMode,
      linkThicknessMetric,
      fixedLinkThickness,
      minLinkThickness,
      maxLinkThickness,
      linkScaleType,
    );
  }, [
    networkData.links,
    linkThicknessMode,
    fixedLinkThickness,
    linkThicknessMetric,
    minLinkThickness,
    maxLinkThickness,
    linkScaleType,
  ]);

  const latestValuesRef = useRef({
    nodeData,
    showLabels,
  });

  useEffect(() => {
    latestValuesRef.current = {
      nodeData,
      showLabels,
    };
  }, [nodeData, showLabels]);

  const zoomUpdates = useRef(
    throttle((currentK: number) => {
      const { showLabels, nodeData } = latestValuesRef.current;

      if (!svgRef.current) return;
      const zoomLevel = getClosestZoomLevel(currentK);
      if (zoomLevel === lastZoomLevel.current) return;
      lastZoomLevel.current = zoomLevel;

      const hoveredNode = useNetworkStore.getState().hoveredNode;
      const selectedNodes = useNetworkStore.getState().selectedNodes;

      requestAnimationFrame(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);

        updateLabelVisibility(
          svg,
          nodeData,
          selectedNodes,
          hoveredNode,
          showLabels,
          zoomLevel,
        );
      });
    }, 150),
  ).current;

  useEffect(() => {
    if (!svgRef.current || isInitializedRef.current) return;

    const svg = d3.select(svgRef.current);
    const svgGroup = svg.append("g").attr("class", "zoom-group");

    setupZoom(svg, svgGroup, getCurrentTransform(), (k) => zoomUpdates(k));

    svgGroup.append("g").attr("class", "links-group");
    svgGroup.append("g").attr("class", "nodes-group");

    const hoveredNode = useNetworkStore.getState().hoveredNode;
    const selectedNodes = useNetworkStore.getState().selectedNodes;

    simulationRef.current = createSimulation(
      networkData.nodes,
      networkData.links,
      {
        linkDistance: linkDistance,
        chargeStrength: chargeStrength,
        collisionEnabled: collisionEnabled,
        collisionRadiuses: nodeSizes,
      },
    );

    const checkStability = () => {
      if (simulationRef.current && simulationRef.current.alpha() < 0.01) {
        setIsSimulationStable(true);
        requestAnimationFrame(() => setIsCanvasReady(true));
      } else {
        requestAnimationFrame(checkStability);
      }
    };
    requestAnimationFrame(checkStability);

    if (
      networkData &&
      networkData.nodes?.length &&
      networkData.links?.length &&
      nodeData
    ) {
      updateGraph(
        svg,
        simulationRef.current,
        filteredNetwork,
        selectedNodes,
        nodeChanges,
        edgeChanges,
        nodeSizes,
        linkWeights,
        hoveredNode,
        nodeData,
      );
      drawLabels(svg, networkData.nodes, nodeSizes, showLabels);
      drawSelectionBrush(svgGroup, filteredNetwork.nodes, isViewActive);
      setupNodeEvents(svg, interactionProps);
    }

    isInitializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!simulationRef.current || !isSimulationStable || !dimensions) return;
    updateSimulationForces(simulationRef.current, linkDistance, chargeStrength);
  }, [linkDistance, chargeStrength]);

  useEffect(() => {
    if (!simulationRef.current || !isSimulationStable || !dimensions) return;
    updateCollisionRadiuses(simulationRef.current, nodeSizes, collisionEnabled);
  }, [collisionEnabled, nodeSizes]);

  useEffect(() => {
    if (
      !simulationRef.current ||
      !svgRef.current ||
      !simulationRef.current ||
      !isSimulationStable
    ) {
      return;
    }
    if (isCanvasReady && isInitializedRef.current) onUpdateStateChange(true);
    let frameId: number;

    const svg = d3.select(svgRef.current);
    const hoveredNode = useNetworkStore.getState().hoveredNode;
    const selectedNodes = useNetworkStore.getState().selectedNodes;

    const runUpdate = () => {
      updateGraph(
        svg,
        simulationRef.current!,
        filteredNetwork,
        selectedNodes,
        nodeChanges,
        edgeChanges,
        nodeSizes,
        linkWeights,
        hoveredNode,
        nodeData,
      );

      setupNodeEvents(svg, interactionProps);
    };

    frameId = requestAnimationFrame(runUpdate);

    requestAnimationFrame(() => {
      onUpdateStateChange(false);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [nodeChanges, edgeChanges, linkWeights, nodeSizes, showLabels]);

  useEffect(() => {
    if (
      !svgRef.current ||
      !simulationRef.current ||
      !isSimulationStable ||
      !dimensions
    ) {
      return;
    }

    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");

    drawSelectionBrush(svgGroup, filteredNetwork.nodes, isViewActive);
  }, [isViewActive]);

  useEffect(() => {
    if (!isInitializedRef.current) return;

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

      if (!svgRef.current || !nodeData) return;
      const svg = d3.select(svgRef.current);

      updateStyle(
        svg,
        state.selectedNodes,
        nodeSizes,
        linkWeights,
        nodeChanges,
        edgeChanges,
        state.hoveredNode,
        nodeData,
      );
      updateLabelHighlight(
        svg,
        nodeData,
        state.selectedNodes,
        state.hoveredNode,
        showLabels,
        getClosestZoomLevel(getCurrentTransform().k),
      );
    });

    return unsubscribe;
  }, [nodeChanges, edgeChanges, nodeSizes, linkWeights, showLabels]);

  useEffect(() => {
    if (!svgRef.current || !isInitializedRef.current) return;

    const svg = d3.select(svgRef.current);
    const hoveredNode = useNetworkStore.getState().hoveredNode;
    const selectedNodes = useNetworkStore.getState().selectedNodes;
    const zoomLevel = getClosestZoomLevel(getCurrentTransform().k);
    updateLabelVisibility(
      svg,
      nodeData,
      selectedNodes,
      hoveredNode,
      showLabels,
      zoomLevel,
    );
    updateLabelHighlight(
      svg,
      nodeData,
      selectedNodes,
      hoveredNode,
      showLabels,
      zoomLevel,
    );
  }, [showLabels, nodeData]);

  useEffect(() => {
    if (resetZoomFlag) {
      resetZoom(svgRef);
      useNetworkStore.setState({ resetNodeLinkZoomFlag: false });
    }
  }, [resetZoomFlag]);

  useEffect(() => {
    if (restartSimulationFlag && simulationRef.current) {
      simulationRef.current.alpha(1).restart();
      setRestartSimulationFlag(false);
    }
  }, [restartSimulationFlag]);

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
          handleContextMenu("node-link");
        }}
      >
        <svg
          ref={svgRef}
          viewBox="-800 -800 1600 1600"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full bg-card"
          style={{
            shapeRendering: "geometricPrecision",
          }}
        />
        <ChartTooltip dataMap={nodeData} />
      </div>
    </>
  );
};

export default NodeLinkDiagram;
