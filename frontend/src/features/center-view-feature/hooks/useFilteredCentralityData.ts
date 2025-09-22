import { useCentralityStore } from "@/hooks/useCentralityStore";
import type { Centrality } from "@/types/network";
import { useMemo } from "react";

export const useFilteredCentralityData = (): Centrality[] => {
  const centralityData = useCentralityStore((s) => s.centralityData);
  const enabledCentralityKeys = useCentralityStore(
    (s) => s.enabledCentralityKeys,
  );
  const brushRanges = useCentralityStore((s) => s.brushRanges);

  const filtered = useMemo(() => {
    return centralityData.filter((item) => {
      return enabledCentralityKeys.every((key) => {
        const value = item[key];
        const range = brushRanges[key];

        if (!range) return true;
        if (typeof value !== "number") return false;

        const [min, max] = range;
        return value >= min && value <= max;
      });
    });
  }, [centralityData, enabledCentralityKeys, brushRanges]);

  const mapped = useMemo(() => {
    return filtered.map((item) => {
      const result: Centrality = { id: item.id };
      for (const key of enabledCentralityKeys) {
        if (key in item) {
          result[key] = item[key];
        }
      }
      return result;
    });
  }, [filtered, enabledCentralityKeys]);

  return mapped;
};
