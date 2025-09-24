import { Slider } from "@/components/shadcnUI/slider";
import { useCombinedData } from "@/features/center-view-feature/hooks/useCombinedData";
import { useKeys } from "@/features/center-view-feature/hooks/useKeys";
import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import { formatKeyLabel } from "@/utils/utils";
import { useCallback, useMemo, useRef, useState } from "react";
import HistogramChart from "./components/HistogramChart";

const DataFiltering = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const dimensions = useResizeObserver(containerRef);
  const width = dimensions?.width ?? 0;
  const { combinedData } = useCombinedData();
  const { allKeys, attributeKeys, centralityKeys } = useKeys();
  const [binCount, setBinCount] = useState(16);

  const attributeBrushRanges = useAttributeStore((s) => s.brushRanges);
  const setAttributeBrushRange = useAttributeStore((s) => s.setBrushRange);
  const attributeData = useAttributeStore((s) => s.attributeData);

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

  const histogramData = useMemo(() => {
    const combinedEntries: Record<string, any>[] = [];

    centralityData.forEach((centrality, nodeId) => {
      const attribute = attributeData.get(nodeId) || {};
      combinedEntries.push({
        ...centrality,
        ...attribute,
      });
    });

    return combinedEntries;
  }, [centralityData, attributeData]);

  return (
    <div className="space-y-4">
      <h2 className="mb-0 cursor-default text-lg">Data Filtering</h2>
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
            const values = histogramData
              .map((d) => d[key])
              .filter((val): val is number => typeof val === "number");
            if (values.length === 0) return null;
            return (
              <div
                key={key}
                className="h-auto w-full space-y-2 rounded bg-card p-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {formatKeyLabel(key)}
                  </span>
                </div>
                <HistogramChart
                  data={combinedData}
                  histogramValues={values}
                  width={width}
                  binCount={binCount}
                  dataKey={key}
                  getColorForKey={getColorForKey}
                  onBrushChange={(brushKey, range) => {
                    if (attributeKeys.includes(brushKey)) {
                      handleAttributeBrush(brushKey, range);
                    } else if (centralityKeys.includes(brushKey)) {
                      handleCentralityBrush(brushKey, range);
                    }
                  }}
                  brushRange={allBrushRanges[key] || null}
                  allBrushRanges={allBrushRanges}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DataFiltering;
