import { formatValue } from "@/utils/utils";

interface BarchartAxesProps {
  chartWidth: number;
  chartHeight: number;
  xScale: (index: number) => number;
  yScale: (count: number) => number;
  maxCount: number;
  categories: string[];
  barWidth: number;
  selectedCategories: string[] | null;
  isCategorySelected: (category: string) => boolean;
}

const BarchartAxes = ({
  chartWidth,
  chartHeight,
  xScale,
  yScale,
  maxCount,
  categories,
  barWidth,
  selectedCategories,
  isCategorySelected,
}: BarchartAxesProps) => {
  const formatLabel = (category: string, maxChars: number = 8): string => {
    if (category.length <= maxChars) return category;
    return category.slice(0, maxChars - 1) + "…";
  };

  return (
    <>
      {[0, 0.33, 0.67, 1].map((fraction) => {
        const count = Math.round(maxCount * fraction);
        const y = Math.floor(yScale(count));
        return (
          <g key={`y-${fraction}`}>
            {fraction !== 0 && (
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="white"
                strokeOpacity={0.3}
                strokeDasharray="4,8"
                className="pointer-events-none"
              />
            )}
            <line x1={-4} y1={y} x2={0} y2={y} stroke="currentColor" />
            <text
              x={-6}
              y={y + 1}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="currentColor"
            >
              {count}
            </text>
          </g>
        );
      })}

      <line
        x1={0}
        y1={chartHeight}
        x2={chartWidth}
        y2={chartHeight}
        stroke="currentColor"
        strokeOpacity={1}
      />

      {categories.map((category, i) => {
        const x = Math.round(xScale(i) + barWidth / 2);
        const isSelected = isCategorySelected(category);
        const hasSelection =
          selectedCategories && selectedCategories.length > 0;
        const maxChars = Math.floor(barWidth / 7);

        return (
          <g key={`label-${category}`}>
            <line
              x1={x}
              y1={chartHeight}
              x2={x}
              y2={chartHeight + 4}
              stroke="currentColor"
            />
            <text
              x={x}
              y={chartHeight + 14}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              opacity={!hasSelection || isSelected ? 1 : 0.6}
            >
              {formatLabel(formatValue(category), maxChars)}
            </text>
          </g>
        );
      })}
      <line
        x1={0}
        y1={chartHeight}
        x2={0}
        y2={chartHeight + 4}
        stroke="currentColor"
      />

      <line
        x1={0}
        y1={0}
        x2={0}
        y2={chartHeight}
        stroke="currentColor"
        strokeOpacity={1}
      />
    </>
  );
};

export default BarchartAxes;
