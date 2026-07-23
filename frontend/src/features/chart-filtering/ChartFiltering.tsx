import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrentMetricsInfo } from "@/hooks/useCurrentMetricsInfo";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useKeys } from "@/hooks/useKeys";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useFilterStore } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useOptionsStore } from "@/stores/useOptionsStore";
import type { ViewEdge, ViewNode } from "@/types";
import { formatKeyLabel, formatValue, getNodeId } from "@/utils/utils";
import { HelpCircle } from "lucide-react";
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

interface ChartFilteringProps {
  nodeData: Map<string, ViewNode>;
  edgeData: Map<string, ViewEdge>;
}

const ChartFiltering = ({ nodeData, edgeData }: ChartFilteringProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const getColorForMetric = useGetColorForMetric();
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

  const { enabledNodeKeys, enabledEdgeKeys } = useKeys();
  const [globalBinCount, setGlobalBinCount] = useState(16);
  const [useIndividualBinCounts, setUseIndividualBinCounts] = useState(false);
  const [binCountsByKey, setBinCountsByKey] = useState<Record<string, number>>(
    {},
  );
  const descriptions = useOptionsStore((s) => s.optionDescriptions);
  const currentNodes = useNetworkStore((s) => s.currentNodes);
  const currentEdges = useNetworkStore((s) => s.currentEdges);
  const metricsInfo = useCurrentMetricsInfo();
  const selectedCategories = useFilterStore((s) => s.selectedCategories);
  const setSelectedCategories = useFilterStore((s) => s.setSelectedCategories);
  const brushRanges = useFilterStore((s) => s.brushRanges);
  const setBrushRange = useFilterStore((s) => s.setBrushRange);
  const clearBrushRange = useFilterStore((s) => s.clearBrushRange);
  const binnedDataByKey = useFilterStore((s) => s.binnedDataByKey);
  const setBinnedData = useFilterStore((s) => s.setBinnedData);
  const disabledValues = useFilterStore((s) => s.disabledValues);
  const setDisabledValues = useFilterStore((s) => s.setDisabledValues);
  const clearDisabledValues = useFilterStore((s) => s.clearDisabledValues);
  const hiddenNodes = useFilterStore((s) => s.hiddenNodes);

  const getBinCount = (key: string) => {
    if (useIndividualBinCounts) {
      return binCountsByKey[key] ?? globalBinCount;
    }
    return globalBinCount;
  };

  const setBinCountForKey = (key: string, count: number) => {
    setBinCountsByKey((prev) => ({ ...prev, [key]: count }));
  };

  const fullNodeData = useMemo(() => {
    return Array.from(currentNodes.values())
      .filter((node) => !hiddenNodes.has(node.id))
      .map((node) => node.attributes);
  }, [currentNodes, hiddenNodes]);

  const fullEdgeData = useMemo(() => {
    return Array.from(currentEdges.values())
      .filter(
        (edge) =>
          !hiddenNodes.has(getNodeId(edge.source)) &&
          !hiddenNodes.has(getNodeId(edge.target)),
      )
      .map((edge) => edge.attributes);
  }, [currentEdges, hiddenNodes]);

  const filteredNodeData = useMemo(() => {
    const filtered = new Map<string, ViewNode>();
    for (const [key, value] of nodeData.entries()) {
      if (value && !value.flags.pendingRemoval) {
        filtered.set(key, value);
      }
    }
    return filtered;
  }, [nodeData]);

  const filteredEdgeData = useMemo(() => {
    const filtered = new Map<string, ViewEdge>();
    for (const [key, value] of edgeData.entries()) {
      if (value && !value.flags.pendingRemoval) {
        filtered.set(key, value);
      }
    }
    return filtered;
  }, [edgeData]);

  useEffect(() => {
    enabledNodeKeys.forEach((key) => {
      const info = metricsInfo.get(key);
      if (!info || !info.isNumeric || info.isCategory) return null;

      const values = fullNodeData
        .map((d) => d[key])
        .filter((v): v is number => typeof v === "number");

      if (values.length > 0) {
        const binCount = getBinCount(key);
        const binnedData = createBinnedData(values, binCount);
        setBinnedData(key, binnedData);
      } else {
        setBinnedData(key, null);
      }
    });

    enabledEdgeKeys.forEach((key) => {
      const info = metricsInfo.get(key);
      if (!info || !info.isNumeric || info.isCategory) return;

      const values = fullEdgeData
        .map((d) => d[key])
        .filter((v): v is number => typeof v === "number");

      if (values.length > 0) {
        const binCount = getBinCount(key);
        const binnedData = createBinnedData(values, binCount);
        setBinnedData(key, binnedData);
      } else {
        setBinnedData(key, null);
      }
    });
  }, [
    fullNodeData,
    fullEdgeData,
    enabledNodeKeys,
    enabledEdgeKeys,
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

  const renderBarChart = (key: string, isEdgeMetric: boolean = false) => {
    const info = metricsInfo.get(key);
    if (!info || !info.isCategory) return null;

    const sourceData = isEdgeMetric ? fullEdgeData : fullNodeData;
    const values = sourceData
      .map((d) => d[key])
      .filter(
        (v) =>
          typeof v === "string" ||
          typeof v === "boolean" ||
          typeof v === "number",
      );

    if (values.length === 0) return null;
    const disabledValuesForKey =
      disabledValues[key] || new Set<number | string>();

    return (
      <div key={key} className="h-full w-full rounded border bg-card pb-1">
        <div className="flex items-center justify-between gap-1 py-1 pr-2 pl-1">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {descriptions?.[key] && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{descriptions[key]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <p
              className="min-w-0 -translate-y-px truncate text-sm"
              title={formatKeyLabel(key)}
            >
              {formatKeyLabel(key)}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategories(key, []);
              clearDisabledValues(key);
            }}
            className="flex cursor-pointer px-2 py-0.5 text-xs"
            size="zero"
            disabled={
              (!selectedCategories[key] ||
                !(selectedCategories[key].length > 0)) &&
              disabledValuesForKey.size === 0
            }
          >
            <p className="block truncate text-xs">Clear </p>
          </Button>
        </div>

        <Barchart
          categoricalValues={values.map(String)}
          filteredData={isEdgeMetric ? filteredEdgeData : filteredNodeData}
          dimensions={chartDimensions}
          dataKey={key}
          getColorForMetric={getColorForMetric}
          selectedCategories={selectedCategories[key] || null}
          onBarClick={(category) => handleCategoryClick(key, category)}
          disabledValues={disabledValuesForKey}
          onDisabledValuesChange={(values) => setDisabledValues(key, values)}
        />
      </div>
    );
  };

  const renderHistogram = (key: string, isEdgeMetric: boolean = false) => {
    const info = metricsInfo.get(key);
    if (!info || !info.isNumeric) return null;

    const binnedData = binnedDataByKey.get(key);
    if (!binnedData) return null;
    const brushRangeForKey = brushRanges[key];

    const binCount = getBinCount(key);
    const disabledValuesForKey =
      disabledValues[key] || new Set<number | string>();

    return (
      <div key={key} className="h-full w-full rounded border bg-card pb-1">
        <div className="flex items-center justify-between gap-1 py-1 pr-2 pl-1">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {descriptions?.[key] && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="size-4 shrink-0 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{descriptions[key]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <p className="min-w-0 truncate text-sm" title={formatKeyLabel(key)}>
              {formatKeyLabel(key)}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              clearBrushRange(key);
              clearDisabledValues(key);
            }}
            className="ml-auto flex cursor-pointer px-2 py-0.5 text-xs"
            size="zero"
            disabled={!(brushRangeForKey || disabledValuesForKey.size > 0)}
          >
            <p className="block truncate text-xs">Clear</p>
          </Button>
        </div>

        <Histogram
          binnedData={binnedData}
          filteredData={isEdgeMetric ? filteredEdgeData : filteredNodeData}
          dimensions={chartDimensions}
          dataKey={key}
          getColorForMetric={getColorForMetric}
          brushRange={brushRangeForKey}
          onBrushChange={(range) => setBrushRange(key, range)}
          disabledValues={disabledValuesForKey}
          onDisabledValuesChange={(values) => setDisabledValues(key, values)}
        />
        {brushRangeForKey && (
          <p className="min-w-7.5 flex-1 truncate pl-2 text-xs text-muted-foreground">
            {(() => {
              const { range, inclusive } = brushRangeForKey!;
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
          {enabledNodeKeys.map((key) => {
            const info = metricsInfo.get(key);
            if (!info) return null;
            return info.isCategory
              ? renderBarChart(key, false)
              : renderHistogram(key, false);
          })}
          {enabledEdgeKeys.map((key) => {
            const info = metricsInfo.get(key);
            if (!info) return null;
            return info.isCategory
              ? renderBarChart(key, true)
              : renderHistogram(key, true);
          })}
        </div>
      </div>
    </div>
  );
};

export default ChartFiltering;
