import type { ContextType } from "@/features/center-view/CenterView";
import ChartTooltip from "@/features/center-view/Tooltips/ChartTooltip";
import { useTooltip } from "@/features/center-view/Tooltips/useTooltip";
import { useZoom } from "@/features/center-view/hooks/useZoom";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData, Link, Network, Node } from "@/types/network";
import type { Simulation } from "d3";
import * as d3 from "d3";
import { useEffect, useRef } from "react";
import drawSelectionBrush from "./drawSelectionBrush";
import createSimulation from "./setupSimulation";
import updateGraph, { updateStyle } from "./updateGraph";

interface NodeLinkDiagramProps {
  dimensions: DOMRectReadOnly | null;
  data: Network;
  dataMap: Map<string, FullData>;
  onContextMenuTarget: (target: ContextType, data?: any) => void;
  isViewActive: boolean;
}

const NodeLinkDiagram = ({
  dimensions,
  data,
  dataMap,
  onContextMenuTarget,
  isViewActive,
}: NodeLinkDiagramProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Link> | null>(null);
  const { setupZoom, resetZoom } = useZoom();
  const networkData = useNetworkStore((s) => s.network);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const nodeLinkZoom = useNetworkStore((s) => s.nodeLinkZoom);
  const resetZoomFlag = useNetworkStore((s) => s.resetNodeLinkZoomFlag);
  const setNodeLinkZoom = useNetworkStore((s) => s.setNodeLinkZoom);
  const setHoveredNode = useNetworkStore((s) => s.setHoveredNode);
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  useEffect(() => {
    if (resetZoomFlag) {
      resetZoom(svgRef, () => setNodeLinkZoom(d3.zoomIdentity));
      useNetworkStore.setState({ resetNodeLinkZoomFlag: false });
    }
  }, [resetZoomFlag]);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!simulationRef.current) {
      const svg = d3.select(svgRef.current);
      const svgGroup = svg.append("g").attr("class", "zoom-group");
      setupZoom(svg, svgGroup, nodeLinkZoom, setNodeLinkZoom);
      svgGroup.append("g").attr("class", "links-group");
      svgGroup.append("g").attr("class", "nodes-group");

      simulationRef.current = createSimulation(
        networkData.nodes,
        networkData.links,
        svgGroup.selectAll(".node"),
        svgGroup.selectAll(".link"),
      );

      if (data && data.nodes?.length && data.links?.length && dataMap) {
        updateGraph(
          svg,
          simulationRef.current,
          data.nodes,
          data.links,
          dataMap,
          selectedNodes,
        );
        drawSelectionBrush(svgGroup, data.nodes, isViewActive);
      }
    }
  }, [networkData, dimensions]);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current || !dataMap) return;
    const svg = d3.select(svgRef.current);

    updateGraph(
      d3.select(svgRef.current),
      simulationRef.current,
      data.nodes,
      data.links,
      dataMap,
      selectedNodes,
    );
    svg
      .select(".nodes-group")
      .selectAll<SVGCircleElement, Node>(".node")
      .on("mousemove", function (event, d) {
        const [x, y] = [event.clientX, event.clientY];
        const hoveredNodeData = dataMap.get(d.id);
        if (!hoveredNodeData) return;

        setHoveredNode(hoveredNodeData);
        showTooltip(
          {
            type: "node",
            nodeId: d.id,
            x,
            y,
          },
          d.id,
        );
      })
      .on("mouseleave", () => hideTooltip())
      .on("contextmenu", (event, d) => {
        event._handledByChild = true;
        onContextMenuTarget("node", d.id);
      });

    const svgGroup = d3
      .select(svgRef.current)
      .select<SVGGElement>("g.zoom-group");
    if (svgGroup.empty()) return;
    drawSelectionBrush(svgGroup, data.nodes, isViewActive);
  }, [dataMap, isViewActive]);

  useEffect(() => {
    if (!svgRef.current || !dataMap) return;
    const svg = d3.select(svgRef.current);
    updateStyle(svg, selectedNodes, dataMap);
  }, [selectedNodes]);

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
        style={{ shapeRendering: "geometricPrecision" }}
      />
      <ChartTooltip {...tooltip} dataMap={dataMap} />
    </div>
  );
};

export default NodeLinkDiagram;
