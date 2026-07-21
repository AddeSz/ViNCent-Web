import { Spinner } from "@/components/ui/spinner";
import type { ContextType } from "@/features/center-view/CenterView";
import ChartTooltip from "@/features/center-view/Tooltips/ChartTooltip";
import {
  getClosestZoomLevel,
  useZoom,
} from "@/features/center-view/hooks/useZoom";
import { useGetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useInteractionStore } from "@/stores/useInteractionStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, Edge, FullData, Network, Node } from "@/types";
import type { Simulation } from "d3";
import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTooltip, type InteractionProps } from "../Tooltips/useTooltip";
import drawLabels, { updateLabels, updateLabelStyles } from "./drawLabels";
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
  renderableNetwork: Network;
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
  renderableNetwork,
  nodeData,
  edgeData,
  handleContextMenu,
  nodeChanges,
  edgeChanges,
  isViewActive,
  onUpdateStateChange,
}: NodeLinkDiagramProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Edge> | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isSimulationStable, setIsSimulationStable] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(1);
  const isInitializedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const { setupZoom, resetZoom, getCurrentTransform } = useZoom([0.1, 6]);
  const networkData = useNetworkStore.getState().network;
  const resetZoomFlag = useInteractionStore((s) => s.resetNodeLinkZoomFlag);
  const prevZoomLevelRef = useRef(currentZoomLevel);
  const { onNodeHover, showTooltip, hideTooltip } = useTooltip(nodeData);
  const restartSimulationFlag = useInteractionStore(
    (s) => s.restartSimulationFlag,
  );
  const hoveredNode = useInteractionStore((s) => s.hoveredNode);
  const selectedNodes = useInteractionStore((s) => s.selectedNodes);
  const setRestartSimulationFlag = useInteractionStore(
    (s) => s.setRestartSimulationFlag,
  );
  const getColorForMetric = useGetColorForMetric();
  const {
    displayLabel,
    selectedCommunity,
    truncateLabels,
    maxLabelWidth,
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
    fontSize,
  } = useSettingsStore(
    useShallow((s) => ({
      displayLabel: s.displaySettings.displayLabel,
      selectedCommunity: s.displaySettings.selectedCommunity,
      truncateLabels: s.displaySettings.truncateLabels,
      maxLabelWidth: s.displaySettings.maxLabelWidth,
      nodeSizeMode: s.nodeLinkSettings.nodeSizeMode,
      nodeScaleType: s.nodeLinkSettings.nodeScaleType,
      nodeSizeMetric: s.nodeLinkSettings.nodeSizeMetric,
      fixedNodeSize: s.nodeLinkSettings.fixedNodeSize,
      minNodeSize: s.nodeLinkSettings.minNodeSize,
      maxNodeSize: s.nodeLinkSettings.maxNodeSize,
      linkDistance: s.nodeLinkSettings.linkDistance,
      linkScaleType: s.nodeLinkSettings.linkScaleType,
      linkThicknessMode: s.nodeLinkSettings.linkThicknessMode,
      maxLinkThickness: s.nodeLinkSettings.maxLinkThickness,
      minLinkThickness: s.nodeLinkSettings.minLinkThickness,
      fixedLinkThickness: s.nodeLinkSettings.fixedLinkThickness,
      chargeStrength: s.nodeLinkSettings.chargeStrength,
      collisionEnabled: s.nodeLinkSettings.collisionEnabled,
      linkThicknessMetric: s.nodeLinkSettings.linkThicknessMetric,
      showLabels: s.nodeLinkSettings.showLabels,
      fontSize: s.nodeLinkSettings.fontSize,
    })),
  );

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
      networkData.edges,
      edgeData,
      linkThicknessMode,
      linkThicknessMetric,
      fixedLinkThickness,
      minLinkThickness,
      maxLinkThickness,
      linkScaleType,
    );
  }, [
    networkData.edges,
    edgeData,
    linkThicknessMode,
    fixedLinkThickness,
    linkThicknessMetric,
    minLinkThickness,
    maxLinkThickness,
    linkScaleType,
  ]);

  const handleDragStateChange = (isDragging: boolean) => {
    isDraggingRef.current = isDragging;
  };

  useEffect(() => {
    if (!svgRef.current || isInitializedRef.current) return;

    const svg = d3.select(svgRef.current);
    const svgGroup = svg.append("g").attr("class", "zoom-group");

    setupZoom(svg, svgGroup, getCurrentTransform(), (k) => {
      const newZoomLevel = getClosestZoomLevel(k);
      if (newZoomLevel !== currentZoomLevel) {
        setCurrentZoomLevel(newZoomLevel);
      }
    });

    svgGroup.append("g").attr("class", "links-group");
    svgGroup.append("g").attr("class", "nodes-group");

    const hoveredNode = useInteractionStore.getState().hoveredNode;
    const selectedNodes = useInteractionStore.getState().selectedNodes;

    simulationRef.current = createSimulation(
      networkData.nodes,
      networkData.edges,
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
      networkData.edges?.length &&
      nodeData
    ) {
      drawLabels(
        svg,
        networkData.nodes,
        showLabels,
        fontSize,
        nodeData,
        displayLabel,
        truncateLabels,
        maxLabelWidth,
      );
      updateGraph(
        svg,
        simulationRef.current,
        renderableNetwork,
        selectedNodes,
        nodeChanges,
        edgeChanges,
        nodeSizes,
        linkWeights,
        hoveredNode,
        nodeData,
        selectedCommunity,
        getColorForMetric,
        (nodeId, x, y) => showTooltip({ type: "node", nodeId, x, y }),
        handleDragStateChange,
      );
      drawSelectionBrush(svgGroup, renderableNetwork.nodes, isViewActive);
      setupNodeEvents(svg, interactionProps, isDraggingRef);
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
    if (!svgRef.current || !isInitializedRef.current || !isSimulationStable)
      return;
    const svg = d3.select(svgRef.current);

    updateLabels(
      svg,
      fontSize,
      nodeSizes,
      nodeData,
      displayLabel,
      truncateLabels,
      maxLabelWidth,
    );

    const isZoomUpdate = prevZoomLevelRef.current !== currentZoomLevel;
    prevZoomLevelRef.current = currentZoomLevel;

    updateLabelStyles(
      svg,
      nodeData,
      selectedNodes,
      hoveredNode,
      showLabels,
      currentZoomLevel,
      nodeSizes,
      isZoomUpdate,
    );
  }, [
    fontSize,
    nodeSizes,
    displayLabel,
    truncateLabels,
    maxLabelWidth,
    showLabels,
    hoveredNode,
    selectedNodes,
    isViewActive,
    currentZoomLevel,
  ]);

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
    const hoveredNode = useInteractionStore.getState().hoveredNode;
    const selectedNodes = useInteractionStore.getState().selectedNodes;

    const runUpdate = () => {
      updateGraph(
        svg,
        simulationRef.current!,
        renderableNetwork,
        selectedNodes,
        nodeChanges,
        edgeChanges,
        nodeSizes,
        linkWeights,
        hoveredNode,
        nodeData,
        selectedCommunity,
        getColorForMetric,
        (nodeId, x, y) => showTooltip({ type: "node", nodeId, x, y }),
        handleDragStateChange,
      );
      setupNodeEvents(svg, interactionProps, isDraggingRef);
    };

    frameId = requestAnimationFrame(runUpdate);

    requestAnimationFrame(() => {
      onUpdateStateChange(false);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [linkWeights, nodeSizes, selectedCommunity]);

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

    drawSelectionBrush(svgGroup, renderableNetwork.nodes, isViewActive);
  }, [isViewActive]);

  useEffect(() => {
    if (!svgRef.current || !isInitializedRef.current) return;
    const svg = d3.select(svgRef.current);
    updateStyle(
      svg,
      selectedNodes,
      nodeSizes,
      linkWeights,
      nodeChanges,
      edgeChanges,
      hoveredNode,
      nodeData,
      selectedCommunity,
      getColorForMetric,
    );
  }, [hoveredNode, selectedNodes]);

  useEffect(() => {
    if (resetZoomFlag) {
      resetZoom(svgRef);
      useInteractionStore.setState({ resetNodeLinkZoomFlag: false });
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
