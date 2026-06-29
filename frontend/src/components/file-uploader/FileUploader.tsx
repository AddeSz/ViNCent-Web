import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoadNetwork } from "@/hooks/useLoadNetwork";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { TaskStatus } from "@/utils/api";
import api from "@/utils/api";
import { useRef, useState } from "react";
import DataSourceInput from "./DataSourceInput";
import OptionsSelector from "./OptionsSelector";
import type { FileUploaderState } from "./useFileUploaderState";

const SUPPORTED_EXTENSIONS = [
  "json",
  "graphml",
  "xml",
  "mtx",
  "txt",
  "csv",
  "tsv",
];

export interface OptionsDataBackend {
  all: string[];
  categories: Record<string, string[]>;
  requirements: Record<string, string>;
  performance: Record<string, string>;
  descriptions: Record<string, string>;
}

interface FileUploaderProps {
  onLoadingStart: () => void;
  onLoadingComplete: () => void;
  onLoadingError: (error: string) => void;
  onProgress?: (status: TaskStatus) => void;
  fileUploaderState: FileUploaderState;
}

const FileUploader = ({
  onLoadingStart,
  onLoadingComplete,
  onLoadingError,
  onProgress,
  fileUploaderState,
}: FileUploaderProps) => {
  const {
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
  } = fileUploaderState;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const setCurrentDataset = useNetworkStore((s) => s.setCurrentDataset);
  const { loadNetwork, clearAllData } = useLoadNetwork();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const handleLoadDataClick = async () => {
    setIsDialogOpen(true);

    if (!optionsData) {
      setIsLoadingOptions(true);
      setOptionsError(null);
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
        setOptionsError(
          error instanceof Error ? error.message : "Server Error",
        );
      } finally {
        setIsLoadingOptions(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
      setFileError(`Unsupported file type: .${ext}`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setFileError(null);
  };

  const handleConfirmLoad = async () => {
    if (dataSource === "dataset" && !selectedDataset) return;
    if (dataSource === "file" && !selectedFile) return;

    handleCloseDialog();

    onLoadingStart?.();
    clearAllData();

    const optionsArray =
      selectedOptions.size > 0 ? Array.from(selectedOptions) : [];

    const centralitiesArray: string[] = [];
    const communitiesArray: string[] = [];

    if (optionsData) {
      optionsArray.forEach((option) => {
        if (optionsData.categories.community_detection?.includes(option)) {
          communitiesArray.push(option);
        } else {
          centralitiesArray.push(option);
        }
      });
    }

    try {
      let networkData;

      if (dataSource === "dataset") {
        networkData = await api.getDataset(
          selectedDataset,
          centralitiesArray,
          communitiesArray,
        );
        setCurrentDataset(selectedDataset);
      } else {
        const formData = new FormData();
        formData.append("file", selectedFile!);
        formData.append("centralities", JSON.stringify(centralitiesArray));
        formData.append("communities", JSON.stringify(communitiesArray));

        networkData = await api.processNetworkAsync(formData, (status) => {
          onProgress?.(status);
        });
        setCurrentDataset(selectedFile!.name);
      }

      await loadNetwork(networkData);

      onLoadingComplete?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load data";
      onLoadingError?.(errorMessage);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFileError(null);
    setOptionsError(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canConfirm =
    ((dataSource === "dataset" && selectedDataset) ||
      (dataSource === "file" && selectedFile)) &&
    !optionsError &&
    optionsData !== null;

  return (
    <>
      <Button
        variant="outline"
        title="Load Data"
        onClick={handleLoadDataClick}
        className="flex w-full cursor-pointer items-center px-2"
      >
        <p className="w-fit truncate">Load Data</p>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="scrollbar-thin max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Data</DialogTitle>
            <DialogDescription>
              Choose a dataset or import your own file, then select which
              metrics to calculate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <DataSourceInput
              dataSource={dataSource}
              setDataSource={setDataSource}
              datasets={availableDatasets}
              selectedDataset={selectedDataset}
              setSelectedDataset={setSelectedDataset}
              fileInputRef={fileInputRef}
              selectedFile={selectedFile}
              fileError={fileError}
              onFileSelect={handleFileSelect}
              onClearFile={handleClearFile}
            />

            <OptionsSelector
              optionsData={optionsData}
              isLoading={isLoadingOptions}
              error={optionsError}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              expandedCategories={expandedCategories}
              setExpandedCategories={setExpandedCategories}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmLoad}
              disabled={!canConfirm}
            >
              Load
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FileUploader;
