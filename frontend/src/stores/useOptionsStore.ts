import api, { type OptionMeta, type OptionsResponse } from "@/api";
import { create } from "zustand";

interface OptionsStore {
  optionsData: OptionsData | null;
  optionDescriptions: Record<string, string>;
  availableDatasets: string[];
  isLoading: boolean;
  error: string | null;

  fetchOptions: () => Promise<void>;
}

export interface OptionsData {
  categories: Record<string, OptionMeta[]>;
  allOptionNames: string[];
  communityKeys: Set<string>;
}

function getDescriptions(data: OptionsData): Record<string, string> {
  const descriptions: Record<string, string> = {};
  for (const options of Object.values(data.categories)) {
    for (const option of options) {
      if (option.description) descriptions[option.name] = option.description;
    }
  }
  return descriptions;
}

function mergeOptionsData(options: OptionsResponse): OptionsData {
  const combined = [...options.centralities, ...options.communities];

  const categories: Record<string, OptionMeta[]> = {};
  for (const option of combined) {
    (categories[option.category] ??= []).push(option);
  }

  const allOptionNames = combined.map((option) => option.name);

  return {
    categories,
    allOptionNames,
    communityKeys: new Set(options.communities.map((option) => option.name)),
  };
}

export const useOptionsStore = create<OptionsStore>((set, get) => ({
  optionsData: null,
  optionDescriptions: {},
  availableDatasets: [],
  isLoading: false,
  error: null,

  fetchOptions: async () => {
    if (get().optionsData || get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const options = await api.fetchOptions();
      const mergedData = mergeOptionsData(options);
      const descriptions = getDescriptions(mergedData);
      set({
        optionsData: mergedData,
        optionDescriptions: descriptions,
        availableDatasets: options.datasets || [],
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Server Error",
        isLoading: false,
      });
    }
  },
}));
