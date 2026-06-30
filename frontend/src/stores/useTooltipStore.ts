import type { DataChanges } from "@/types";
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

interface TooltipStore {
  tooltip: TooltipState;
  showTooltip: (data: Partial<TooltipState>) => void;
  hideTooltip: () => void;
  updatePosition: (x: number, y: number) => void;
}

//  just easier to manage a seperate store for it ...
export const useTooltipStore = create<TooltipStore>((set) => ({
  tooltip: {
    type: "arc",
    nodeId: "",
    x: 0,
    y: 0,
    visible: false,
  },

  showTooltip: (data) =>
    set((state) => ({
      tooltip: { ...state.tooltip, ...data, visible: true },
    })),

  hideTooltip: () =>
    set((state) => ({
      tooltip: { ...state.tooltip, visible: false },
    })),

  updatePosition: (x, y) =>
    set((state) => ({
      tooltip: { ...state.tooltip, x, y },
    })),
}));
