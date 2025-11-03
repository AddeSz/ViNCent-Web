import { Spinner } from "@/components/ui/spinner";
import type { ContextType } from "@/features/center-view/CenterView";
import ChartTooltip from "@/features/center-view/Tooltips/ChartTooltip";
import {
  useTooltip,
  type InteractionProps,
} from "@/features/center-view/Tooltips/useTooltip";
import { useZoom } from "@/features/center-view/hooks/useZoom";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type {
  FullData,
  Link,
  Network,
  Node,
  NodeChange,
} from "@/types/network";
import type { Simulation } from "d3";
import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import drawSelectionBrush from "./drawSelectionBrush";
import {
  calculateLinkWeights,
  calculateNodeSizes,
  setupNodeEvents,
} from "./nodeLinkUtils";
import createSimulation, { updateSimulationForces } from "./setupSimulation";
import updateGraph, { updateStyle } from "./updateGraph";

interface NodeLinkDiagramProps {
  dimensions: DOMRectReadOnly | null;
  filteredNetwork: Network;
  dataMap: Map<string, FullData>;
  handleContextMenu: (target: ContextType, data?: any) => void;
  changes: NodeChange;
  isViewActive: boolean;
}

const NodeLinkDiagram = ({
  dimensions,
  filteredNetwork,
  dataMap,
  handleContextMenu,
  changes,
  isViewActive,
}: NodeLinkDiagramProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Link> | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isSimulationStable, setIsSimulationStable] = useState(false);
  const isInitializedRef = useRef(false);

  const { setupZoom, resetZoom, getCurrentTransform } = useZoom([0.1, 6]);

  const networkData = useNetworkStore.getState().network;
  const resetZoomFlag = useNetworkStore((s) => s.resetNodeLinkZoomFlag);

  const { onNodeHover, showTooltip, hideTooltip } = useTooltip(dataMap);
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
    showLabels,
  } = nodeLinkSettings;
  const keepStableView = useSettingsStore(
    (s) => s.displaySettings.keepStableView,
  );

  const activeNetwork = keepStableView ? networkData : filteredNetwork;

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
      dataMap,
      nodeSizeMode,
      nodeSizeMetric,
      fixedNodeSize,
      minNodeSize,
      maxNodeSize,
      nodeScaleType,
    );
  }, [
    networkData.nodes,
    nodeSizeMode,
    nodeSizeMetric,
    fixedNodeSize,
    minNodeSize,
    maxNodeSize,
    nodeScaleType,
  ]);

  const linkWeights = useMemo(() => {
    return calculateLinkWeights(
      activeNetwork.links,
      linkThicknessMode,
      fixedLinkThickness,
      minLinkThickness,
      maxLinkThickness,
      linkScaleType,
    );
  }, [
    activeNetwork.links,
    linkThicknessMode,
    fixedLinkThickness,
    minLinkThickness,
    maxLinkThickness,
    linkScaleType,
  ]);

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

  useEffect(() => {
    if (!svgRef.current || isInitializedRef.current) return;
    console.log("init");

    const svg = d3.select(svgRef.current);
    const svgGroup = svg.append("g").attr("class", "zoom-group");

    setupZoom(svg, svgGroup, getCurrentTransform());

    svgGroup.append("g").attr("class", "links-group");
    svgGroup.append("g").attr("class", "nodes-group");

    const hoveredNode = useNetworkStore.getState().hoveredNode;
    const selectedNodes = useNetworkStore.getState().selectedNodes;

    simulationRef.current = createSimulation(
      networkData.nodes,
      networkData.links,
      svgGroup.selectAll(".node"),
      svgGroup.selectAll(".link"),
      {
        linkDistance: linkDistance,
        chargeStrength: chargeStrength,
        collisionEnabled: collisionEnabled,
        collisionRadiuses: nodeSizes,
      },
    );

    const checkStability = () => {
      if (simulationRef.current && simulationRef.current.alpha() < 0.01) {
        console.log("Simulation stable!");
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
      dataMap
    ) {
      updateGraph(
        svg,
        simulationRef.current,
        filteredNetwork,
        dataMap,
        selectedNodes,
        changes,
        nodeSizes,
        linkWeights,
        hoveredNode,
        showLabels,
      );
      drawSelectionBrush(svgGroup, networkData.nodes, isViewActive);
      setupNodeEvents(svg, interactionProps);
    }

    isInitializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!simulationRef.current || !isSimulationStable) return;
    console.log("active network update");

    const existingPositions = new Map<
      string,
      { x: number; y: number; vx?: number; vy?: number }
    >();
    simulationRef.current.nodes().forEach((node) => {
      if (node.x !== undefined && node.y !== undefined) {
        existingPositions.set(node.id, {
          x: node.x,
          y: node.y,
          vx: node.vx,
          vy: node.vy,
        });
      }
    });

    activeNetwork.nodes.forEach((node) => {
      const existing = existingPositions.get(node.id);
      if (existing) {
        node.x = existing.x;
        node.y = existing.y;
        node.vx = existing.vx;
        node.vy = existing.vy;
      } else if (node.x === undefined || node.y === undefined) {
        node.x = Math.random() * 100 - 50;
        node.y = Math.random() * 100 - 50;
      }
    });

    simulationRef.current.nodes(activeNetwork.nodes);
    const linkForce = simulationRef.current.force("link") as d3.ForceLink<
      Node,
      Link
    >;
    if (linkForce) {
      linkForce.links(activeNetwork.links);
    }

    simulationRef.current.alpha(0.3).restart();
  }, [activeNetwork]);

  useEffect(() => {
    if (!simulationRef.current || !isSimulationStable) return;
    console.log("SimForces");

    updateSimulationForces(simulationRef.current, {
      linkDistance: linkDistance,
      chargeStrength: chargeStrength,
      collisionEnabled: collisionEnabled,
      collisionRadiuses: nodeSizes,
    });
  }, [linkDistance, chargeStrength, collisionEnabled, nodeSizes]);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current || !isSimulationStable)
      return;
    console.log("updateGraph");

    const svg = d3.select(svgRef.current);
    const hoveredNode = useNetworkStore.getState().hoveredNode;
    const selectedNodes = useNetworkStore.getState().selectedNodes;

    updateGraph(
      svg,
      simulationRef.current,
      filteredNetwork,
      dataMap,
      selectedNodes,
      changes,
      nodeSizes,
      linkWeights,
      hoveredNode,
      showLabels,
    );

    setupNodeEvents(svg, interactionProps);
  }, [changes, nodeSizes, linkWeights, showLabels]);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current || !isSimulationStable)
      return;

    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");

    drawSelectionBrush(svgGroup, activeNetwork.nodes, isViewActive);
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

      if (!svgRef.current || !dataMap) return;
      const svg = d3.select(svgRef.current);

      updateStyle(
        svg,
        state.selectedNodes,
        dataMap,
        nodeSizes,
        linkWeights,
        changes,
        state.hoveredNode,
      );
    });

    return unsubscribe;
  }, [changes, nodeSizes, linkWeights]);

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
        <ChartTooltip dataMap={dataMap} />
      </div>
    </>
  );
};

export default NodeLinkDiagram;
