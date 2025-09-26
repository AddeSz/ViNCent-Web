import { Button } from "@/components/shadcnUI/button";
import { Checkbox } from "@/components/shadcnUI/checkbox";
import { Label } from "@/components/shadcnUI/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcnUI/popover";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

interface KeySelectorProps {
  label?: string;
  options: string[];
  enabledKeys: string[];
  toggleKey: (key: string) => boolean;
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
}

const KeySelector = ({
  label = "Keys",
  options,
  enabledKeys,
  toggleKey,
  sorting,
  setSorting,
}: KeySelectorProps) => {
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          title={label}
        >
          <span className="max-w-20 truncate">{label}</span>
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-54 p-1">
        <div className="">
          {options.map((key) => {
            const id = `key-${key}`;
            return (
              <Label
                htmlFor={id}
                key={key}
                className="h-full w-full cursor-pointer rounded p-1 leading-normal hover:bg-accent"
                style={{ color: getColorForKey(key) }}
                title={formatKeyLabel(key)}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={enabledKeys.includes(key)}
                    onCheckedChange={() => {
                      const removed = toggleKey(key);
                      if (removed && sorting[0]?.id === key) {
                        setSorting([]);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <span className="truncate leading-normal">
                    {formatKeyLabel(key)}
                  </span>
                </div>
              </Label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default KeySelector;
