import * as d3 from "d3";
import { useCallback } from "react";
import type { HistogramDataType } from "./useHistogramData";

type BrushProps = {
  histogramData: HistogramDataType | null;
  width: number | undefined;
  centralityKey: string;
  onBrushChange?: (key: string, range: [number, number] | null) => void;
  isProgrammaticUpdate: React.RefObject<boolean>;
  margin: { top: number; right: number; bottom: number; left: number };
};

export const useBrush = ({
  histogramData,
  width,
  centralityKey,
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
        onBrushChange(centralityKey, null);
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
        onBrushChange(centralityKey, null);
      } else {
        onBrushChange(centralityKey, snappedRange);
      }
    },
    [histogramData, width, centralityKey, onBrushChange, isProgrammaticUpdate],
  );
};
