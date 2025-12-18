import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";

interface BarchartBarsProps {
  categories: string[];
  categoryCounts: Map<string, number>;
  filteredCategoryCounts: Map<string, number>;
  chartHeight: number;
  barWidth: number;
  xScale: (index: number) => number;
  yScale: (count: number) => number;
  isCategorySelected: (category: string) => boolean;
  getBarColor: (category: string) => string;
  hoverCategory: string | null;
  setHoverCategory: (category: string | null) => void;
  onBarClick: (category: string) => void;
  dataKey: string;
  filteredData: Map<string, FullData>;
  disabledValues: Set<number | string>;
  onDisabledValuesChange: (values: Set<number | string>) => void;
}

const BarchartBars = ({
  categories,
  categoryCounts,
  filteredCategoryCounts,
  chartHeight,
  barWidth,
  xScale,
  yScale,
  isCategorySelected,
  getBarColor,
  hoverCategory,
  setHoverCategory,
  onBarClick,
  dataKey,
  filteredData,
  disabledValues,
  onDisabledValuesChange,
}: BarchartBarsProps) => {
  const hoveredNode = useNetworkStore((s) => s.hoveredNode);
  const node = hoveredNode ? filteredData.get(hoveredNode) : null;
  const hoveredValue = node?.[dataKey];

  return (
    <>
      {categories.map((category, i) => {
        const x = xScale(i);
        const totalCount = categoryCounts.get(category) || 0;
        const filteredCount = filteredCategoryCounts.get(category) || 0;
        const barHeight = chartHeight - yScale(totalCount);
        const filteredBarHeight = chartHeight - yScale(filteredCount);
        const isSelected = isCategorySelected(category);
        const isHovered = hoverCategory === category;
        const isDisabled = disabledValues.has(category);
        const color = getBarColor(category);
        const startPos = x + 1;
        const width = barWidth - 2;

        const nodeHoveredCategory =
          hoveredValue != null && !node?.removed && !node?.stable
            ? String(hoveredValue) === String(category)
            : false;

        return (
          <g key={category}>
            <rect
              x={startPos}
              y={yScale(totalCount)}
              width={width}
              height={barHeight}
              fill={color}
              opacity={isDisabled ? 0.3 : isSelected ? 0.3 : 0.2}
            />

            {!isDisabled && (
              <rect
                x={startPos}
                y={yScale(filteredCount)}
                width={width}
                height={filteredBarHeight}
                fill={color}
              />
            )}

            {isDisabled && (
              <>
                <defs>
                  <pattern
                    id={`disabled-category-${category.replace(/[^a-zA-Z0-9]/g, "_")}`}
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
                  width={width}
                  height={chartHeight}
                  fill={`url(#disabled-category-${category.replace(/[^a-zA-Z0-9]/g, "_")})`}
                  pointerEvents="none"
                />
                <rect
                  x={startPos + 1}
                  y={0}
                  width={width - 1}
                  height={chartHeight}
                  fill="none"
                  stroke="var(--destructive)"
                  strokeWidth="2"
                  opacity="1"
                  pointerEvents="none"
                />
              </>
            )}

            <rect
              x={x}
              y={0}
              width={barWidth}
              height={chartHeight}
              fill="transparent"
              onClick={() => onBarClick(category)}
              onMouseDown={(e) => {
                if (e.button === 2) {
                  e.preventDefault();
                  const current = disabledValues;
                  const next = new Set(current);
                  if (next.has(category)) {
                    next.delete(category);
                  } else {
                    next.add(category);
                  }
                  onDisabledValuesChange(next);
                }
              }}
              onContextMenu={(e) => e.preventDefault()}
              onMouseEnter={() => setHoverCategory(category)}
              onMouseLeave={() => setHoverCategory(null)}
              className="cursor-pointer"
            />

            {isHovered && (
              <rect
                x={startPos}
                y={0}
                width={width}
                height={chartHeight}
                fill="currentColor"
                opacity={0.1}
                pointerEvents="none"
              />
            )}

            {isSelected && (
              <rect
                x={startPos}
                y={chartHeight + 17}
                width={width}
                height={3}
                fill={color}
                rx={1.5}
                ry={1.5}
              />
            )}

            {nodeHoveredCategory && !isDisabled && (
              <rect
                x={startPos + 1}
                y={yScale(totalCount)}
                width={width - 2}
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

export default BarchartBars;
