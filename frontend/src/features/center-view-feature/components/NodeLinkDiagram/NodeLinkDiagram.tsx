import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { RefObject, Ref } from "react";
import * as d3 from "d3";
import type { Simulation } from "d3";
import useResizeObserver from "@/hooks/useResizeObserver";
import { useDataStore } from "@/hooks/useDataStore";
import type { Node, Edge } from "@/types/network";
import { createSimulation } from "./setupSimulation";
import { useZoom } from "@/hooks/useZoom";
import useFilteredCentralityData from "@/hooks/useFilteredCentralityData";
import { selectionStyling } from "./selectionStyling";
import { useNodeLinkData } from "./useNodeLinkData";
import { updateGraph } from "./updateGraph";

const NodeLinkDiagram = forwardRef(function NodeLinkDiagram(
  { containerRef }: { containerRef: RefObject<HTMLDivElement | null> },
  resetRef: Ref<() => void>,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Edge> | null>(null);
  const { setupZoom, resetZoom } = useZoom();
  const dimensions = useResizeObserver(containerRef);
  const networkData = useDataStore((state) => state.network);
  const selectedNodes = useDataStore((state) => state.selectedNodes);
  const filteredCentralityData = useFilteredCentralityData();
  const nodeLinkData = useNodeLinkData(networkData, filteredCentralityData);

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
        nodeLinkData.nodes,
        nodeLinkData.edges,
        svgGroup.selectAll(".node"),
        svgGroup.selectAll(".link"),
      );
    }
  }, [dimensions]);

  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    updateGraph(
      svgRef.current && d3.select(svgRef.current),
      simulationRef.current,
      nodeLinkData.nodes,
      nodeLinkData.edges,
    );
  }, [nodeLinkData]);

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
    <svg
      ref={svgRef}
      viewBox="-800 -800 1600 1600"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full bg-card"
      style={{ shapeRendering: "geometricPrecision" }}
    />
  );
});

export default NodeLinkDiagram;
