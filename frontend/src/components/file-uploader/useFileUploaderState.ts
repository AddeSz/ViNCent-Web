import { useOptionsStore } from "@/stores/useOptionsStore";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface FileUploaderState {
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
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [dataSource, setDataSource] = useState<"dataset" | "file">("dataset");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const optionsData = useOptionsStore((s) => s.optionsData);
  const hasInitializedOptions = useRef(false);

  useEffect(() => {
    if (optionsData && !hasInitializedOptions.current) {
      hasInitializedOptions.current = true;
      setSelectedOptions(new Set(optionsData.allOptionNames));
    }
  }, [optionsData]);

  const clearDataSelection = () => {
    setDataSource("dataset");
    setSelectedDataset("");
    setSelectedFile(null);
  };

  return {
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
