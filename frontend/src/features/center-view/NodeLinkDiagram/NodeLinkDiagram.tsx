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
import { useEffect, useMemo, useRef } from "react";
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
  onContextMenuTarget: (target: ContextType, data?: any) => void;
  changes: NodeChange;
  isViewActive: boolean;
}

const NodeLinkDiagram = ({
  dimensions,
  filteredNetwork,
  dataMap,
  onContextMenuTarget,
  changes,
  isViewActive,
}: NodeLinkDiagramProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Link> | null>(null);

  const { setupZoom, resetZoom, getCurrentTransform } = useZoom([0.1, 6]);

  const networkData = useNetworkStore((s) => s.network);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const resetZoomFlag = useNetworkStore((s) => s.resetNodeLinkZoomFlag);

  const { onNodeHover, showTooltip, hideTooltip } = useTooltip(dataMap);
  const restartSimulationFlag = useNetworkStore((s) => s.restartSimulationFlag);
  const setRestartSimulationFlag = useNetworkStore(
    (s) => s.setRestartSimulationFlag,
  );
  const nodeLinkSettings = useSettingsStore((s) => s.nodeLinkSettings);
  const keepStableView = useSettingsStore(
    (s) => s.displaySettings.keepStableView,
  );
  const hoveredNode = useNetworkStore((s) => s.hoveredNode);

  const activeNetwork = keepStableView ? networkData : filteredNetwork;

  const interactionProps: InteractionProps = {
    onNodeHover: onNodeHover,
    onTooltipShow: showTooltip,
    onTooltipHide: hideTooltip,
    onContextMenu: onContextMenuTarget,
  };

  const nodeSizes = useMemo(() => {
    return calculateNodeSizes(
      networkData.nodes,
      dataMap,
      nodeLinkSettings.nodeSizeMode,
      nodeLinkSettings.nodeSizeMetric,
      nodeLinkSettings.fixedNodeSize,
      nodeLinkSettings.minNodeSize,
      nodeLinkSettings.maxNodeSize,
      nodeLinkSettings.nodeScaleType,
    );
  }, [
    networkData.nodes,
    dataMap,
    nodeLinkSettings.nodeSizeMode,
    nodeLinkSettings.nodeSizeMetric,
    nodeLinkSettings.fixedNodeSize,
    nodeLinkSettings.minNodeSize,
    nodeLinkSettings.maxNodeSize,
    nodeLinkSettings.nodeScaleType,
  ]);

  const linkWeights = useMemo(() => {
    return calculateLinkWeights(
      activeNetwork.links,
      nodeLinkSettings.linkThicknessMode,
      nodeLinkSettings.fixedLinkThickness,
      nodeLinkSettings.minLinkThickness,
      nodeLinkSettings.maxLinkThickness,
      nodeLinkSettings.linkScaleType,
    );
  }, [
    activeNetwork.links,
    nodeLinkSettings.linkThicknessMode,
    nodeLinkSettings.fixedLinkThickness,
    nodeLinkSettings.minLinkThickness,
    nodeLinkSettings.maxLinkThickness,
    nodeLinkSettings.linkScaleType,
  ]);

  useEffect(() => {
    if (resetZoomFlag) {
      resetZoom(svgRef);
      useNetworkStore.setState({ resetNodeLinkZoomFlag: false });
    }
  }, [resetZoomFlag, resetZoom]);

  useEffect(() => {
    if (restartSimulationFlag && simulationRef.current) {
      simulationRef.current.alpha(1).restart();
      setRestartSimulationFlag(false);
    }
  }, [restartSimulationFlag]);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!simulationRef.current) {
      const svg = d3.select(svgRef.current);
      const svgGroup = svg.append("g").attr("class", "zoom-group");

      setupZoom(svg, svgGroup, getCurrentTransform());

      svgGroup.append("g").attr("class", "links-group");
      svgGroup.append("g").attr("class", "nodes-group");

      simulationRef.current = createSimulation(
        networkData.nodes,
        networkData.links,
        svgGroup.selectAll(".node"),
        svgGroup.selectAll(".link"),
        {
          linkDistance: nodeLinkSettings.linkDistance,
          chargeStrength: nodeLinkSettings.chargeStrength,
          collisionEnabled: nodeLinkSettings.collisionEnabled,
          collisionRadiuses: nodeSizes,
        },
      );

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
          nodeLinkSettings,
          changes,
          nodeSizes,
          linkWeights,
          hoveredNode,
        );
        drawSelectionBrush(svgGroup, networkData.nodes, isViewActive);
        setupNodeEvents(svg, interactionProps);
      }
    }
  }, [networkData, dimensions]);

  useEffect(() => {
    if (!simulationRef.current) return;

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
    if (!simulationRef.current) return;

    updateSimulationForces(simulationRef.current, {
      linkDistance: nodeLinkSettings.linkDistance,
      chargeStrength: nodeLinkSettings.chargeStrength,
      collisionEnabled: nodeLinkSettings.collisionEnabled,
      collisionRadiuses: nodeSizes,
    });
  }, [
    nodeLinkSettings.linkDistance,
    nodeLinkSettings.chargeStrength,
    nodeLinkSettings.collisionEnabled,
    nodeSizes,
  ]);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current || !dataMap) return;
    const svg = d3.select(svgRef.current);

    updateGraph(
      d3.select(svgRef.current),
      simulationRef.current,
      filteredNetwork,
      dataMap,
      selectedNodes,
      nodeLinkSettings,
      changes,
      nodeSizes,
      linkWeights,
      hoveredNode,
    );

    setupNodeEvents(svg, interactionProps);

    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");
    if (svgGroup.empty()) return;
    drawSelectionBrush(svgGroup, activeNetwork.nodes, isViewActive);
  }, [
    dataMap,
    isViewActive,
    nodeLinkSettings,
    activeNetwork,
    interactionProps,
  ]);

  useEffect(() => {
    if (!svgRef.current || !dataMap) return;
    const svg = d3.select(svgRef.current);

    updateStyle(
      svg,
      selectedNodes,
      dataMap,
      nodeSizes,
      linkWeights,
      nodeLinkSettings.fixedNodeSize,
      changes,
      hoveredNode,
    );
  }, [
    changes,
    filteredNetwork,
    dataMap,
    nodeSizes,
    linkWeights,
    nodeLinkSettings.fixedNodeSize,
  ]);

  useEffect(() => {
    if (!svgRef.current || !dataMap) return;
    const svg = d3.select(svgRef.current);

    updateStyle(
      svg,
      selectedNodes,
      dataMap,
      nodeSizes,
      linkWeights,
      nodeLinkSettings.fixedNodeSize,
      changes,
      hoveredNode,
    );
  }, [selectedNodes, hoveredNode]);

  return !dimensions?.width || !dimensions?.height ? (
    <div className="flex h-full items-center justify-center bg-card" />
  ) : (
    <div
      className="relative h-full"
      onContextMenu={(e) => {
        if ((e.nativeEvent as any)._handledByChild) return;
        onContextMenuTarget("node-link");
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
  );
};

export default NodeLinkDiagram;
