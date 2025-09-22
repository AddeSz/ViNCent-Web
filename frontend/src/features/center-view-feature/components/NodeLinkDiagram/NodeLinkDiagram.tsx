import ChartTooltip from "@/features/center-view-feature/components/Tooltips/Tooltip";
import { useFilteredCentralityData } from "@/features/center-view-feature/hooks/useFilteredCentralityData";
import { useTooltip } from "@/features/center-view-feature/hooks/useTooltip";
import { useZoom } from "@/features/center-view-feature/hooks/useZoom";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import type { CombinedData, Link, Node } from "@/types/network";
import type { Simulation } from "d3";
import * as d3 from "d3";
import type { Ref, RefObject } from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { ContextType } from "../../CenterView";
import selectionStyling from "./selectionStyling";
import createSimulation from "./setupSimulation";
import updateGraph from "./updateGraph";
import { useNodeLinkData } from "./useNodeLinkData";

type NodeLinkDiagramProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  combinedDataMap: Map<string, CombinedData>;
  onContextMenuTarget: (target: ContextType, data?: any) => void;
};

const NodeLinkDiagram = forwardRef(function NodeLinkDiagram(
  { containerRef, combinedDataMap, onContextMenuTarget }: NodeLinkDiagramProps,
  resetRef: Ref<() => void>,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Link> | null>(null);
  const { setupZoom, resetZoom } = useZoom();
  const rawDimensions = useResizeObserver(containerRef);
  const dimensions = useDebouncedValue(rawDimensions, 200);
  const networkData = useNetworkStore((s) => s.network);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const filteredCentralityData = useFilteredCentralityData();
  const nodeLinkData = useNodeLinkData(networkData, filteredCentralityData);
  const setHoveredNode = useNetworkStore((s) => s.setHoveredNode);
  const { tooltip, showTooltip, hideTooltip } = useTooltip();
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);

  useImperativeHandle(resetRef, () => () => resetZoom(svgRef), [resetZoom]);

  useEffect(() => {
    if (!svgRef.current || !dimensions?.width || !dimensions?.height) return;
    if (!simulationRef.current) {
      const svg = d3.select(svgRef.current);
      const svgGroup = svg.append("g").attr("class", "zoom-group");
      setupZoom(svg, svgRef, svgGroup);
      svgGroup.append("g").attr("class", "links-group");
      svgGroup.append("g").attr("class", "nodes-group");

      simulationRef.current = createSimulation(
        nodeLinkData.nodes,
        nodeLinkData.links,
        svgGroup.selectAll(".node"),
        svgGroup.selectAll(".link"),
      );
    }
  }, [dimensions, nodeLinkData]);

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
        const hoveredNodeData = combinedDataMap.get(d.id);
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
      .on("mouseleave", () => hideTooltip());
  }, [nodeLinkData, networkData, dimensions]);

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
    <div
      className="relative h-full"
      onContextMenu={() => {
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
      <ChartTooltip
        {...tooltip}
        combinedDataMap={combinedDataMap}
        getColorForKey={getColorForKey}
      />
    </div>
  );
});

export default NodeLinkDiagram;
