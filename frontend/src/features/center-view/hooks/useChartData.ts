import type { CombinedData } from "@/types/network";
import * as d3 from "d3";
import { useMemo } from "react";

export const useChartData = (
  combinedData: CombinedData[],
  allKeys: string[],
) => {
  return useMemo(() => {
    if (combinedData.length === 0 || allKeys.length === 0) return null;

    const series = d3
      .stack<CombinedData>()
      .keys(allKeys)
      .value(() => 1)(combinedData);

    const arcData = series.flatMap((layer) =>
      layer.map((d) => ({
        ...d,
        key: layer.key,
        value: d.data[layer.key as keyof CombinedData],
        id: d.data.id,
      })),
    );
    return { series, arcData };
  }, [combinedData, allKeys]);
};
