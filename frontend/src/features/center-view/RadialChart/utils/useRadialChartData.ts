import type { FullData } from "@/types";
import { calculateBandwidth, calculateGapProportion } from "@/utils/utils";
import * as d3 from "d3";
import { useMemo } from "react";

interface UseRadialChartDataProps {
  data: FullData[];
  enabledCentralityKeys: string[];
  enabledAttributeKeys: string[];
  enabledCommunityKeys: string[];
  communitiesInArcs: boolean;
  separateMetrics: boolean;
  innerRadius: number;
  outerRadius: number;
}

export const useRadialChartData = ({
  data,
  enabledCentralityKeys,
  enabledAttributeKeys,
  enabledCommunityKeys,
  communitiesInArcs,
  separateMetrics,
  innerRadius,
  outerRadius,
}: UseRadialChartDataProps) => {
  const visibleData = useMemo(() => data.filter((d) => !d.hidden), [data]);

  const chartData = useMemo(() => {
    const allKeys = [
      ...enabledCentralityKeys,
      ...enabledAttributeKeys,
      ...(communitiesInArcs ? enabledCommunityKeys : []),
    ];

    const keys = allKeys.length === 0 ? ["filler"] : allKeys;

    if (visibleData.length === 0) {
      return { series: [], arcData: [] };
    }

    const filledData =
      allKeys.length === 0
        ? visibleData.map((d) => ({ ...d, filler: 1 }))
        : visibleData;

    const series = d3
      .stack<FullData>()
      .keys(keys)
      .value((d, key) => d[key] ?? 0)(filledData);

    return { series };
  }, [
    visibleData,
    enabledCentralityKeys,
    enabledAttributeKeys,
    enabledCommunityKeys,
    communitiesInArcs,
  ]);

  const xScale = useMemo(() => {
    const n = visibleData.length;
    if (n === 0) return d3.scaleBand<string>();

    const bandWidth = calculateBandwidth(n);

    if (n === 1) {
      const scale = (id: string) => {
        const index = visibleData.findIndex((d) => d.id === id);
        return index === -1 ? undefined : 0;
      };
      scale.bandwidth = () => bandWidth;
      scale.step = () => bandWidth;
      scale.domain = () => visibleData.map((d) => d.id);
      return scale as d3.ScaleBand<string>;
    }

    const gapProportion = calculateGapProportion(n);
    const gapSize = (2 * Math.PI * gapProportion) / n;

    const scale = (id: string) => {
      const index = visibleData.findIndex((d) => d.id === id);
      if (index === -1) return undefined;
      return gapSize / 2 + index * (bandWidth + gapSize);
    };

    scale.bandwidth = () => bandWidth;
    scale.step = () => bandWidth + gapSize;
    scale.domain = () => visibleData.map((d) => d.id);

    return scale as d3.ScaleBand<string>;
  }, [visibleData]);

  const angleMap = useMemo(() => {
    if (!xScale) return new Map<string, number>();
    const angleMap = new Map<string, number>();
    xScale.domain().forEach((id) => {
      const angle = xScale(id);
      if (angle !== undefined) angleMap.set(id, angle + xScale.bandwidth() / 2);
    });
    return angleMap;
  }, [xScale]);

  const { yScale, getKeyIndex } = useMemo(() => {
    const centralityCount = enabledCentralityKeys.length;
    const attributeCount = enabledAttributeKeys.length;
    const communityCount = communitiesInArcs ? enabledCommunityKeys.length : 0;
    const gap = separateMetrics ? 2 : 0;

    const gapAfterCentrality =
      centralityCount > 0 && (attributeCount > 0 || communityCount > 0)
        ? gap
        : 0;

    const gapAfterAttribute =
      attributeCount > 0 && communityCount > 0 ? gap : 0;

    const totalRings = Math.max(
      centralityCount +
        gapAfterCentrality +
        attributeCount +
        gapAfterAttribute +
        communityCount,
      1,
    );

    const yScale = d3
      .scaleLinear<number, number>()
      .domain([0, totalRings])
      .range([innerRadius, outerRadius]);

    const getKeyIndex = (key: string): number => {
      const cIndex = enabledCentralityKeys.indexOf(key);
      if (cIndex !== -1) return cIndex;

      const aIndex = enabledAttributeKeys.indexOf(key);
      if (aIndex !== -1) {
        return centralityCount + gapAfterCentrality + aIndex;
      }

      const commIndex = enabledCommunityKeys.indexOf(key);
      if (commIndex !== -1 && communityCount > 0) {
        return (
          centralityCount +
          gapAfterCentrality +
          attributeCount +
          gapAfterAttribute +
          commIndex
        );
      }

      return 0;
    };

    return { yScale, getKeyIndex };
  }, [
    innerRadius,
    outerRadius,
    separateMetrics,
    enabledCentralityKeys,
    enabledAttributeKeys,
    enabledCommunityKeys,
    communitiesInArcs,
  ]);

  const outerArcsWidth = useMemo(() => {
    return (
      Math.min(
        (outerRadius * calculateBandwidth(visibleData.length)) / 2,
        15.5,
      ) - 0.5
    );
  }, [visibleData.length, outerRadius]);

  return {
    chartData,
    xScale,
    angleMap,
    yScale,
    getKeyIndex,
    outerArcsWidth,
  };
};
