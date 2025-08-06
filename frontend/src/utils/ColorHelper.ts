import * as d3 from "d3";
import { useDataStore } from "@/hooks/useDataStore";
import type { Series } from "d3";
import type { Centrality } from "@/types/network";

let colorScale: d3.ScaleSequential<string> | null = null;
let keyIndexMap: Map<string, number> = new Map();

export const handleHighlight = (id: string, multi: boolean) => {
  if (multi) {
    useDataStore.getState().toggleNodeSelection(id);
  } else {
    useDataStore.getState().selectNode(id, false);
  }
};

export const highlightBoundsColor = {
  default: "black",
  selected: "orange",
};

export const highlightLinksColor = {
  default: "black",
  selected: "orange",
};


export function initializeColorScale(series: Series<Centrality, string>[]) {
  keyIndexMap = new Map(series.map((d, i) => [d.key, i]));
  colorScale = d3
    .scaleSequential<string>()
    .domain([0, series.length - 1])
    .interpolator(d3.interpolateSpectral);
}

export function getColorForKey(key: string): string {
  if (!colorScale || !keyIndexMap.has(key)) return "gray";
  return colorScale(keyIndexMap.get(key)!);
}
