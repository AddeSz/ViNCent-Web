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
        const color = getBarColor(category);
        const startPos = i === 0 ? x + 3 : x + 2;
        const width = i === 0 ? barWidth - 5 : barWidth - 4;
        const nodeHoveredCategory =
          hoveredValue != null && !node?.removed && !node?.stable
            ? hoveredValue === category
            : null;
        return (
          <g key={category}>
            <rect
              x={startPos}
              y={yScale(totalCount)}
              width={width}
              height={barHeight}
              fill={color}
              opacity={isSelected ? 0.3 : 0.2}
            />
            <rect
              x={startPos}
              y={yScale(filteredCount)}
              width={width}
              height={filteredBarHeight}
              fill={color}
            />
            <rect
              x={x}
              y={0}
              width={barWidth}
              height={chartHeight}
              fill="transparent"
              onClick={() => onBarClick(category)}
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
            {nodeHoveredCategory && (
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
