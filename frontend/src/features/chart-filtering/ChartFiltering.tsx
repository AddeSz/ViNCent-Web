import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useKeys } from "@/hooks/useKeys";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import Barchart from "./barchart/Barchart";
import { createBinnedData } from "./components/createBinnedData";
import Histogram from "./histogram/Histogram";

export interface ChartDimensions {
  margin: { top: number; right: number; bottom: number; left: number };
  svgWidth: number;
  svgHeight: number;
  chartWidth: number;
  chartHeight: number;
}

const ChartFiltering = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const dimensions = useResizeObserver(containerRef);
  const width = useDebouncedValue(dimensions?.width ?? 0, 10);

  const margin = { top: 6, right: 14, bottom: 20, left: 24 };
  const height = 140;
  const chartWidth = Math.round(width - margin.left - margin.right);
  const chartHeight = height - margin.top - margin.bottom;

  const chartDimensions: ChartDimensions = {
    margin,
    svgWidth: width,
    svgHeight: height,
    chartWidth,
    chartHeight,
  };

  const { allKeys } = useKeys();

  const [globalBinCount, setGlobalBinCount] = useState(16);
  const [useIndividualBinCounts, setUseIndividualBinCounts] = useState(false);
  const [binCountsByKey, setBinCountsByKey] = useState<Record<string, number>>(
    {},
  );

  const getBinCount = (key: string) => {
    if (useIndividualBinCounts) {
      return binCountsByKey[key] ?? globalBinCount;
    }
    return globalBinCount;
  };

  const setBinCountForKey = (key: string, count: number) => {
    setBinCountsByKey((prev) => ({ ...prev, [key]: count }));
  };

  const metricsData = useMetricsStore((s) => s.metricsData);
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);
  const selectedCategories = useMetricsStore((s) => s.selectedCategories);
  const setSelectedCategories = useMetricsStore((s) => s.setSelectedCategories);
  const brushRanges = useMetricsStore((s) => s.brushRanges);
  const setBrushRange = useMetricsStore((s) => s.setBrushRange);
  const clearBrushRange = useMetricsStore((s) => s.clearBrushRange);
  const binnedDataByKey = useMetricsStore((s) => s.binnedDataByKey);
  const setBinnedData = useMetricsStore((s) => s.setBinnedData);
  const filteredMetricsData = useMetricsStore((s) => s.filteredMetricsData);

  const data = useMemo(() => {
    return Array.from(metricsData.values());
  }, [metricsData]);

  useEffect(() => {
    allKeys.forEach((key) => {
      const info = metricsInfo.get(key);

      if (!info || !info.isNumeric || info.isNominal) return;

      const values = data
        .map((d) => d[key])
        .filter((v): v is number => typeof v === "number");

      if (values.length > 0) {
        const binCount = getBinCount(key);
        const binnedData = createBinnedData(values, binCount);

        setBinnedData(key, binnedData);
      }
    });
  }, [
    data,
    allKeys,
    globalBinCount,
    binCountsByKey,
    useIndividualBinCounts,
    metricsInfo,
  ]);

  const handleCategoryClick = (key: string, category: string) => {
    const prev = selectedCategories[key] || [];
    const newSelected = prev.includes(category)
      ? prev.filter((c) => c !== category)
      : [...prev, category];
    setSelectedCategories(key, newSelected);
  };

  const renderBarChart = (key: string) => {
    const info = metricsInfo.get(key);
    if (!info || (!info.isNominal && !info.isOrdinal && !info.isBoolean))
      return null;

    const values = data
      .map((d) => d[key])
      .filter((v) => typeof v === "string" || typeof v === "boolean");

    if (values.length === 0) return null;
    return (
      <div key={key} className="h-full w-full rounded border bg-card pb-1">
        <div className="flex items-center justify-between gap-1 px-2 py-1">
          <p
            className="min-w-[30px] flex-1 truncate text-sm"
            title={formatKeyLabel(key)}
          >
            {formatKeyLabel(key)}
          </p>

          <Button
            variant="outline"
            onClick={() => setSelectedCategories(key, [])}
            className="flex cursor-pointer px-2 py-0.5 text-xs"
            size="zero"
            disabled={
              !selectedCategories[key] || !(selectedCategories[key].length > 0)
            }
          >
            <p className="block truncate text-xs">Clear </p>
          </Button>
        </div>

        <Barchart
          categoricalValues={values.map(String)}
          dimensions={chartDimensions}
          dataKey={key}
          getColorForKey={getColorForKey}
          selectedCategories={selectedCategories[key] || null}
          onBarClick={(category) => handleCategoryClick(key, category)}
        />
      </div>
    );
  };

  const renderHistogram = (key: string) => {
    const info = metricsInfo.get(key);

    if (!info || !info.isNumeric || info.isNominal) return null;

    const binnedData = binnedDataByKey.get(key);
    if (!binnedData) return null;

    const binCount = getBinCount(key);

    return (
      <div key={key} className="h-full w-full rounded border bg-card pb-1">
        <div className="flex items-center justify-between gap-1 px-2 py-1">
          <p
            className="min-w-[30px] flex-1 truncate text-sm"
            title={formatKeyLabel(key)}
          >
            {formatKeyLabel(key)}
          </p>

          <Button
            variant="outline"
            onClick={() => clearBrushRange(key)}
            className="ml-auto flex cursor-pointer px-2 py-0.5 text-xs"
            size="zero"
            disabled={!brushRanges[key]}
          >
            <p className="block truncate text-xs">Clear</p>
          </Button>
        </div>

        <Histogram
          data={binnedData}
          dimensions={chartDimensions}
          dataKey={key}
          getColorForKey={getColorForKey}
          brushRange={brushRanges[key]}
          onBrushChange={(range) => setBrushRange(key, range)}
          filteredNodeIds={new Set(filteredMetricsData.keys())}
        />
        {brushRanges[key] && (
          <p className="min-w-[30px] flex-1 truncate pl-2 text-xs text-muted-foreground">
            {(() => {
              const { range, inclusive } = brushRanges[key]!;
              const [min, max] = range;
              const leftBracket = "[";
              const rightBracket = inclusive ? "]" : ")";
              return `Selected Range: ${leftBracket}${formatValue(min)}, ${formatValue(max)}${rightBracket}`;
            })()}
          </p>
        )}

        {useIndividualBinCounts && (
          <>
            <Separator orientation="horizontal" />
            <div className="px-2 py-1">
              <p className="text-xs">Bin Count: {binCount}</p>
              <div className="flex items-center pt-1">
                <Slider
                  value={[binCount]}
                  min={2}
                  max={50}
                  step={1}
                  className="flex"
                  onValueChange={([val]) => setBinCountForKey(key, val)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b-2 p-2">
        <p className="mb-0 cursor-default truncate">Bin Counts </p>
        <div className="rounded-lg bg-card p-1">
          <RadioGroup
            value={useIndividualBinCounts ? "individual" : "global"}
            onValueChange={(value) =>
              setUseIndividualBinCounts(value === "individual")
            }
            className="flex flex-wrap gap-1"
          >
            <div className="flex min-w-0 items-center" title="Global">
              <RadioGroupItem
                value="global"
                id="global"
                className="cursor-pointer"
              />
              <Label htmlFor="global" className="cursor-pointer p-1">
                Global
              </Label>
            </div>
            <div className="flex min-w-0 items-center" title="Individual">
              <RadioGroupItem
                value="individual"
                id="individual"
                className="cursor-pointer"
              />
              <Label
                htmlFor="individual"
                title="Individual"
                className="cursor-pointer p-1"
              >
                Individual
              </Label>
            </div>
          </RadioGroup>
          {!useIndividualBinCounts && (
            <div className="space-y-1 pb-1">
              <p
                className="cursor-default truncate text-sm"
                title={`Global Bin Count: ${globalBinCount}`}
              >
                Global Bin Count: {globalBinCount}
              </p>
              <Slider
                value={[globalBinCount]}
                min={2}
                max={50}
                step={1}
                onValueChange={([val]) => setGlobalBinCount(val)}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="scrollbar-thin h-full w-full overflow-y-auto px-2 pt-1 pb-2"
      >
        <div className="space-y-4">
          {allKeys.map(renderHistogram)}

          {allKeys.map(renderBarChart)}
        </div>
      </div>
    </div>
  );
};

export default ChartFiltering;
