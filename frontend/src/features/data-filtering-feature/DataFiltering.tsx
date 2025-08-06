import HistogramChart from "./HistogramChart";
import { useDataStore } from "@/hooks/useDataStore";
import { useRef, useState } from "react";
import { Slider } from "@/components/shadcnUI/slider";

const DataFiltering = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const centralityData = useDataStore((state) => state.centralityData);
  const centralityKeys = useDataStore((state) => state.centralityKeys);

  const [binCount, setBinCount] = useState(16);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Data Filtering</h2>

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

          return (
            <div key={key} className="h-46 w-full rounded bg-card p-2 shadow">
              <h3 className="mb-2 text-sm font-medium">{key}</h3>
              <HistogramChart
                data={values}
                containerRef={containerRef}
                binCount={binCount}
                centralityKey={key}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataFiltering;
