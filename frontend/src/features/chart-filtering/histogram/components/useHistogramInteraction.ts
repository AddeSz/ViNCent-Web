import type { BrushRange } from "@/stores/useMetricsStore";
import { useState } from "react";
import {
  isLastBinSelected,
  type BinnedData,
} from "../../components/createBinnedData";

interface UseHistogramInteractionProps {
  onBrushChange: (range: BrushRange | null) => void;
  brushRange: BrushRange | null;
  binIndexToValue: (binIndex: number) => { start: number; end: number };
  binnedData: BinnedData;
}

const EPSILON = 1e-10;

export const useHistogramInteraction = ({
  onBrushChange,
  brushRange,
  binIndexToValue,
  binnedData,
}: UseHistogramInteractionProps) => {
  const [hoverBin, setHoverBin] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [tempBrushRange, setTempBrushRange] = useState<BrushRange | null>(null);

  const finalizeBrushRange = (range: [number, number]): BrushRange => {
    const isInclusive = isLastBinSelected(range, binnedData);
    const adjustedRange: [number, number] = isInclusive
      ? range
      : [range[0], range[1] - EPSILON];

    return { range: adjustedRange, inclusive: isInclusive };
  };

  const handleMouseDown = (binIndex: number) => {
    setIsDragging(true);
    setDragStart(binIndex);
    const { start, end } = binIndexToValue(binIndex);
    setTempBrushRange(finalizeBrushRange([start, end]));
  };

  const handleMouseMove = (binIndex: number) => {
    if (isDragging && dragStart !== null) {
      const startBinIdx = Math.min(dragStart, binIndex);
      const endBinIdx = Math.max(dragStart, binIndex);

      const { start } = binIndexToValue(startBinIdx);
      const { end } = binIndexToValue(endBinIdx);
      setTempBrushRange(finalizeBrushRange([start, end]));
    }
    setHoverBin(binIndex);
  };
  const handleMouseUp = () => {
    if (isDragging && tempBrushRange) {
      if (!areBrushRangesEqual(brushRange, tempBrushRange))
        onBrushChange(tempBrushRange);
    }
    setIsDragging(false);
    setDragStart(null);
    setTempBrushRange(null);
  };

  const handleMouseLeave = () => {
    setHoverBin(null);
    if (isDragging) {
      if (tempBrushRange) {
        if (!areBrushRangesEqual(brushRange, tempBrushRange))
          onBrushChange(tempBrushRange);
      }
      setIsDragging(false);
      setDragStart(null);
      setTempBrushRange(null);
    }
  };

  const isBinSelected = (
    binIndex: number,
    binsData: Array<{ x0: number; x1: number }>,
  ): boolean => {
    const activeRange = isDragging ? tempBrushRange : brushRange;
    if (!activeRange) return false;

    const [rangeStart, rangeEnd] = activeRange.range;
    const bin = binsData[binIndex];

    return bin.x1 > rangeStart && bin.x0 < rangeEnd;
  };

  return {
    hoverBin,
    isDragging,
    tempBrushRange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    isBinSelected,
  };
};

const areBrushRangesEqual = (
  a: BrushRange | null,
  b: BrushRange | null,
): boolean => {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;

  const [a0, a1] = a.range;
  const [b0, b1] = b.range;

  const isClose = (x: number, y: number) => Math.abs(x - y) < EPSILON;

  return isClose(a0, b0) && isClose(a1, b1) && a.inclusive === b.inclusive;
};
