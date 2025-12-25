import type { FullData } from "@/types/network";
import { formatValue } from "@/utils/utils";
import { useMemo, useRef, useState } from "react";
import type { ChartDimensions } from "../ChartFiltering";
import { Tooltip } from "../components/Tooltip";
import BarchartAxes from "./components/BarchartAxes";
import BarchartBars from "./components/BarchartBars";

interface BarchartProps {
  categoricalValues: string[];
  filteredData: Map<string, FullData>;
  dimensions: ChartDimensions;
  dataKey: string;
  getColorForMetric: (key: string, value?: string | number) => string;
  selectedCategories: string[] | null;
  onBarClick: (category: string) => void;
  disabledValues: Set<number | string>;
  onDisabledValuesChange: (values: Set<number | string>) => void;
}

const MIN_BAR_WIDTH = 5;

const Barchart = ({
  categoricalValues,
  filteredData,
  dimensions,
  dataKey,
  getColorForMetric,
  selectedCategories,
  onBarClick,
  disabledValues,
  onDisabledValuesChange,
}: BarchartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverCategory, setHoverCategory] = useState<string | null>(null);

  const {
    svgWidth: width,
    svgHeight: height,
    margin,
    chartWidth,
    chartHeight,
  } = dimensions;

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    categoricalValues.forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return counts;
  }, [categoricalValues]);

  const categories = useMemo(() => {
    return Array.from(categoryCounts.keys()).sort(
      (a, b) => (categoryCounts.get(b) || 0) - (categoryCounts.get(a) || 0),
    );
  }, [categoryCounts]);

  const filteredCategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const [_, data] of filteredData.entries()) {
      const value = data[dataKey];
      if (value != null) {
        const strValue = String(value);
        if (!disabledValues.has(strValue)) {
          counts.set(strValue, (counts.get(strValue) || 0) + 1);
        }
      }
    }

    return counts;
  }, [filteredData, disabledValues]);

  const maxCount = Math.max(...Array.from(categoryCounts.values()));

  const yScale = (count: number) => {
    return chartHeight - (count / maxCount) * chartHeight;
  };

  const barWidth = chartWidth / categories.length;
  const xScale = (index: number) => index * barWidth;

  const canRenderBars = barWidth >= MIN_BAR_WIDTH;

  const isCategorySelected = (category: string): boolean => {
    if (!selectedCategories || selectedCategories.length === 0) return false;
    return selectedCategories.includes(category);
  };

  const getBarColor = (category: string) =>
    getColorForMetric(dataKey, category);

  if (!canRenderBars) {
    return (
      <div className="flex h-full w-full items-center justify-center p-1">
        <div className="text-center">
          <div className="text-sm font-medium text-muted-foreground">
            Too many categories to display ({categories.length})
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Increasing window size may help
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          <BarchartBars
            categories={categories}
            categoryCounts={categoryCounts}
            filteredCategoryCounts={filteredCategoryCounts}
            chartHeight={chartHeight}
            barWidth={barWidth}
            xScale={xScale}
            yScale={yScale}
            isCategorySelected={isCategorySelected}
            getBarColor={getBarColor}
            hoverCategory={hoverCategory}
            setHoverCategory={setHoverCategory}
            onBarClick={onBarClick}
            dataKey={dataKey}
            filteredData={filteredData}
            disabledValues={disabledValues}
            onDisabledValuesChange={onDisabledValuesChange}
          />

          <BarchartAxes
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            xScale={xScale}
            yScale={yScale}
            maxCount={maxCount}
            categories={categories}
            barWidth={barWidth}
            selectedCategories={selectedCategories}
            isCategorySelected={isCategorySelected}
          />
        </g>
      </svg>

      {hoverCategory !== null && (
        <Tooltip
          isVisible={true}
          containerRef={containerRef}
          margin={margin}
          targetX={xScale(categories.indexOf(hoverCategory))}
          targetWidth={barWidth}
        >
          <div className="w-full truncate font-medium">
            {formatValue(hoverCategory)}
          </div>
          <div className="text-muted-foreground">
            {(() => {
              const filteredCount =
                filteredCategoryCounts?.get(hoverCategory) ?? 0;
              const totalCount = categoryCounts?.get(hoverCategory) ?? 0;

              return filteredCount < totalCount ? (
                <>
                  Count: {filteredCount} / {totalCount}
                </>
              ) : (
                <>Count: {totalCount}</>
              );
            })()}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default Barchart;
