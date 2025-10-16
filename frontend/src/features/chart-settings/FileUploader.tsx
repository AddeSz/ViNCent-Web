import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

interface FileUploaderProps {
  datasets: Record<string, any>;
  onLoadData: (data: any) => void;
}

const FileUploader = ({ datasets, onLoadData }: FileUploaderProps) => {
  const [currentDataset, setCurrentDataset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.nodes || !parsed.links) {
        throw new Error("Invalid format: must contain 'nodes' and 'links'");
      }

      setCurrentDataset(file.name);
      onLoadData(parsed);
    } catch (err) {
      console.error("File load failed:", err);
      alert("Invalid JSON format. Ensure your file has 'nodes' and 'links'.");
    }
  };

  const handleDatasetSelect = (key: string) => {
    setCurrentDataset(key);
    onLoadData(datasets[key]);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <div className="w-full flex-grow sm:w-auto sm:flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                Datasets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {Object.keys(datasets).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleDatasetSelect(key)}
                >
                  {key}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="w-full flex-grow sm:w-auto sm:flex-1">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            Import JSON
          </Button>
          <Input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
      {currentDataset && (
        <p
          title={currentDataset}
          className="truncate text-xs text-muted-foreground"
        >
          Loaded dataset: <span className="font-medium">{currentDataset}</span>
        </p>
      )}
    </>
  );
};

export default FileUploader;
