import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as d3 from "d3";
import useResizeObserver from "@/hooks/useResizeObserver";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useHistogramData } from "./useHistogramData";
import { useBrush } from "./useBrush";

type HistogramProps = {
  data: number[];
  containerRef: RefObject<HTMLDivElement | null>;
  binCount?: number;
  centralityKey: string;
  getColorForKey: (key: string) => string;
  onBrushChange?: (key: string, range: [number, number] | null) => void;
  brushRange?: [number, number] | null;
  allCentralityData?: Record<string, any>[];
  allBrushRanges?: Record<string, [number, number] | null>;
};

const CHART_CONFIG = {
  height: 140,
  barGap: 3,
  margin: { top: 5, right: 20, bottom: 20, left: 20 },
  maxXTicks: 5,
};

const HistogramChart = ({
  data,
  containerRef,
  binCount = 10,
  centralityKey,
  getColorForKey,
  onBrushChange,
  brushRange,
  allCentralityData = [],
  allBrushRanges = {},
}: HistogramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const brushRef = useRef<d3.BrushBehavior<unknown> | null>(null);
  const isProgrammaticUpdate = useRef(false);
  const dimensions = useResizeObserver(containerRef);
  const width = useDebouncedValue(dimensions?.width, 10);
  const histogramData = useHistogramData(data, binCount);

  const handleBrushEnd = useBrush({
    histogramData,
    width,
    centralityKey,
    onBrushChange,
    isProgrammaticUpdate,
    margin: CHART_CONFIG.margin,
  });

  const getFilteredDataIndices = (): Set<number> => {
    if (!allCentralityData.length) {
      return new Set(data.map((_, i) => i));
    }

    return new Set(
      allCentralityData
        .map((entry, index) => {
          const isIncluded = Object.entries(allBrushRanges).every(
            ([key, range]) => {
              if (!range) return true;

              const value = entry[key];
              if (typeof value !== "number") return true;

              const [min, max] = range;
              return value >= min && value <= max;
            },
          );

          return isIncluded ? index : null;
        })
        .filter((index): index is number => index !== null),
    );
  };

  const getBarColor = (
    bin: d3.Bin<number, number>,
    filteredIndices: Set<number>,
  ) => {
    const { min, max } = histogramData!;
    const binStart = bin.x0 ?? min;
    const binEnd = bin.x1 ?? max;

    if (allCentralityData.length > 0) {
      const hasValidData = Array.from(filteredIndices).some((index) => {
        const entry = allCentralityData[index];
        const value = entry[centralityKey];
        return typeof value === "number" && value >= binStart && value < binEnd;
      });
      return hasValidData ? getColorForKey(centralityKey) : "#ccc";
    }

    if (!brushRange) return getColorForKey(centralityKey);

    const [rangeMin, rangeMax] = brushRange;
    const overlaps = binEnd > rangeMin && binStart < rangeMax;
    return overlaps ? getColorForKey(centralityKey) : "#ccc";
  };

  const createAxes = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleLinear<number, number>,
    innerHeight: number,
  ) => {
    const { thresholds } = histogramData!;

    const tickStep = Math.max(
      1,
      Math.floor(thresholds.length / (CHART_CONFIG.maxXTicks - 1)),
    );
    const filteredThresholds = thresholds.filter(
      (_, i) => i % tickStep === 0 || i === thresholds.length - 1,
    );

    const xTickValues = filteredThresholds.map((threshold, index) => {
      if (index === 0 || index === filteredThresholds.length - 1) {
        return threshold;
      }
      const tickPosition = x(threshold);
      return x.invert(tickPosition);
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
  };

  useEffect(() => {
    if (!width || !histogramData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { bins, min, max } = histogramData;
    const { margin } = CHART_CONFIG;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = CHART_CONFIG.height - margin.top - margin.bottom;

    const x = d3.scaleLinear().domain([min, max]).range([0, innerWidth]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length) || 0])
      .nice(5)
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const filteredIndices = getFilteredDataIndices();

    g.selectAll("path")
      .data(bins)
      .join("path")
      .attr("d", (d) => {
        const binStart = d.x0 ?? min;
        const binEnd = d.x1 ?? max;
        const x0 = x(binStart) + CHART_CONFIG.barGap / 2;
        const x1 = x(binEnd) - CHART_CONFIG.barGap / 2;
        const y0 = y(d.length);
        const y1 = innerHeight;

        //ensure width is positive
        if (x1 <= x0) return "";

        const r = Math.min(2, (x1 - x0) / 2, (y1 - y0) / 2);
        // In case of future changes:
        // https://css-tricks.com/svg-path-syntax-illustrated-guide/
        return `
      M${x0},${y1}                     
      L${x0},${y0 + r}                 
      Q${x0},${y0} ${x0 + r},${y0}     
      L${x1 - r},${y0}                 
      Q${x1},${y0} ${x1},${y0 + r}     
      L${x1},${y1}                     
      Z
    `;
      })
      .attr("fill", (d) => getBarColor(d, filteredIndices));

    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("end", handleBrushEnd);

    brushRef.current = brush;
    const brushG = g.append("g").attr("class", "brush").call(brush);

    if (brushRange) {
      isProgrammaticUpdate.current = true;
      const [rangeMin, rangeMax] = brushRange;
      const selection: [number, number] = [x(rangeMin), x(rangeMax)];
      brushG.call(brush.move, selection);
    }

    createAxes(g, x, y, innerHeight);
  }, [
    width,
    histogramData,
    handleBrushEnd,
    allCentralityData,
    allBrushRanges,
    brushRange,
    centralityKey,
    getColorForKey,
  ]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={CHART_CONFIG.height}
      className="w-min"
    />
  );
};

export default HistogramChart;
