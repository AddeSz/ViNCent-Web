import { useInteractionStore } from "@/stores/useInteractionStore";
import type { FullData } from "@/types";
import { type ScaleLinear } from "d3";
import type { BinnedData } from "../../components/createBinnedData";

interface HistogramBarsProps {
  binnedData: BinnedData;
  chartHeight: number;
  color: string;
  yScale: ScaleLinear<number, number>;
  getBinPosition: (binIndex: number) => { x: number; width: number };
  isBinSelected: (binIndex: number) => boolean;
  hoverBin: number | null;
  filteredBinCounts: number[] | null;
  dataKey: string;
  disabledValues: Set<number | string>;
  filteredData: Map<string, FullData>;
  onBinHover: (binIndex: number | null) => void;
}

export const HistogramBars = ({
  binnedData,
  chartHeight,
  color,
  yScale,
  getBinPosition,
  isBinSelected,
  hoverBin,
  filteredBinCounts,
  dataKey,
  disabledValues,
  filteredData,
  onBinHover,
}: HistogramBarsProps) => {
  const hoveredNode = useInteractionStore((s) => s.hoveredNode);
  const node = hoveredNode ? filteredData.get(hoveredNode) : null;
  const hoveredValue = node?.[dataKey];
  const hoveredBinIndex = binnedData.valueToBinIndex.get(hoveredValue) ?? null;

  return (
    <>
      {binnedData.bins.map((bin, i) => {
        const { x, width } = getBinPosition(i);
        const barHeight = chartHeight - yScale(bin.values.length);
        const isSelected = isBinSelected(i);
        const isHovered = hoverBin === i;
        const isDisabled = disabledValues.has(i);
        const filteredCount = filteredBinCounts?.[i] ?? bin.values.length;
        const filteredHeight = chartHeight - yScale(filteredCount);

        const startPos = x + 1;
        const binWidth = Math.max(1, width - 2);
        return (
          <g
            key={i}
            onMouseEnter={() => onBinHover(i)}
            onMouseLeave={() => onBinHover(null)}
          >
            <rect
              x={startPos}
              y={yScale(bin.values.length)}
              width={binWidth}
              height={barHeight}
              fill={color}
              opacity={isDisabled ? 0.3 : isSelected ? 0.3 : 0.2}
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

            {isDisabled && (
              <>
                <defs>
                  <pattern
                    id={`disabled-pattern-${i}`}
                    patternUnits="userSpaceOnUse"
                    width="8"
                    height="8"
                    patternTransform="rotate(45)"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="8"
                      stroke="var(--muted-foreground)"
                      strokeWidth="3"
                      opacity="0.5"
                    />
                  </pattern>
                </defs>
                <rect
                  x={startPos}
                  y={0}
                  width={binWidth}
                  height={chartHeight}
                  fill={`url(#disabled-pattern-${i})`}
                  pointerEvents="none"
                />
                <rect
                  x={startPos + 1}
                  y={0}
                  width={binWidth - 1}
                  height={chartHeight}
                  fill="none"
                  stroke="var(--destructive)"
                  strokeWidth="2"
                  opacity="1"
                  pointerEvents="none"
                />
              </>
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

            {hoveredBinIndex === i && !isDisabled && (
              <rect
                x={startPos + 1}
                y={yScale(bin.values.length)}
                width={binWidth - 2}
                height={barHeight}
                stroke="var(--accent-foreground)"
                strokeWidth={2}
                fill="none"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </>
  );
};
