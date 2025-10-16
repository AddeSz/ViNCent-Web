import type { FullData, Network, Node } from "@/types/network";
import type { SortingState } from "@tanstack/react-table";
import type { ZoomTransform } from "d3";
import * as d3 from "d3";
import { create } from "zustand";

interface NetworkStore {
  network: Network;
  nodeMap: Map<string, Node>;
  selectedNodes: Set<string>;
  hoveredNode: null | FullData;
  sortKey: string;
  sortingState: SortingState;
  radialZoom: ZoomTransform | null;
  nodeLinkZoom: ZoomTransform | null;
  resetRadialZoomFlag: Boolean;
  resetNodeLinkZoomFlag: Boolean;
  hiddenNodes: Set<string>;

  setNetwork: (data: Network) => void;
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  setHoveredNode: (node: FullData) => void;
  setSortKey: (key: string) => void;
  setSortingState: (sorting: SortingState) => void;

  setRadialZoom: (transform: ZoomTransform) => void;
  setNodeLinkZoom: (transform: ZoomTransform) => void;
  resetRadialZoom: () => void;
  resetNodeLinkZoom: () => void;

  hideNode: (id: string) => void;
  restoreNode: (id: string) => void;
  restoreAllNodes: () => void;

  clearSelection: () => void;
  clearData: () => void;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  network: { nodes: [], links: [] },
  nodeMap: new Map<string, Node>(),
  linkCountMap: new Map<string, number>(),
  selectedNodes: new Set<string>(),
  hoveredNode: null,
  sortKey: "none",
  sortingState: [],
  radialZoom: null,
  nodeLinkZoom: null,
  resetRadialZoomFlag: false,
  resetNodeLinkZoomFlag: false,
  hiddenNodes: new Set<string>(),

  setNetwork: (data) => {
    const nodeMap = new Map<string, Node>(data.nodes.map((n) => [n.id, n]));
    set({
      network: data,
      nodeMap,
    });
  },

  selectNode: (id, multi = false) => {
    const current = get().selectedNodes;
    const next = multi ? new Set<string>(current) : new Set<string>();
    next.add(id);
    set({ selectedNodes: next });
  },

  deselectNode: (id) => {
    const current = get().selectedNodes;
    const next = new Set<string>(current);
    next.delete(id);
    set({ selectedNodes: next });
  },

  toggleNodeSelection: (id) => {
    const current = get().selectedNodes;
    const next = new Set<string>(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedNodes: next });
  },

  setHoveredNode: (node) => set({ hoveredNode: node }),
  setSortKey: (key: string) => set({ sortKey: key }),
  setSortingState: (sorting: SortingState) => set({ sortingState: sorting }),

  setRadialZoom: (transform) => set({ radialZoom: transform }),
  setNodeLinkZoom: (transform) => set({ nodeLinkZoom: transform }),
  resetRadialZoom: () => set({ resetRadialZoomFlag: true }),
  resetNodeLinkZoom: () => set({ resetNodeLinkZoomFlag: true }),

  hideNode: (id) =>
    set((state) => {
      const next = new Set(state.hiddenNodes);
      next.add(id);
      return { hiddenNodes: next };
    }),

  restoreNode: (id) =>
    set((state) => {
      const next = new Set(state.hiddenNodes);
      next.delete(id);
      return { hiddenNodes: next };
    }),

  restoreAllNodes: () => set({ hiddenNodes: new Set() }),

  clearSelection: () => set({ selectedNodes: new Set<string>() }),
  clearData: () =>
    set({
      network: { nodes: [], links: [] },
      nodeMap: new Map(),
      selectedNodes: new Set<string>(),
      hoveredNode: null,
      sortKey: "none",
      sortingState: [],
      radialZoom: d3.zoomIdentity,
      nodeLinkZoom: d3.zoomIdentity,
    }),
}));
