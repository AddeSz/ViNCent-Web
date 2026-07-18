import type { BrushRange } from "@/stores/useFilterStore";

interface HistogramBrushOverlayProps {
  brushRange: BrushRange | null;
  chartHeight: number;
  bins: Array<{ x0: number; x1: number }>;
  getBinPosition: (binIndex: number) => { x: number; width: number };
}

export const HistogramBrushOverlay = ({
  brushRange,
  chartHeight,
  bins,
  getBinPosition,
}: HistogramBrushOverlayProps) => {
  if (!brushRange) return null;

  const [rangeStart, rangeEnd] = brushRange.range;

  let startBinIndex = bins.findIndex((bin) => bin.x1 > rangeStart);
  let endBinIndex = bins.findIndex((bin) => bin.x0 === rangeEnd);
  if (endBinIndex && endBinIndex !== -1) {
    endBinIndex += 1;
  } else {
    endBinIndex = bins.findIndex((bin) => bin.x0 > rangeEnd);
  }
  if (startBinIndex === -1) {
    if (rangeStart >= bins[bins.length - 1].x1) {
      startBinIndex = bins.length - 1;
      endBinIndex = bins.length;
    } else {
      startBinIndex = 0;
      endBinIndex = 1;
    }
  }

  const firstBin = startBinIndex === -1 ? 0 : startBinIndex;
  const lastBin =
    endBinIndex === -1 ? bins.length - 1 : Math.max(0, endBinIndex - 1);

  const { x: startX } = getBinPosition(firstBin);
  const { x: endX, width: endWidth } = getBinPosition(lastBin);
  const brushWidth = endX + endWidth - startX;

  return (
    <>
      <rect
        x={startX}
        y={0}
        width={brushWidth}
        height={chartHeight}
        fill={"steelblue"}
        opacity={0.15}
        pointerEvents="none"
      />
      <rect
        x={startX}
        y={0}
        width={2}
        height={chartHeight}
        fill={"steelblue"}
        opacity={0.8}
        pointerEvents="none"
      />
      <rect
        x={endX + endWidth - 2}
        y={0}
        width={2}
        height={chartHeight}
        fill={"steelblue"}
        opacity={0.8}
        pointerEvents="none"
      />
      <line
        x1={startX}
        y1={0}
        x2={endX + endWidth}
        y2={0}
        stroke={"steelblue"}
        strokeWidth={2}
        opacity={0.8}
        pointerEvents="none"
      />
      <line
        x1={startX}
        y1={chartHeight}
        x2={endX + endWidth}
        y2={chartHeight}
        stroke={"steelblue"}
        strokeWidth={2}
        opacity={0.8}
        pointerEvents="none"
      />
    </>
  );
};
