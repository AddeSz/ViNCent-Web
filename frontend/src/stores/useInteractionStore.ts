import type { DataChanges } from "@/types";
import type { SortingState } from "@tanstack/react-table";
import { create } from "zustand";

export interface TooltipState {
  type: string;
  nodeId: string;
  x: number;
  y: number;
  visible: boolean;
  arcKey?: string;
  lastChange?: DataChanges;
  communityId?: number;
  nodeCount?: number;
}

const defaultTooltip: TooltipState = {
  type: "arc",
  nodeId: "",
  x: 0,
  y: 0,
  visible: false,
};

interface InteractionStore {
  selectedNodes: Set<string>;
  hoveredNode: string | null;
  barHoveredNodes: Set<string>;
  hoveredCommunity: { key: string; id: number } | null;

  sortKey: string;
  sortingState: SortingState;

  tooltip: TooltipState;

  resetRadialZoomFlag: boolean;
  resetNodeLinkZoomFlag: boolean;
  restartSimulationFlag: boolean;

  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  toggleNodesSelection: (ids: string[]) => void;
  clearSelection: () => void;

  setHoveredNode: (node: string | null) => void;
  setHoveredCommunity: (key: string | null, id: number | null) => void;
  setBarHoveredNodes: (nodes: Set<string>) => void;

  setSortKey: (key: string) => void;
  setSortingState: (sorting: SortingState) => void;

  showTooltip: (data: Partial<TooltipState>) => void;
  hideTooltip: () => void;
  updateTooltipPosition: (x: number, y: number) => void;

  resetRadialZoom: () => void;
  resetNodeLinkZoom: () => void;
  setRestartSimulationFlag: (flag: boolean) => void;

  clearData: () => void;
}

export const useInteractionStore = create<InteractionStore>((set, get) => ({
  selectedNodes: new Set(),
  hoveredNode: null,
  barHoveredNodes: new Set(),
  hoveredCommunity: null,

  sortKey: "none",
  sortingState: [],

  tooltip: defaultTooltip,

  resetRadialZoomFlag: false,
  resetNodeLinkZoomFlag: false,
  restartSimulationFlag: false,

  selectNode: (id, multi = false) => {
    const current = get().selectedNodes;
    const next = multi ? new Set(current) : new Set<string>();
    next.add(id);
    set({ selectedNodes: next });
  },

  deselectNode: (id) =>
    set((s) => {
      const next = new Set(s.selectedNodes);
      next.delete(id);
      return { selectedNodes: next };
    }),

  toggleNodeSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedNodes);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedNodes: next };
    }),

  toggleNodesSelection: (ids) => {
    const { selectedNodes } = get();
    const allSelected = ids.every((id) => selectedNodes.has(id));

    set((s) => {
      const next = new Set(s.selectedNodes);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return { selectedNodes: next };
    });
  },

  clearSelection: () => set({ selectedNodes: new Set() }),

  setHoveredNode: (node) => set({ hoveredNode: node }),

  setHoveredCommunity: (key, id) =>
    set({
      hoveredCommunity: key == null || id == null ? null : { key, id },
    }),

  setBarHoveredNodes: (nodes) => set({ barHoveredNodes: nodes }),

  setSortKey: (key) => set({ sortKey: key }),
  setSortingState: (sorting) => set({ sortingState: sorting }),

  showTooltip: (data) =>
    set((s) => ({ tooltip: { ...s.tooltip, ...data, visible: true } })),

  hideTooltip: () =>
    set((s) => ({ tooltip: { ...s.tooltip, visible: false } })),

  updateTooltipPosition: (x, y) =>
    set((s) => ({ tooltip: { ...s.tooltip, x, y } })),

  resetRadialZoom: () => set({ resetRadialZoomFlag: true }),
  resetNodeLinkZoom: () => set({ resetNodeLinkZoomFlag: true }),
  setRestartSimulationFlag: (flag) => set({ restartSimulationFlag: flag }),

  clearData: () =>
    set({
      selectedNodes: new Set(),
      hoveredNode: null,
      barHoveredNodes: new Set(),
      hoveredCommunity: null,
      sortKey: "none",
      sortingState: [],
      tooltip: defaultTooltip,
      resetRadialZoomFlag: false,
      resetNodeLinkZoomFlag: false,
      restartSimulationFlag: false,
    }),
}));
