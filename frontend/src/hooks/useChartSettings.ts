import { create } from "zustand";

export type RadialDisplayMode = "attributes" | "centrality" | "both";

type RadialSettings = {
  innerRadius: number;
  outerRadius: number;
  fontSize: number;
  displayMode: RadialDisplayMode;
};

type NodeLinkSettings = {
  linkDistance: number;
  chargeStrength: number;
};

type ChartSettingsStore = {
  radialSettings: RadialSettings;
  nodeLinkSettings: NodeLinkSettings;
  setRadialSettings: (settings: Partial<RadialSettings>) => void;
  setNodeLinkSettings: (settings: Partial<NodeLinkSettings>) => void;
};

export const useChartSettings = create<ChartSettingsStore>((set) => ({
  radialSettings: {
    innerRadius: 100,
    outerRadius: 600,
    fontSize: 24,
    displayMode: "both",
  },
  nodeLinkSettings: {
    linkDistance: 50,
    chargeStrength: -200,
  },
  setRadialSettings: (settings) =>
    set((state) => ({
      radialSettings: { ...state.radialSettings, ...settings },
    })),
  setNodeLinkSettings: (settings) =>
    set((state) => ({
      nodeLinkSettings: { ...state.nodeLinkSettings, ...settings },
    })),
}));
