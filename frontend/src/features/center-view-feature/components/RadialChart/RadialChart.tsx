import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { RefObject, Ref } from "react";
import * as d3 from "d3";
import useResizeObserver from "@/hooks/useResizeObserver";
import { useDataStore } from "@/hooks/useDataStore";
import type { Centrality } from "@/types/network";
import drawArcs from "./drawArcs";
import drawBounds, { updateBoundHighlight } from "./drawBounds";
import drawLabels, { updateLabelHighlight } from "./drawLabels";
import drawLinks, { updateLinkHighlight } from "./drawLinks";
import calculateBounds from "./calculateBounds";
import { useZoom } from "@/hooks/useZoom";
import { useChartSettings } from "@/hooks/useChartSettings";

const RadialChart = forwardRef(function RadialChart(
  {
    containerRef,
  }: {
    containerRef: RefObject<HTMLDivElement | null>;
  },
  resetRef: Ref<() => void>,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dimensions = useResizeObserver(containerRef);
  const centralityData = useDataStore((state) => state.centralityData);
  const networkData = useDataStore((state) => state.network);
  const selectedNodes = useDataStore((state) => state.selectedNodes);
  const { setupZoom, resetZoom } = useZoom();
  const { radialSettings } = useChartSettings();
  const { innerRadius, outerRadius, arcPadding } = radialSettings;

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
    svg.selectAll("*").remove();

    const svgGroup = svg.append("g").attr("class", "zoom-group");
    setupZoom(svg, svgRef, svgGroup);

    const keys = Array.from({ length: 10 }, (_, i) => `centrality${i}`);
    const series = d3
      .stack<Centrality>()
      .keys(keys)
      // .value((d, key) => {
      //   const val = d[key as keyof Centrality];
      //   return typeof val === "number" ? val * 3 : 0;
      // })(centralityData);
      .value(() => 1)(centralityData);

    const x = d3
      .scaleBand<string>()
      .domain(centralityData.map((d) => d.id))
      .range([0, 2 * Math.PI])
      // .align(0)
      .padding(0.05);
    const y = d3
      .scaleLinear<number, number>()
      .domain([0, keys.length])
      .range([innerRadius, outerRadius]);

    drawArcs(svgGroup, series, x, y, arcPadding);

    const groupBounds = calculateBounds(series, x, y);
    const maxOuter = Math.max(...groupBounds.map((d) => d.outer));
    drawLinks(svgGroup, networkData.edges, x, innerRadius, selectedNodes);
    drawBounds(
      svgGroup,
      groupBounds,
      arcPadding,
      innerRadius,
      maxOuter,
      selectedNodes,
    );
    drawLabels(svgGroup, x, maxOuter - arcPadding, selectedNodes);
  }, [dimensions, centralityData, networkData, radialSettings]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    updateBoundHighlight(svg, selectedNodes);
    updateLabelHighlight(svg, selectedNodes);
    updateLinkHighlight(svg, selectedNodes);
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

export default RadialChart;
