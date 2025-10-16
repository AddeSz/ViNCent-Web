import * as d3 from "d3";
import { useCallback } from "react";
import type { HistogramDataProps } from "./useHistogramData";

interface BrushProps {
  histogramData: HistogramDataProps | null;
  width: number | undefined;
  dataKey: string;
  onBrushChange?: (key: string, range: [number, number] | null) => void;
  isProgrammaticUpdate: React.RefObject<boolean>;
  margin: { top: number; right: number; bottom: number; left: number };
}

export const useBrush = ({
  histogramData,
  width,
  dataKey,
  onBrushChange,
  isProgrammaticUpdate,
  margin,
}: BrushProps) => {
  return useCallback(
    (event: d3.D3BrushEvent<unknown>) => {
      if (isProgrammaticUpdate.current) {
        isProgrammaticUpdate.current = false;
        return;
      }

      if (!histogramData || !onBrushChange) return;

      if (!event.selection) {
        onBrushChange(dataKey, null);
        return;
      }

      const { min, max, thresholds } = histogramData;
      const innerWidth = (width || 0) - margin.left - margin.right;
      const x = d3.scaleLinear().domain([min, max]).range([0, innerWidth]);

      const [x0, x1] = event.selection as [number, number];
      const rawRange: [number, number] = [x.invert(x0), x.invert(x1)];

      const snapToThreshold = (value: number) => {
        return thresholds.reduce((closest, threshold) =>
          Math.abs(threshold - value) < Math.abs(closest - value)
            ? threshold
            : closest,
        );
      };

      const snappedRange: [number, number] = [
        snapToThreshold(rawRange[0]),
        snapToThreshold(rawRange[1]),
      ];

      if (snappedRange[0] >= snappedRange[1]) {
        onBrushChange(dataKey, null);
      } else {
        onBrushChange(dataKey, snappedRange);
      }
    },
    [histogramData, width, dataKey, onBrushChange, isProgrammaticUpdate],
  );
};
