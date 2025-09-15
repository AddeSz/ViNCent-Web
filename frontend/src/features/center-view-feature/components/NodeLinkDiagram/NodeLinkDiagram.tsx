import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { RefObject, Ref } from "react";
import * as d3 from "d3";
import type { Simulation } from "d3";
import useResizeObserver from "@/hooks/useResizeObserver";
import type { Node, Link, CombinedNodeData } from "@/types/network";
import { createSimulation } from "./setupSimulation";
import { useZoom } from "@/features/center-view-feature/hooks/useZoom";
import { selectionStyling } from "./selectionStyling";
import { useNodeLinkData } from "./useNodeLinkData";
import { updateGraph } from "./updateGraph";
import useFilteredCentralityData from "@/features/center-view-feature/hooks/useFilteredCentralityData";
import { useTooltip } from "@/features/center-view-feature/hooks/useTooltip";
import {
  NodeTooltip,
  type NodeTooltipProps,
} from "@/features/center-view-feature/components/Tooltips/NodeTooltip";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useAttributeStore } from "@/hooks/useAttributeStore";

const NodeLinkDiagram = forwardRef(function NodeLinkDiagram(
  { containerRef }: { containerRef: RefObject<HTMLDivElement | null> },
  resetRef: Ref<() => void>,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Link> | null>(null);
  const { setupZoom, resetZoom } = useZoom();
  const rawDimensions = useResizeObserver(containerRef);
  const dimensions = useDebouncedValue(rawDimensions, 200);
  const networkData = useNetworkStore((state) => state.network);
  const selectedNodes = useNetworkStore((state) => state.selectedNodes);
  const filteredCentralityData = useFilteredCentralityData();
  const nodeLinkData = useNodeLinkData(networkData, filteredCentralityData);
  const setHoveredNode = useNetworkStore((state) => state.setHoveredNode);
  const nodeAttributes = useAttributeStore((state) => state.nodeAttributes);

  const { tooltip, showTooltip, hideTooltip } = useTooltip<NodeTooltipProps>({
    nodeId: "",
    label: "",
    linkCount: 0,
    x: 0,
    y: 0,
    visible: false,
  });

  useImperativeHandle(resetRef, () => () => resetZoom(svgRef), [resetZoom]);

  useEffect(() => {
    if (!svgRef.current || !dimensions?.width || !dimensions?.height) return;
    const svg = d3.select(svgRef.current);

    if (!simulationRef.current) {
      const svgGroup = svg.append("g").attr("class", "zoom-group");
      setupZoom(svg, svgRef, svgGroup);
      svgGroup.append("g").attr("class", "links-group");
      svgGroup.append("g").attr("class", "nodes-group");

      simulationRef.current = createSimulation(
        networkData.nodes,
        networkData.links,
        svgGroup.selectAll(".node"),
        svgGroup.selectAll(".link"),
      );
    }
  }, [dimensions, networkData]);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    const svg = d3.select(svgRef.current);

    updateGraph(
      d3.select(svgRef.current),
      simulationRef.current,
      nodeLinkData.nodes,
      nodeLinkData.links,
    );

    svg
      .select(".nodes-group")
      .selectAll<SVGCircleElement, Node>(".node")
      .on("mousemove", function (event, d) {
        const [x, y] = [event.clientX, event.clientY];
        const centrality =
          filteredCentralityData.find((c) => c.id === d.id) || {};
        const attributes = nodeAttributes[d.id] || {};

        const hoveredNodeData: CombinedNodeData = {
          ...d,
          ...centrality,
          ...attributes,
        };

        setHoveredNode(hoveredNodeData);
        showTooltip(
          {
            nodeId: d.id,
            label: d.label ?? d.id,
            linkCount: d.linkCount ?? 0,
            x,
            y,
            visible: true,
          },
          d.id,
        );
      })
      .on("mouseleave", () => hideTooltip());
  }, [nodeLinkData, networkData]);

  useEffect(() => {
    if (!svgRef.current) return;
    selectionStyling(d3.select(svgRef.current), selectedNodes);
  }, [selectedNodes, nodeLinkData]);

  useEffect(
    () => () => {
      simulationRef.current?.stop();
      simulationRef.current = null;
      if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
    },
    [],
  );

  return !dimensions?.width || !dimensions?.height ? (
    <div className="flex h-full items-center justify-center bg-card" />
  ) : (
    <div className="relative h-full">
      <svg
        ref={svgRef}
        viewBox="-800 -800 1600 1600"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full bg-card"
        style={{ shapeRendering: "geometricPrecision" }}
      />
      <NodeTooltip {...tooltip} />
    </div>
  );
});

export default NodeLinkDiagram;
