import type { FullData } from "@/types/network";
import * as d3 from "d3";
import { useMemo } from "react";

export const useChartData = (data: FullData[], allKeys: string[]) => {
  return useMemo(() => {
    if (allKeys.length === 0) return null;
    if (data.length === 0) return { series: [], arcData: [] };

    const visibleData = data.filter((d) => !d.hidden);

    if (visibleData.length === 0) {
      return { series: [], arcData: [] };
    }

    const series = d3
      .stack<FullData>()
      .keys(allKeys)
      .value(() => 1)(visibleData);

    const arcData = series.flatMap((layer) =>
      layer.map((d) => ({
        ...d,
        key: layer.key,
        value: d.data[layer.key as keyof FullData],
        id: d.data.id,
      })),
    );

    return { series, arcData };
  }, [data, allKeys]);
};
