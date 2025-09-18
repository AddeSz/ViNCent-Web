import * as d3 from "d3";
import { useMemo } from "react";

export interface HistogramDataType {
  bins: d3.Bin<number, number>[];
  min: number;
  max: number;
  thresholds: number[];
}

export const useHistogramData = (
  data: number[],
  binCount: number,
): HistogramDataType | null => {
  return useMemo(() => {
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
};
