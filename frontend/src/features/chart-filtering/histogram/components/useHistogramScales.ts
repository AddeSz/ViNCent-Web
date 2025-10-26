import * as d3 from "d3";
import { useMemo } from "react";
import type { BinnedData } from "../../components/createBinnedData";

export const useHistogramScales = (
  data: BinnedData,
  chartWidth: number,
  chartHeight: number,
) => {
  const maxCount = Math.max(...data.bins.map((b) => b.values.length));

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, maxCount])
      .range([chartHeight, 0])
      .nice(3);
  }, [maxCount, chartHeight]);

  const yTicks = useMemo(() => {
    return yScale.ticks(4);
  }, [yScale]);

  const xScale = (binIndex: number) =>
    (binIndex / data.bins.length) * chartWidth;

  const getBinPosition = (binIndex: number) => {
    const x1 = Math.round((binIndex / data.bins.length) * chartWidth);
    const x2 = Math.round(((binIndex + 1) / data.bins.length) * chartWidth);
    return { x: x1, width: x2 - x1 };
  };

  const niceTickCount = (binCount: number, targetTicks: number) => {
    const niceSteps = [1, 2, 5, 10];
    let bestStep = 1;
    let minDiff = Infinity;

    for (const step of niceSteps) {
      const count = Math.round(binCount / step);
      const diff = Math.abs(count - targetTicks);
      if (diff < minDiff) {
        minDiff = diff;
        bestStep = step;
      }
    }

    return Math.round(binCount / bestStep);
  };

  const xTicks = useMemo(() => {
    const targetTicks = 3;
    const binsLength = data.bins.length;
    const tickCount = niceTickCount(binsLength, targetTicks);

    const ticks: Array<{ x: number; value: number }> = [];

    for (let i = 0; i <= tickCount; i++) {
      if (binsLength === 7 && i === 2) continue;
      if (binsLength === 11 && i === 3) continue;
      const t = i / tickCount;
      const binIndex = Math.ceil(t * (binsLength - 1));
      const bin = data.bins[binIndex];

      const x = i === tickCount ? chartWidth : Math.round(xScale(binIndex));
      const value = i === tickCount ? bin.x1 : bin.x0;

      ticks.push({ x, value });
    }

    return ticks;
  }, [data.bins, chartWidth]);

  return {
    yScale,
    yTicks,
    xScale,
    xTicks,
    getBinPosition,
  };
};
