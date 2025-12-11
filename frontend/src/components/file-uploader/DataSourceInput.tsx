import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface DataSourceInputProps {
  dataSource: "dataset" | "file";
  setDataSource: (value: "dataset" | "file") => void;
  datasets: Record<string, any>;
  selectedDataset: string;
  setSelectedDataset: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  fileError: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
}

const DataSourceInput = ({
  dataSource,
  setDataSource,
  datasets,
  selectedDataset,
  setSelectedDataset,
  fileInputRef,
  selectedFile,
  fileError,
  onFileSelect,
  onClearFile,
}: DataSourceInputProps) => (
  <div className="space-y-4">
    <div className="space-y-0">
      <p className="text-sm font-medium">Data Source</p>
      <RadioGroup
        value={dataSource}
        onValueChange={setDataSource}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dataset" id="dataset" />
          <Label htmlFor="dataset" className="cursor-pointer text-sm">
            Predefined Dataset
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="file" id="file" />
          <Label htmlFor="file" className="cursor-pointer text-sm">
            Import File
          </Label>
        </div>
      </RadioGroup>
    </div>

    {dataSource === "dataset" && (
      <div>
        <p className="text-sm font-medium">Select Dataset</p>
        <Select value={selectedDataset} onValueChange={setSelectedDataset}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a dataset..." />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(datasets).map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="h-3"></p>
      </div>
    )}

    {dataSource === "file" && (
      <div>
        <p className="text-sm font-medium">File Selection</p>
        <div className="flex w-full">
          <Input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            className="hidden"
            accept=".json, .graphml, .xml, .mtx, .txt, .csv, .tsv"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-r-none border border-r-0 bg-accent"
          >
            Choose File
          </Button>
          <div className="flex flex-1 items-center justify-between rounded-r-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground">
            <span>{selectedFile ? selectedFile.name : "No file chosen"}</span>
            {selectedFile && (
              <X
                className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={onClearFile}
              />
            )}
          </div>
        </div>
        <p className="h-3 text-[10px] text-muted-foreground italic">
          Supports: .json, .graphml, .xml, .mtx, .txt, .csv, .tsv
        </p>
        {fileError && <p className="pt-1 text-xs text-red-500">{fileError}</p>}
      </div>
    )}
  </div>
);

export default DataSourceInput;
