import api from "@/utils/api";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { OptionsDataBackend } from "./FileUploader";

export interface FileUploaderState {
  optionsData: OptionsDataBackend | null;
  setOptionsData: (value: OptionsDataBackend | null) => void;
  availableDatasets: string[];
  setAvailableDatasets: (value: string[]) => void;
  selectedOptions: Set<string>;
  setSelectedOptions: Dispatch<SetStateAction<Set<string>>>;
  expandedCategories: Set<string>;
  setExpandedCategories: Dispatch<SetStateAction<Set<string>>>;
  dataSource: "dataset" | "file";
  setDataSource: (value: "dataset" | "file") => void;
  selectedDataset: string;
  setSelectedDataset: (value: string) => void;
  selectedFile: File | null;
  setSelectedFile: (value: File | null) => void;
  clearDataSelection: () => void;
}

export const useFileUploaderState = (): FileUploaderState => {
  const [optionsData, setOptionsData] = useState<OptionsDataBackend | null>(
    null,
  );
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [dataSource, setDataSource] = useState<"dataset" | "file">("dataset");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const prefetchOptions = async () => {
      try {
        const options = await api.fetchOptions();

        setAvailableDatasets(options.datasets || []);

        const combinedData: OptionsDataBackend = {
          all: [...options.centralities.all, ...options.communities.all],
          categories: {
            ...options.centralities.categories,
            community_detection: options.communities.all,
          },
          requirements: {
            ...options.centralities.requirements,
            ...options.communities.requirements,
          },
          performance: {
            ...options.centralities.performance,
            ...options.communities.performance,
          },
          descriptions: {
            ...options.centralities.descriptions,
            ...options.communities.descriptions,
          },
        };

        setOptionsData(combinedData);
        setSelectedOptions(new Set(combinedData.all));
      } catch (error) {
        console.error("Failed to prefetch options:", error);
      }
    };

    prefetchOptions();
  }, []);

  const clearDataSelection = () => {
    setDataSource("dataset");
    setSelectedDataset("");
    setSelectedFile(null);
  };

  return {
    optionsData,
    setOptionsData,
    availableDatasets,
    setAvailableDatasets,
    selectedOptions,
    setSelectedOptions,
    expandedCategories,
    setExpandedCategories,
    dataSource,
    setDataSource,
    selectedDataset,
    setSelectedDataset,
    selectedFile,
    setSelectedFile,
    clearDataSelection,
  };
};
