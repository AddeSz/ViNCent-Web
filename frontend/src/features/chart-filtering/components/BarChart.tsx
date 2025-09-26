import * as d3 from "d3";
import { useEffect, useRef } from "react";

type BarChartProps = {
  categoricalValues: string[];
  width: number;
  dataKey: string;
  getColorForKey: (key: string, value: string | number) => string;
  selectedCategories: string[] | null;
  onBarClick: (category: string) => void;
  categoryCounts: Map<string, number>;
};

const CHART_CONFIG = {
  height: 140,
  margin: { top: 5, right: 20, bottom: 20, left: 20 },
};

const BarChart = ({
  categoricalValues,
  width,
  dataKey,
  getColorForKey,
  selectedCategories,
  onBarClick,
  categoryCounts,
}: BarChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

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

    g.selectAll("path")
      .data(categories)
      .join("path")
      .attr("d", (d) => {
        const value = counts.get(d) || 0;
        const x0 = x(d)!;
        const x1 = x0 + x.bandwidth();
        const y0 = y(value);
        const y1 = innerHeight;

        //ensure width is positive
        if (x1 <= x0) return "";

        const r = Math.min(3, (x1 - x0) / 2, (y1 - y0) / 2);

        // In case of future changes:
        // https://css-tricks.com/svg-path-syntax-illustrated-guide/
        return `
      M${x0},${y1}
      L${x0},${y0 + r}
      Q${x0},${y0} ${x0 + r},${y0}
      L${x1 - r},${y0}
      Q${x1},${y0} ${x1},${y0 + r}
      L${x1},${y1}
    `;
      })
      .on("click", (_, d) => {
        if (onBarClick) onBarClick(d);
      })
      .attr("fill", (d) => {
        const hasData = (categoryCounts.get(d) || 0) > 0;
        if (selectedCategories && selectedCategories.length > 0) {
          return selectedCategories.includes(d) && hasData
            ? getColorForKey(dataKey, d)
            : "#ccc";
        }
        return hasData ? getColorForKey(dataKey, d) : "#ccc";
      })
      .attr("stroke", (d) =>
        selectedCategories?.includes(d) ? "orange" : "none",
      )
      .attr("stroke-width", (d) => (selectedCategories?.includes(d) ? 3 : 0))
      .attr("cursor", "pointer");

    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(x).tickFormat((d: string) => {
          const barWidth = x.bandwidth();
          const maxChars = Math.floor(barWidth / 6);
          return d.length > maxChars ? d.slice(0, maxChars - 1) + "…" : d;
        }),
      );

    xAxis
      .selectAll<SVGTextElement, string>("text")
      .style("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", (d) =>
        selectedCategories?.includes(d) ? "orange" : "white",
      )
      .style("text-decoration", (d) =>
        selectedCategories?.includes(d) ? "underline" : "none",
      )
      .each(function (d) {
        d3.select(this).append("title").text(d);
      });

    xAxis
      .selectAll<SVGLineElement, string>(".tick line")
      .attr("stroke", (d: any) =>
        selectedCategories?.includes(d) ? "orange" : "white",
      )
      .attr("stroke-width", (d: any) =>
        selectedCategories?.includes(d) ? 2 : 1,
      );

    if (selectedCategories?.length) {
      selectedCategories.forEach((category) => {
        const xPos = x(category);
        const barWidth = x.bandwidth();

        if (xPos !== undefined) {
          g.append("line")
            .attr("x1", xPos - 1)
            .attr("x2", xPos + barWidth + 1)
            .attr("y1", innerHeight)
            .attr("y2", innerHeight)
            .attr("stroke", "orange")
            .attr("stroke-width", 2);
        }
      });
    }

    g.append("g").call(d3.axisLeft(y).ticks(5));
  }, [width, categoricalValues, selectedCategories, dataKey]);

  return <svg ref={svgRef} width={width} height={CHART_CONFIG.height} />;
};

export default BarChart;
