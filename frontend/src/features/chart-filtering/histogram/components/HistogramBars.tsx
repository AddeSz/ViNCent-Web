import { type ScaleLinear } from "d3";
import type { BinnedData } from "../../components/createBinnedData";

interface HistogramBarsProps {
  data: BinnedData;
  chartHeight: number;
  color: string;
  yScale: ScaleLinear<number, number>;
  getBinPosition: (binIndex: number) => { x: number; width: number };
  isBinSelected: (binIndex: number) => boolean;
  hoverBin: number | null;
  filteredBinCounts: number[] | null;
}

export const HistogramBars = ({
  data,
  chartHeight,
  color,
  yScale,
  getBinPosition,
  isBinSelected,
  hoverBin,
  filteredBinCounts,
}: HistogramBarsProps) => {
  return (
    <>
      {data.bins.map((bin, i) => {
        const { x, width } = getBinPosition(i);
        const barHeight = chartHeight - yScale(bin.values.length);
        const isSelected = isBinSelected(i);
        const isHovered = hoverBin === i;
        const filteredCount = filteredBinCounts?.[i] ?? bin.values.length;
        const filteredHeight = chartHeight - yScale(filteredCount);
        const startPos = i === 0 ? x + 2 : x + 1;
        let binWidth = width - 2;
        if (i === 0) binWidth = binWidth - 1;

        return (
          <g key={i}>
            <rect
              x={startPos}
              y={yScale(bin.values.length)}
              width={binWidth}
              height={barHeight}
              fill={color}
              opacity={isSelected ? 0.3 : 0.2}
            />

            {filteredBinCounts && (
              <rect
                x={startPos}
                y={yScale(filteredCount)}
                width={binWidth}
                height={filteredHeight}
                fill={color}
              />
            )}

            {isHovered && (
              <rect
                x={Math.round(startPos)}
                y={0}
                width={binWidth}
                height={chartHeight}
                fill="currentColor"
                opacity={0.2}
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </>
  );
};
