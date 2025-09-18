import { create } from "zustand";

export type DisplayMode = "attributes" | "centrality" | "both";

type RadialSettings = {
  innerRadius: number;
  outerRadius: number;
  fontSize: number;
};

type NodeLinkSettings = {
  linkDistance: number;
  chargeStrength: number;
};

type ChartSettingsStore = {
  radialSettings: RadialSettings;
  nodeLinkSettings: NodeLinkSettings;
  displayMode: DisplayMode;

  setRadialSettings: (settings: Partial<RadialSettings>) => void;
  setNodeLinkSettings: (settings: Partial<NodeLinkSettings>) => void;
  setDisplayMode: (mode: DisplayMode) => void;

  resetRadialSettings: () => void;
  resetNodeLinkSettings: () => void;
  resetDisplayMode: () => void;

  setInitialRadialSettings: (settings: RadialSettings) => void;
  setInitialDisplayMode: (mode: DisplayMode) => void;
};

export const defaultRadialSettings: RadialSettings = {
  innerRadius: 100,
  outerRadius: 600,
  fontSize: 24,
};

export const defaultNodeLinkSettings: NodeLinkSettings = {
  linkDistance: 50,
  chargeStrength: -200,
};

export const defaultDisplayMode: DisplayMode = "both";

export const useChartSettings = create<ChartSettingsStore>((set) => {
  let initialRadial = defaultRadialSettings;
  let initialNodeLink = defaultNodeLinkSettings;
  let initialDisplay: DisplayMode = defaultDisplayMode;

  return {
    radialSettings: defaultRadialSettings,
    nodeLinkSettings: defaultNodeLinkSettings,
    displayMode: defaultDisplayMode,

    setRadialSettings: (settings) =>
      set((s) => ({
        radialSettings: { ...s.radialSettings, ...settings },
      })),

    setNodeLinkSettings: (settings) =>
      set((s) => ({
        nodeLinkSettings: { ...s.nodeLinkSettings, ...settings },
      })),

    setDisplayMode: (mode) => set({ displayMode: mode }),

    setInitialRadialSettings: (settings) => {
      initialRadial = settings;
      set({ radialSettings: settings });
    },

    setInitialDisplayMode: (mode) => {
      initialDisplay = mode;
      set({ displayMode: mode });
    },

    resetRadialSettings: () => set({ radialSettings: initialRadial }),
    resetNodeLinkSettings: () => set({ nodeLinkSettings: initialNodeLink }),
    resetDisplayMode: () => set({ displayMode: initialDisplay }),
  };
});
