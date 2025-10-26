import { create } from "zustand";
import { useMetricsStore } from "./useMetricsStore";

interface TimelineStore {
  timesteps: number[];
  timestep: {
    min: number;
    max: number;
    current: number;
  };

  setTimesteps: (timesteps: number[]) => void;
  setCurrent: (timestep: number) => void;
  clearData: () => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  timesteps: [],
  timestep: {
    min: 0,
    max: 0,
    current: 0,
  },

  setTimesteps: (timesteps) => {
    if (timesteps.length === 0) {
      set({
        timesteps: [],
        timestep: { min: 0, max: 0, current: 0 },
      });
      return;
    }

    const min = Math.min(...timesteps);
    const max = Math.max(...timesteps);

    set({
      timesteps,
      timestep: {
        min,
        max,
        current: min,
      },
    });
  },

  setCurrent: (current) => {
    set((state) => ({
      timestep: {
        ...state.timestep,
        current,
      },
    }));

    const metricsStore = useMetricsStore.getState();
    metricsStore.setCurrentTimestep(current);
  },

  clearData: () => {
    set({
      timesteps: [],
      timestep: {
        min: 0,
        max: 0,
        current: 0,
      },
    });
  },
}));
