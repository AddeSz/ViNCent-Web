import { useEffect, useRef, useMemo } from "react";
import type { RefObject } from "react";
import * as d3 from "d3";
import useResizeObserver from "@/hooks/useResizeObserver";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { getColorForKey } from "@/utils/ColorHelper";

type HistogramProps = {
  data: number[];
  containerRef: RefObject<HTMLDivElement | null>;
  binCount?: number;
  centralityKey: string;
};

const HistogramChart = ({
  data,
  containerRef,
  binCount = 10,
  centralityKey,
}: HistogramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const dimensions = useResizeObserver(containerRef);
  const width = useDebouncedValue(dimensions?.width, 10);
  const height = 160;
  const barPadding = 5;

  const histogramData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const [rawMin, rawMax] = d3.extent(data) as [number, number];
    const tempX = d3.scaleLinear().domain([rawMin, rawMax]).nice(binCount);
    const [min, max] = tempX.domain();

    const binWidth = (max - min) / binCount;
    const thresholds = Array.from(
      { length: binCount },
      (_, i) => min + binWidth * i,
    );
    thresholds.push(max);

    const histogram = d3.bin().domain([min, max]).thresholds(thresholds);
    const bins = histogram(data);

    return { bins, min, max, thresholds };
  }, [data, binCount]);

  useEffect(() => {
    if (!width || !histogramData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { bins, min, max, thresholds } = histogramData;

    const margin = { top: 10, right: 20, bottom: 40, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([min, max]).range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length) || 0])
      .nice(5)
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll("rect")
      .data(bins)
      .join("rect")
      .attr("x", (d) => x(d.x0 ?? min) + barPadding / 2)
      .attr("y", (d) => y(d.length))
      .attr("width", (d) => {
        const binWidth = x(d.x1 ?? min) - x(d.x0 ?? min);
        const padding = Math.min(2, binWidth * 0.2);
        return Math.max(1, binWidth - padding);
      })
      .attr("height", (d) => innerHeight - y(d.length))
      .attr("fill", getColorForKey(centralityKey))
      .attr("rx", 2);

    const maxXTicks = 5;
    const tickStep = Math.max(
      1,
      Math.floor(thresholds.length / (maxXTicks - 1)),
    );
    const xTickValues = thresholds.filter((_, i) => {
      return i % tickStep === 0 || i === thresholds.length - 1;
    });

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3.axisBottom(x).tickValues(xTickValues).tickFormat(d3.format(".2~f")),
      )
      .selectAll("text")
      .style("font-size", "10px");

    const yTicks = y.ticks(5).filter((t) => Number.isInteger(t));

    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .tickValues(yTicks)
          .tickFormat((d) => d.toString()),
      )
      .selectAll("text")
      .style("font-size", "10px");
  }, [width, histogramData]);

  return <svg ref={svgRef} width={width} className="w-min" height={height} />;
};

export default HistogramChart;
