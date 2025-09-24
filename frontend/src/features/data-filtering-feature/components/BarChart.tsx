import type { CombinedData } from "@/types/network";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

type BarChartProps = {
  data: Map<string, CombinedData>;
  categoricalValues: string[];
  width: number;
  dataKey: string;
  getColorForKey: (key: string, value: string | number) => string;
  onSelectionChange?: (key: string, selected: string[] | null) => void;
  selectedCategories?: string[] | null;
};

const CHART_CONFIG = {
  height: 140,
  margin: { top: 5, right: 20, bottom: 40, left: 20 },
};

const BarChart = ({
  data,
  categoricalValues,
  width,
  dataKey,
  getColorForKey,
  onSelectionChange,
  selectedCategories,
}: BarChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  console.log(data);
  useEffect(() => {
    if (!width || !categoricalValues.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const counts = d3.rollup(
      categoricalValues,
      (v) => v.length,
      (d) => d,
    );
    const categories = Array.from(counts.keys());
    const values = Array.from(counts.values());

    const { margin } = CHART_CONFIG;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = CHART_CONFIG.height - margin.top - margin.bottom;

    const x = d3
      .scaleBand()
      .domain(categories)
      .range([0, innerWidth])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(values) || 0])
      .nice()
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    g.selectAll("rect")
      .data(categories)
      .join("rect")
      .attr("x", (d) => x(d)!)
      .attr("y", (d) => y(counts.get(d) || 0))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(counts.get(d) || 0))
      .attr("fill", (d) =>
        !selectedCategories || selectedCategories.includes(d)
          ? getColorForKey(dataKey, d)
          : "#ccc",
      )
      .on("click", (_, d) => {
        if (!onSelectionChange) return;
        const alreadySelected = selectedCategories?.includes(d);
        const newSelection = alreadySelected
          ? selectedCategories!.filter((c) => c !== d)
          : [...(selectedCategories || []), d];
        onSelectionChange(dataKey, newSelection.length ? newSelection : null);
      });

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

    g.append("g").call(d3.axisLeft(y).ticks(5));
  }, [
    width,
    categoricalValues,
    selectedCategories,
    dataKey,
    getColorForKey,
    onSelectionChange,
  ]);

  return <svg ref={svgRef} width={width} height={CHART_CONFIG.height} />;
};

export default BarChart;
