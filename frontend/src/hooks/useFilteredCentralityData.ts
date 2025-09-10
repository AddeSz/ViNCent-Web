import { useMemo } from "react";
import { useDataStore } from "./useDataStore";

interface FilteredCentralityItem {
  id: string;
  [key: string]: number | string;
}

const useFilteredCentralityData = (): FilteredCentralityItem[] => {
  const centralityData = useDataStore((state) => state.centralityData);
  const enabledCentralityKeys = useDataStore(
    (state) => state.enabledCentralityKeys,
  );
  const brushRanges = useDataStore((state) => state.brushRanges);
  const sortKey = useDataStore((state) => state.sortKey);

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
      const result: FilteredCentralityItem = { id: item.id };
      for (const key of enabledCentralityKeys) {
        if (key in item) {
          result[key] = item[key];
        }
      }
      return result;
    });
  }, [filtered, enabledCentralityKeys]);

  const sorted = useMemo(() => {
    if (sortKey === "default") return mapped;

    return [...mapped].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal !== "number" || typeof bVal !== "number") return 0;
      return bVal - aVal;
    });
  }, [mapped, sortKey]);

  return sorted;
};

export default useFilteredCentralityData;
