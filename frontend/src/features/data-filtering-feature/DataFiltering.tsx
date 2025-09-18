import { Slider } from "@/components/shadcnUI/slider";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import { useRef, useState } from "react";
import HistogramChart from "./components/HistogramChart";

const DataFiltering = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const centralityData = useCentralityStore((s) => s.centralityData);
  const centralityKeys = useCentralityStore((s) => s.centralityKeys);
  const enabledCentralityKeys = useCentralityStore(
    (s) => s.enabledCentralityKeys,
  );
  const toggleCentralityKey = useCentralityStore((s) => s.toggleCentralityKey);
  const brushRanges = useCentralityStore((s) => s.brushRanges);
  const setBrushRange = useCentralityStore((s) => s.setBrushRange);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);

  const [binCount, setBinCount] = useState(16);

  const handleBrushChange = (key: string, range: [number, number] | null) => {
    setBrushRange(key, range);
  };

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

      <div ref={containerRef} className="w-full min-w-60 space-y-4">
        {centralityKeys.map((key) => {
          const values = centralityData
            .map((entry) => entry[key])
            .filter((val): val is number => typeof val === "number");
          const isEnabled = enabledCentralityKeys.includes(key);

          return (
            <div
              key={key}
              className="h-auto w-full space-y-2 rounded bg-card p-1"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm capitalize">{key.replace(/_/g, " ")}</h3>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleCentralityKey(key)}
                  />
                  <span className="flex items-center text-xs">Show</span>
                </label>
              </div>

              {isEnabled && (
                <HistogramChart
                  data={values}
                  containerRef={containerRef}
                  binCount={binCount}
                  centralityKey={key}
                  getColorForKey={getColorForKey}
                  onBrushChange={handleBrushChange}
                  brushRange={brushRanges[key]}
                  allCentralityData={centralityData}
                  allBrushRanges={brushRanges}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataFiltering;
