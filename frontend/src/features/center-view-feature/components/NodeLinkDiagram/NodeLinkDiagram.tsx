import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { RefObject, Ref } from "react";
import * as d3 from "d3";
import type { Simulation } from "d3";

import useResizeObserver from "@/hooks/useResizeObserver";
import { useDataStore } from "@/hooks/useDataStore";
import type { Node, Edge } from "@/types/network";
import { createSimulation, createDrag } from "./setupSimulation";
import { handleHighlight } from "@/utils/ColorHelper";
import { useZoom } from "@/hooks/useZoom";

const NodeLinkDiagram = forwardRef(function NodeLinkDiagram(
  {
    containerRef,
  }: {
    containerRef: RefObject<HTMLDivElement | null>;
  },
  resetRef: Ref<() => void>,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<Simulation<Node, Edge> | null>(null);
  const { setupZoom, resetZoom } = useZoom();
  const dimensions = useResizeObserver(containerRef);
  const networkData = useDataStore((state) => state.network);
  const selectedNodes = useDataStore((state) => state.selectedNodes);

  useImperativeHandle(
    resetRef,
    () => () => {
      resetZoom(svgRef);
    },
    [resetZoom],
  );

  useEffect(() => {
    if (!svgRef.current || !dimensions?.width || !dimensions?.height) return;

    const svg = d3.select(svgRef.current);

    if (!simulationRef.current) {
      const svgGroup = svg.append("g").attr("class", "zoom-group");
      setupZoom(svg, svgRef, svgGroup);
      const links = svgGroup
        .selectAll(".links")
        .data(networkData.edges)
        .enter()
        .append("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5);

      const nodes = svgGroup
        .selectAll(".nodes")
        .data(networkData.nodes)
        .enter()
        .append("circle")
        .attr("r", 10)
        .attr("fill", "steelblue")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
          const multi = event.shiftKey || event.ctrlKey || event.metaKey;
          handleHighlight(d.id, multi);
        });

      const simulation = createSimulation(
        networkData.nodes,
        networkData.edges,
        nodes,
        links,
      );
      const drag = createDrag(simulation);
      nodes.call(drag);

      simulationRef.current = simulation;
    }
  }, [dimensions, networkData]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    svg
      .selectAll("circle")
      .attr("stroke", (d) => {
        const node = d as Node;
        return selectedNodes.has(node.id) ? "orange" : "none";
      })
      .attr("stroke-width", (d) => {
        const node = d as Node;
        return selectedNodes.has(node.id) ? 2 : 0;
      });
  }, [selectedNodes]);

  return !dimensions?.width || !dimensions?.height ? (
    <div className="flex h-full items-center justify-center bg-card"></div>
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
