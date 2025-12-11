import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNetworkStore } from "@/stores/useNetworkStore";
import api from "@/utils/api";
import { useRef, useState } from "react";
import CentralitySelector from "./CentralitySelector";
import DataSourceInput from "./DataSourceInput";

const SUPPORTED_EXTENSIONS = [
  "json",
  "graphml",
  "xml",
  "mtx",
  "txt",
  "csv",
  "tsv",
];

interface FileUploaderProps {
  datasets: Record<string, any>;
  onLoadData: (formData: FormData) => Promise<void>;
}

export interface CentralityDataBackend {
  all: string[];
  categories: Record<string, string[]>;
  requirements: Record<string, string>;
  performance: Record<string, string>;
}

const FileUploader = ({ datasets, onLoadData }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setCurrentDataset = useNetworkStore((s) => s.setCurrentDataset);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dataSource, setDataSource] = useState<"dataset" | "file">("dataset");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [centralityData, setCentralityData] =
    useState<CentralityDataBackend | null>(null);
  const [isLoadingCentralities, setIsLoadingCentralities] = useState(false);
  const [centralityError, setCentralityError] = useState<string | null>(null);
  const [selectedCentralities, setSelectedCentralities] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const handleLoadDataClick = async () => {
    setIsDialogOpen(true);
    setIsLoadingCentralities(true);
    setCentralityError(null);
    try {
      const data = await api.fetchCentralities();
      setCentralityData(data);
      setSelectedCentralities(new Set(data.all));
    } catch (error) {
      setCentralityError(
        error instanceof Error ? error.message : "Server Error",
      );
    } finally {
      setIsLoadingCentralities(false);
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

    const formData = new FormData();
    const centralitiesArray =
      selectedCentralities.size > 0 ? Array.from(selectedCentralities) : [];

    if (dataSource === "dataset") {
      const datasetContent = datasets[selectedDataset];
      const jsonString = JSON.stringify(datasetContent);
      const blob = new Blob([jsonString], { type: "application/json" });
      const file = new File([blob], `${selectedDataset}.json`, {
        type: "application/json",
      });

      formData.append("file", file);
      formData.append("source", "predefined");
      formData.append("name", selectedDataset);
      formData.append("centralities", JSON.stringify(centralitiesArray));

      try {
        await onLoadData(formData);
        setCurrentDataset(selectedDataset);
      } catch (error) {}
    } else {
      formData.append("file", selectedFile!);
      formData.append("source", "upload");
      formData.append("name", selectedFile!.name);
      formData.append("centralities", JSON.stringify(centralitiesArray));

      try {
        await onLoadData(formData);
        setCurrentDataset(selectedFile!.name);
      } catch (error) {}
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setDataSource("dataset");
    setSelectedDataset("");
    setSelectedFile(null);
    setFileError(null);
    setCentralityError(null);

    if (centralityData) {
      setSelectedCentralities(new Set(centralityData.all));
    }
    setExpandedCategories(new Set());

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canConfirm =
    ((dataSource === "dataset" && selectedDataset) ||
      (dataSource === "file" && selectedFile)) &&
    !centralityError &&
    centralityData !== null;

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
              Choose a dataset or import your own file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <DataSourceInput
              dataSource={dataSource}
              setDataSource={setDataSource}
              datasets={datasets}
              selectedDataset={selectedDataset}
              setSelectedDataset={setSelectedDataset}
              fileInputRef={fileInputRef}
              selectedFile={selectedFile}
              fileError={fileError}
              onFileSelect={handleFileSelect}
              onClearFile={() => {
                setSelectedFile(null);
                setFileError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            />

            <CentralitySelector
              centralityData={centralityData}
              isLoading={isLoadingCentralities}
              error={centralityError}
              selectedCentralities={selectedCentralities}
              setSelectedCentralities={setSelectedCentralities}
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
