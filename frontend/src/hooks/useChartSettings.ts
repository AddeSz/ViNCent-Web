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
  resetRadialSettings: () => void;
  resetNodeLinkSettings: () => void;
  setInitialRadialSettings: (settings: RadialSettings) => void;
};

export const defaultRadialSettings: RadialSettings = {
  innerRadius: 100,
  outerRadius: 600,
  fontSize: 24,
  displayMode: "both",
};

export const defaultNodeLinkSettings: NodeLinkSettings = {
  linkDistance: 50,
  chargeStrength: -200,
};

export const useChartSettings = create<ChartSettingsStore>((set) => {
  let initialRadial = defaultRadialSettings;
  let initialNodeLink = defaultNodeLinkSettings;

  return {
    radialSettings: defaultRadialSettings,
    nodeLinkSettings: defaultNodeLinkSettings,
    setRadialSettings: (settings) =>
      set((state) => ({
        radialSettings: { ...state.radialSettings, ...settings },
      })),
    setNodeLinkSettings: (settings) =>
      set((state) => ({
        nodeLinkSettings: { ...state.nodeLinkSettings, ...settings },
      })),
    setInitialRadialSettings: (settings) => {
      initialRadial = settings;
      set({ radialSettings: settings });
    },
    resetRadialSettings: () =>
      set({
        radialSettings: initialRadial,
      }),
    resetNodeLinkSettings: () =>
      set({
        nodeLinkSettings: initialNodeLink,
      }),
  };
});
