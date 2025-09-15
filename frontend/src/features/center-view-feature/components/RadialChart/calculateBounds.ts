import type { CombinedNodeData } from "@/types/network";

export interface GroupBound {
  id: string;
  startAngle: number;
  endAngle: number;
  inner: number;
  outer: number;
}

const calculateBounds = (
  series: d3.Series<CombinedNodeData, string>[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
): GroupBound[] => {
  const firstLayer = series[0];
  const lastLayer = series[series.length - 1];

  const bounds = firstLayer.map((d, i) => {
    const id = d.data.id;
    const startAngle = x(id) ?? 0;
    const inner = y(d[0]);

    const dLast = lastLayer[i];
    const endAngle = (x(id) ?? 0) + x.bandwidth();
    const outer = y(dLast[1]);

    return { id, startAngle, endAngle, inner, outer };
  });

  return bounds;
};

export default calculateBounds;
