import { useSettingsStore } from "@/stores/useSettingsStore";
import type { FullData } from "@/types/network";
import * as d3 from "d3";
import { useMemo } from "react";
import { createAngleMap } from "./calculateLinks";

interface UseRadialChartDataProps {
  data: FullData[];
  allKeys: string[];
  enabledCentralityKeys: string[];
  enabledAttributeKeys: string[];
}

export const useRadialChartData = ({
  data,
  allKeys,
  enabledCentralityKeys,
  enabledAttributeKeys,
}: UseRadialChartDataProps) => {
  const radialSettings = useSettingsStore((s) => s.radialSettings);
  const displayMode = useSettingsStore((s) => s.displaySettings.displayMode);

  const {
    innerRadius,
    outerRadius,
    fontSize,
    truncateLabels,
    labelWidth,
    maxLabelWidth,
    separateMetrics,
  } = radialSettings;

  const visibleData = useMemo(() => data.filter((d) => !d.hidden), [data]);

  const chartData = useMemo(() => {
    if (allKeys.length === 0) return null;
    if (data.length === 0) return { series: [], arcData: [] };

    if (visibleData.length === 0) {
      return { series: [], arcData: [] };
    }

    const series = d3
      .stack<FullData>()
      .keys(allKeys)
      .value(() => 1)(visibleData);

    return { series };
  }, [visibleData, allKeys]);

  const xScale = useMemo(() => {
    return createAngularScale(visibleData, visibleData.length);
  }, [visibleData]);

  const angleMap = useMemo(() => {
    if (!xScale) return new Map<string, number>();
    return createAngleMap(xScale);
  }, [xScale]);

  const { yScale, getKeyIndex } = useMemo(() => {
    return createRadialScale({
      innerRadius,
      outerRadius,
      separateMetrics,
      displayMode,
      enabledCentralityKeys,
      enabledAttributeKeys,
    });
  }, [
    innerRadius,
    outerRadius,
    separateMetrics,
    displayMode,
    enabledCentralityKeys,
    enabledAttributeKeys,
  ]);

  const totalLabelWidth = truncateLabels ? maxLabelWidth : labelWidth;

  const radiusScale = d3
    .scalePow()
    .exponent(0.05)
    .domain([100, 1200])
    .range([10, 2])
    .clamp(true);

  const radius = Math.max(radiusScale(visibleData.length), 1);

  return {
    chartData,
    xScale,
    angleMap,
    yScale,
    getKeyIndex,
    totalLabelWidth,
    radius,
    innerRadius,
    outerRadius,
    fontSize,
    truncateLabels,
  };
};

function createAngularScale(
  visibleData: FullData[],
  totalDataLength: number,
): d3.ScaleBand<string> {
  const n = visibleData.length;

  if (n === 0) return d3.scaleBand<string>();

  if (n === 1) {
    const scale = (id: string) => {
      const index = visibleData.findIndex((d) => d.id === id);
      return index === -1 ? undefined : 0;
    };
    scale.bandwidth = () => 2 * Math.PI;
    scale.domain = () => visibleData.map((d) => d.id);
    return scale as d3.ScaleBand<string>;
  }

  const gapProportion = calculateGapProportion(totalDataLength);
  const arcProportion = 1 - gapProportion;

  const arcSize = (2 * Math.PI * arcProportion) / n;
  const gapSize = (2 * Math.PI * gapProportion) / n;

  const scale = (id: string) => {
    const index = visibleData.findIndex((d) => d.id === id);
    if (index === -1) return undefined;
    return gapSize / 2 + index * (arcSize + gapSize);
  };

  scale.bandwidth = () => arcSize;
  scale.domain = () => visibleData.map((d) => d.id);

  return scale as d3.ScaleBand<string>;
}

function calculateGapProportion(dataLength: number): number {
  if (dataLength <= 100) return 0.5;
  if (dataLength >= 1000) return 0;

  if (dataLength <= 500) {
    const t = (dataLength - 100) / (500 - 100);
    return 0.5 - t * 0.1;
  }

  const t = (dataLength - 500) / (1000 - 500);
  return 0.4 - t * 0.4;
}

function createRadialScale({
  innerRadius,
  outerRadius,
  separateMetrics,
  displayMode,
  enabledCentralityKeys,
  enabledAttributeKeys,
}: {
  innerRadius: number;
  outerRadius: number;
  separateMetrics: boolean;
  displayMode: string;
  enabledCentralityKeys: string[];
  enabledAttributeKeys: string[];
}) {
  const centralityCount = enabledCentralityKeys.length;
  const attributeCount = enabledAttributeKeys.length;

  const gap = separateMetrics ? 1 : 0;

  let totalRings = centralityCount + gap + attributeCount;

  if (displayMode === "attributes" || centralityCount === 0) {
    totalRings = attributeCount;
  }
  if (displayMode === "centrality" || attributeCount === 0) {
    totalRings = centralityCount;
  }

  const yScale = d3
    .scaleLinear<number, number>()
    .domain([0, totalRings])
    .range([innerRadius, outerRadius]);

  const getKeyIndex = (key: string): number => {
    const cIndex = enabledCentralityKeys.indexOf(key);
    if (cIndex !== -1) return cIndex;

    const aIndex = enabledAttributeKeys.indexOf(key);
    if (aIndex !== -1) {
      if (displayMode === "attributes" || centralityCount === 0) {
        return aIndex;
      }
      return centralityCount + gap + aIndex;
    }

    return 0;
  };

  return { yScale, getKeyIndex };
}
