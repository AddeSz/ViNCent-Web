import type { CombinedData } from "@/types/network";

interface GroupBounds {
  id: string;
  startAngle: number;
  endAngle: number;
}

interface LayerBounds {
  key: string;
  inner: number;
  outer: number;
}

export interface BoundsResult {
  groupBounds: GroupBounds[];
  layerBounds: LayerBounds[];
}

const calculateBounds = (
  series: d3.Series<CombinedData, string>[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
): BoundsResult => {
  const groupBounds = series[0].map((d) => {
    const id = d.data.id;
    const startAngle = x(id) ?? 0;
    const endAngle = (x(id) ?? 0) + x.bandwidth();
    return { id, startAngle, endAngle };
  });

  const layerBounds = series.map((layer) => {
    const key = layer.key;
    const inner = y(layer[0][0]);
    const outer = y(layer[0][1]);
    return { key, inner, outer };
  });

  return { groupBounds, layerBounds };
};

export default calculateBounds;
