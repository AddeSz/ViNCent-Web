import * as d3 from "d3";

export interface BinInfo {
  binIndex: number;
  x0: number;
  x1: number;
  values: number[];
}

export interface BinnedData {
  bins: BinInfo[];
  valueToBinIndex: Map<number, number>;
  min: number;
  max: number;
  thresholds: number[];
  binCount: number;
}

export function createBinnedData(
  values: number[],
  binCount: number,
): BinnedData {
  if (values.length === 0) {
    throw new Error("Cannot create histogram from empty data");
  }

  const [rawMin, rawMax] = d3.extent(values) as [number, number];
  const tempScale = d3.scaleLinear().domain([rawMin, rawMax]).nice(binCount);
  const [min, max] = tempScale.domain();
  const binWidth = (max - min) / binCount;
  const thresholds = Array.from(
    { length: binCount },
    (_, i) => min + binWidth * i,
  );
  thresholds.push(max);

  const histogram = d3
    .bin<number, number>()
    .domain([min, max])
    .thresholds(thresholds);

  const d3Bins = histogram(values);

  const bins: BinInfo[] = [];
  const valueToBinIndex = new Map<number, number>();

  d3Bins.forEach((d3Bin, binIndex) => {
    const binInfo: BinInfo = {
      binIndex,
      x0: d3Bin.x0 ?? min,
      x1: d3Bin.x1 ?? max,
      values: [...d3Bin],
    };
    bins.push(binInfo);
  });

  if (bins.length >= 2) {
    const lastBin = bins[bins.length - 1];
    const secondToLastBin = bins[bins.length - 2];

    secondToLastBin.values.push(...lastBin.values);
    secondToLastBin.x1 = lastBin.x1;

    bins.pop();
  }

  bins.forEach((bin) => {
    bin.values.forEach((value) => {
      valueToBinIndex.set(value, bin.binIndex);
    });
  });

  return {
    bins,
    valueToBinIndex,
    min,
    max,
    thresholds,
    binCount: bins.length,
  };
}

export function isLastBinSelected(
  range: [number, number] | null,
  data?: BinnedData,
): boolean {
  if (!range || !data || data.bins.length === 0) return false;
  const lastBinEnd = data.bins[data.bins.length - 1].x1;
  return range[1] >= lastBinEnd;
}
