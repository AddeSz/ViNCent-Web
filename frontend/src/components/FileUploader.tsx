import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useRef } from "react";

interface FileUploaderProps {
  datasets: Record<string, any>;
  onLoadData: (formData: FormData, datasetID?: string) => void;
  hasError?: boolean;
}

const FileUploader = ({
  datasets,
  onLoadData,
  hasError = false,
}: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDataset = useNetworkStore((s) => s.currentDataset);
  const setCurrentDataset = useNetworkStore((s) => s.setCurrentDataset);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", "upload");
    formData.append("name", file.name);

    setCurrentDataset(file.name);
    onLoadData(formData);
  };

  const handleDatasetSelect = (key: string) => {
    const datasetContent = datasets[key];
    const jsonString = JSON.stringify(datasetContent);
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], `${key}.json`, { type: "application/json" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", "predefined");
    formData.append("name", key);

    setCurrentDataset(key);
    onLoadData(formData, key);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <div className="w-full grow sm:flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                title="Load Dataset"
                className="flex w-full cursor-pointer items-center px-2"
              >
                <p className="w-fit truncate">Datasets</p>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="start">
              {Object.keys(datasets).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleDatasetSelect(key)}
                  className="cursor-pointer"
                >
                  {key}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="w-full grow sm:flex-1">
          <Button
            variant="outline"
            title="Import Dataset"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full cursor-pointer items-center px-2"
          >
            <p className="w-fit truncate">Import File</p>
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".json, .graphml, .xml, .mtx, .mm"
          />
        </div>
      </div>
      {currentDataset && !hasError && (
        <p
          title={currentDataset}
          className="truncate pt-1 text-xs text-muted-foreground"
        >
          Loaded dataset: <span className="font-medium">{currentDataset}</span>
        </p>
      )}
    </>
  );
};

export default FileUploader;
