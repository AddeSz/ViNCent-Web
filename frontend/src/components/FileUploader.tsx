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
  onLoadData: (formData: FormData, datasetID?: string) => Promise<void>;
}

const FileUploader = ({ datasets, onLoadData }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setCurrentDataset = useNetworkStore((s) => s.setCurrentDataset);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", "upload");
    formData.append("name", file.name);

    try {
      await onLoadData(formData);
      setCurrentDataset(file.name);
    } catch (error) {}

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDatasetSelect = async (key: string) => {
    const datasetContent = datasets[key];
    const jsonString = JSON.stringify(datasetContent);
    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], `${key}.json`, { type: "application/json" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", "predefined");
    formData.append("name", key);

    try {
      await onLoadData(formData, key);
      setCurrentDataset(key);
    } catch (error) {}
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
            accept=".json, .graphml, .xml, .mtx, .mm, .txt, .csv .tsv"
          />
        </div>
      </div>
    </>
  );
};

export default FileUploader;
