import { Slider } from "@/components/ui/slider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useKeys } from "@/hooks/useKeys";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type { FullData } from "@/types/network";
import { formatKeyLabel } from "@/utils/utils";
import { useCallback, useMemo, useRef, useState } from "react";
import BarChart from "./components/BarChart";
import HistogramChart from "./components/HistogramChart";

interface ChartFilteringProps {
  data: FullData[];
  dataMap: Map<string, FullData>;
}

const ChartFiltering = ({ data, dataMap }: ChartFilteringProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const dimensions = useResizeObserver(containerRef);
  const width = useDebouncedValue(dimensions?.width ?? 0, 10);
  const { allKeys, enabledCentralityKeys } = useKeys();
  const [binCount, setBinCount] = useState(16);

  const attributeBrushRanges = useAttributeStore((s) => s.brushRanges);
  const setAttributeBrushRange = useAttributeStore((s) => s.setBrushRange);
  const attributeData = useAttributeStore((s) => s.attributeData);
  const attributeInfo = useAttributeStore((s) => s.attributeInfo);
  const selectedCategories = useAttributeStore((s) => s.selectedCategories);
  const setSelectedCategories = useAttributeStore(
    (s) => s.setSelectedCategories,
  );

  const centralityBrushRanges = useCentralityStore((s) => s.brushRanges);
  const setCentralityBrushRange = useCentralityStore((s) => s.setBrushRange);
  const centralityData = useCentralityStore((s) => s.centralityData);

  const allBrushRanges = useMemo(
    () => ({
      ...attributeBrushRanges,
      ...centralityBrushRanges,
    }),
    [attributeBrushRanges, centralityBrushRanges],
  );

  const handleAttributeBrush = useCallback(
    (key: string, range: [number, number] | null) => {
      setAttributeBrushRange(key, range);
    },
    [setAttributeBrushRange],
  );

  const handleCentralityBrush = useCallback(
    (key: string, range: [number, number] | null) => {
      setCentralityBrushRange(key, range);
    },
    [setCentralityBrushRange],
  );

  const handleCategoryClick = (key: string, category: string) => {
    const prev = useAttributeStore.getState().selectedCategories[key] || [];
    const alreadySelected = prev.includes(category);

    const newSelected = alreadySelected
      ? prev.filter((c) => c !== category)
      : [...prev, category];

    setSelectedCategories(key, newSelected);
  };

  const histogramData = useMemo(() => {
    const fullEntries: Record<string, any>[] = [];

    centralityData.forEach((centrality, nodeId) => {
      const attribute = attributeData.get(nodeId) || {};
      fullEntries.push({
        ...centrality,
        ...attribute,
      });
    });

    return fullEntries;
  }, [centralityData, attributeData]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    dataMap.forEach((attrs) => {
      allKeys.forEach((key) => {
        const value = attrs[key];
        if (value != null) {
          const strVal = String(value);
          counts.set(strVal, (counts.get(strVal) || 0) + 1);
        }
      });
    });

    return counts;
  }, [dataMap, allKeys]);

  return (
    <div className="space-y-4">
      <p className="mb-0 cursor-default truncate">Data Filtering</p>
      <div className="min-w-60 space-y-2">
        <label htmlFor="binCount" className="text-sm font-medium">
          Bin Count: {binCount}
        </label>
        <Slider
          id="binCount"
          defaultValue={[binCount]}
          min={4}
          max={64}
          step={1}
          onValueChange={([value]) => setBinCount(value)}
          className="w-full"
        />
      </div>
      <div ref={containerRef} className="w-full min-w-60 space-y-6">
        <div className="space-y-4">
          {allKeys.map((key) => {
            const info = attributeInfo.get(key);
            const rawValues = histogramData
              .map((d) => d[key])
              .filter((v) => v != null);

            if (enabledCentralityKeys.includes(key)) {
              const numericValues = rawValues.filter(
                (v): v is number => typeof v === "number",
              );
              if (numericValues.length === 0) return null;
              return (
                <div
                  key={key}
                  className="h-auto w-full rounded bg-card px-2 pb-1"
                >
                  <span className="text-sm capitalize">
                    {formatKeyLabel(key)}
                  </span>
                  <HistogramChart
                    data={data}
                    histogramValues={numericValues}
                    width={width}
                    binCount={binCount}
                    dataKey={key}
                    getColorForKey={getColorForKey}
                    onBrushChange={handleCentralityBrush}
                    brushRange={allBrushRanges[key] || null}
                    allBrushRanges={allBrushRanges}
                  />
                </div>
              );
            }

            if (info?.isNumeric) {
              const numericValues = rawValues.filter(
                (v): v is number => typeof v === "number",
              );
              if (numericValues.length === 0) return null;
              return (
                <div
                  key={key}
                  className="h-auto w-full rounded bg-card px-2 pb-1"
                >
                  <span className="text-sm capitalize">
                    {formatKeyLabel(key)}
                  </span>
                  <HistogramChart
                    data={data}
                    histogramValues={numericValues}
                    width={width}
                    binCount={binCount}
                    dataKey={key}
                    getColorForKey={getColorForKey}
                    onBrushChange={handleAttributeBrush}
                    brushRange={allBrushRanges[key] || null}
                    allBrushRanges={allBrushRanges}
                  />
                </div>
              );
            }

            if (info?.isNominal || info?.isOrdinal || info?.isBoolean) {
              const categoricalValues = rawValues.filter(
                (v): v is string | boolean =>
                  typeof v === "string" || typeof v === "boolean",
              );
              if (categoricalValues.length === 0) return null;
              return (
                <div
                  key={key}
                  className="h-auto w-full rounded bg-card px-2 pb-1"
                >
                  <span className="text-sm capitalize">
                    {formatKeyLabel(key)}
                  </span>

                  <BarChart
                    categoricalValues={categoricalValues.map(String)}
                    width={width}
                    dataKey={key}
                    getColorForKey={getColorForKey}
                    selectedCategories={selectedCategories[key] || null}
                    onBarClick={(category) =>
                      handleCategoryClick(key, category)
                    }
                    categoryCounts={categoryCounts}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default ChartFiltering;
