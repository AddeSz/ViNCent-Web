import type { ForceEdgeBundlingOptions } from "@/utils/ForceEdgeBundling";
import { calculateRadialSettings } from "@/utils/utils";
import { create } from "zustand";

export type EdgeRenderingMode = "bezier" | "hierarchy" | "fdeB";
export type SizeMode = "fixed" | "metric";
export type ScaleType = "linear" | "log";

type RadialSettings = {
  innerRadius: number;
  outerRadius: number;
  fontSize: number;
  showLabels: boolean;
  separateMetrics: boolean;
  edgeRenderingMode: EdgeRenderingMode;
  fdebSettings: ForceEdgeBundlingOptions;
  communitiesInArcs: boolean;
};

export type NodeLinkSettings = {
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
  linkScaleType: ScaleType;
};

type DisplaySettings = {
  previewChanges: boolean;
  showForeshadowing: boolean;
  stickyHover: boolean;
  keepRemoved: boolean;
  displayLabel: "label" | string;
  selectedCommunity: "none" | string;
  truncateLabels: boolean;
  maxLabelWidth: number;
};

type SettingsStore = {
  radialSettings: RadialSettings;
  nodeLinkSettings: NodeLinkSettings;
  displaySettings: DisplaySettings;

  setRadialSettings: (settings: Partial<RadialSettings>) => void;
  setNodeLinkSettings: (settings: Partial<NodeLinkSettings>) => void;
  setDisplaySettings: (settings: Partial<DisplaySettings>) => void;

  setInitialNetworkSettings: (nodeCount: number, metricCount: number) => void;

  resetRadialSettings: () => void;
  resetNodeLinkSettings: () => void;
  resetDisplaySettings: () => void;
  resetFDEBSettings: () => void;
};

export const defaultFDEBSettings: ForceEdgeBundlingOptions = {
  stepSize: 0.1,
  compatibilityThreshold: 0.6,
  iterationsRate: 0.6666667,
  bundlingStiffness: 0.1,
  cycles: 6,
  iterations: 90,
};

export const defaultRadialSettings: RadialSettings = {
  innerRadius: 100,
  outerRadius: 600,
  fontSize: 24,
  showLabels: true,
  separateMetrics: false,
  edgeRenderingMode: "fdeB",
  fdebSettings: defaultFDEBSettings,
  communitiesInArcs: false,
};

export const defaultNodeLinkSettings: NodeLinkSettings = {
  linkDistance: 100,
  chargeStrength: -300,
  showLabels: false,
  fontSize: 16,
  nodeSizeMode: "fixed",
  nodeSizeMetric: "",
  fixedNodeSize: 8,
  minNodeSize: 5,
  maxNodeSize: 20,
  linkThicknessMode: "fixed",
  linkThicknessMetric: "",
  fixedLinkThickness: 2,
  minLinkThickness: 1,
  maxLinkThickness: 5,
  collisionEnabled: true,
  linkScaleType: "linear",
};

export const defaultDisplaySettings: DisplaySettings = {
  previewChanges: true,
  showForeshadowing: true,
  stickyHover: true,
  keepRemoved: true,
  displayLabel: "label",
  selectedCommunity: "none",
  truncateLabels: false,
  maxLabelWidth: 200,
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

    setInitialNetworkSettings: (nodeCount, metricCount) => {
      const calculatedRadial = calculateRadialSettings(nodeCount, metricCount);
      initialRadial = { ...initialRadial, ...calculatedRadial };

      set((s) => ({
        radialSettings: { ...s.radialSettings, ...calculatedRadial },
      }));
    },

    resetRadialSettings: () => set({ radialSettings: initialRadial }),
    resetNodeLinkSettings: () => set({ nodeLinkSettings: initialNodeLink }),
    resetDisplaySettings: () => set({ displaySettings: initialDisplay }),
    resetFDEBSettings: () =>
      set((s) => ({
        radialSettings: {
          ...s.radialSettings,
          fdebSettings: defaultFDEBSettings,
        },
      })),
  };
});
