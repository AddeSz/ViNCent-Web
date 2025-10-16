import type { ForceEdgeBundlingOptions } from "@/utils/ForceEdgeBundling";
import { create } from "zustand";

export type DisplayMode = "attributes" | "centrality" | "both";
export type LinkRenderingMode = "bezier" | "hierarchy" | "fdeB";

type RadialSettings = {
  innerRadius: number;
  outerRadius: number;
  fontSize: number;
  separateMetrics: boolean;
  linkRenderingMode: LinkRenderingMode;
  fdebSettings: ForceEdgeBundlingOptions;
};

//idk what settings to use yet
type NodeLinkSettings = {
  linkDistance: number;
  chargeStrength: number;
};

type DisplaySettings = {
  keepPreviewNodes: boolean;
  keepStableView: boolean;
  displayMode: DisplayMode;
};

type ChartSettingsStore = {
  radialSettings: RadialSettings;
  nodeLinkSettings: NodeLinkSettings;
  displaySettings: DisplaySettings;

  setRadialSettings: (settings: Partial<RadialSettings>) => void;
  setNodeLinkSettings: (settings: Partial<NodeLinkSettings>) => void;
  setDisplaySettings: (settings: Partial<DisplaySettings>) => void;

  resetRadialSettings: () => void;
  resetNodeLinkSettings: () => void;
  resetDisplaySettings: () => void;

  setInitialRadialSettings: (settings: RadialSettings) => void;
  setInitialDisplaySettings: (settings: DisplaySettings) => void;
};

export const defaultFDEBSettings: ForceEdgeBundlingOptions = {
  stepSize: 0.1,
  compatibilityThreshold: 0.6,
};

export const defaultRadialSettings: RadialSettings = {
  innerRadius: 100,
  outerRadius: 600,
  fontSize: 24,
  separateMetrics: false,
  linkRenderingMode: "fdeB",
  fdebSettings: defaultFDEBSettings,
};

export const defaultNodeLinkSettings: NodeLinkSettings = {
  linkDistance: 50,
  chargeStrength: -200,
};

export const defaultDisplaySettings: DisplaySettings = {
  keepPreviewNodes: true,
  keepStableView: false,
  displayMode: "both",
};

export const useChartSettings = create<ChartSettingsStore>((set) => {
  let initialRadial = defaultRadialSettings;
  let initialNodeLink = defaultNodeLinkSettings;
  let initialDisplay = defaultDisplaySettings;

  return {
    radialSettings: defaultRadialSettings,
    nodeLinkSettings: defaultNodeLinkSettings,
    displaySettings: defaultDisplaySettings,

    setRadialSettings: (settings) =>
      set((s) => ({
        radialSettings: { ...s.radialSettings, ...settings },
      })),

    setNodeLinkSettings: (settings) =>
      set((s) => ({
        nodeLinkSettings: { ...s.nodeLinkSettings, ...settings },
      })),

    setDisplaySettings: (settings) =>
      set((s) => ({
        displaySettings: { ...s.displaySettings, ...settings },
      })),

    setInitialRadialSettings: (settings) => {
      initialRadial = settings;
      set({ radialSettings: settings });
    },

    setInitialDisplaySettings: (settings) => {
      initialDisplay = settings;
      set({ displaySettings: settings });
    },

    resetRadialSettings: () => set({ radialSettings: initialRadial }),
    resetNodeLinkSettings: () => set({ nodeLinkSettings: initialNodeLink }),
    resetDisplaySettings: () => set({ displaySettings: initialDisplay }),
  };
});
