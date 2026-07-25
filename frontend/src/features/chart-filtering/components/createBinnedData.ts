import * as d3 from "d3";

interface BinEntry {
  id: string;
  value: number;
}

interface BinInfo {
  binIndex: number;
  x0: number;
  x1: number;
  values: number[];
  ids: string[];
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
  entries: BinEntry[],
  binCount: number,
): BinnedData {
  if (entries.length === 0) {
    throw new Error("Cannot create histogram from empty data");
  }

  const values = entries.map((e) => e.value);
  const [rawMin, rawMax] = d3.extent(values) as [number, number];

  const EPSILON = 1e-9;
  if (Math.abs(rawMax - rawMin) < EPSILON) {
    const padding = Math.abs(rawMin) > 0 ? Math.abs(rawMin) * 0.1 : 1;
    const min = rawMin - padding;
    const max = rawMax + padding;

    const bins: BinInfo[] = [
      {
        binIndex: 0,
        x0: min,
        x1: max,
        values: [...values],
        ids: entries.map((e) => e.id),
      },
    ];

    const valueToBinIndex = new Map<number, number>();
    values.forEach((v) => valueToBinIndex.set(v, 0));

    return {
      bins,
      valueToBinIndex,
      min,
      max,
      thresholds: [min, max],
      binCount: 1,
    };
  }

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
      ids: [],
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

  // Second pass: assign each entrys id to its resolved bin. Kept separate
  // from the values grouping pass above since d3.bin() only returns numbers,
  // not the id each number came from.
  entries.forEach(({ id, value }) => {
    const binIndex = valueToBinIndex.get(value);
    if (binIndex !== undefined) {
      bins[binIndex].ids.push(id);
    }
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
