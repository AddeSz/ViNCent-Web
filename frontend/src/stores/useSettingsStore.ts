import type { ForceEdgeBundlingOptions } from "@/utils/ForceEdgeBundling";
import { create } from "zustand";

export type DisplayMode = "attributes" | "centrality" | "both";
export type LinkRenderingMode = "bezier" | "hierarchy" | "fdeB";
export type SizeMode = "fixed" | "metric";
export type ScaleType = "linear" | "log";

type RadialSettings = {
  innerRadius: number;
  outerRadius: number;
  fontSize: number;
  showLabels: boolean;
  truncateLabels: boolean;
  labelWidth: number;
  maxLabelWidth: number;
  separateMetrics: boolean;
  linkRenderingMode: LinkRenderingMode;
  fdebSettings: ForceEdgeBundlingOptions;
};

type NodeLinkSettings = {
  linkDistance: number;
  chargeStrength: number;
  showLabels: boolean;
  fontSize: number;
  nodeSizeMode: SizeMode;
  nodeSizeMetric: string;
  fixedNodeSize: number;
  minNodeSize: number;
  maxNodeSize: number;
  linkThicknessMode: SizeMode;
  linkThicknessMetric: string;
  fixedLinkThickness: number;
  minLinkThickness: number;
  maxLinkThickness: number;
  collisionEnabled: boolean;
  nodeScaleType: ScaleType;
  linkScaleType: ScaleType;
};

type DisplaySettings = {
  keepPreviewNodes: boolean;
  keepStableView: boolean;
  displayMode: DisplayMode;
  stickyHover: boolean;
};

type SettingsStore = {
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
  truncateLabels: false,
  showLabels: true,
  labelWidth: 200,
  maxLabelWidth: 200,
  separateMetrics: false,
  linkRenderingMode: "fdeB",
  fdebSettings: defaultFDEBSettings,
};

export const defaultNodeLinkSettings: NodeLinkSettings = {
  linkDistance: 100,
  chargeStrength: -300,
  showLabels: false,
  fontSize: 24,
  nodeSizeMode: "fixed",
  nodeSizeMetric: "",
  fixedNodeSize: 15,
  minNodeSize: 5,
  maxNodeSize: 20,
  linkThicknessMode: "fixed",
  linkThicknessMetric: "",
  fixedLinkThickness: 2,
  minLinkThickness: 1,
  maxLinkThickness: 5,
  collisionEnabled: true,
  nodeScaleType: "linear",
  linkScaleType: "linear",
};

export const defaultDisplaySettings: DisplaySettings = {
  keepPreviewNodes: true,
  keepStableView: true,
  displayMode: "both",
  stickyHover: true,
};

export const useSettingsStore = create<SettingsStore>((set) => {
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
