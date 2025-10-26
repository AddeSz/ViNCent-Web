import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex w-full cursor-pointer items-center px-2"
          title={label}
          disabled={isEmpty}
        >
          <p className="w-fit max-w-40 truncate">{label}</p>
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-54 p-0" align="start" side="top">
        <Command>
          <CommandInput placeholder="Search keys..." className="h-9" />
          <CommandEmpty>No keys found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((key) => (
                <CommandItem
                  key={key}
                  value={formatKeyLabel(key)}
                  onSelect={() => {
                    const removed = toggleKey(key);
                    if (removed && sorting[0]?.id === key) {
                      setSorting([]);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-2 px-2"
                  title={formatKeyLabel(key)}
                >
                  <Checkbox
                    checked={enabledKeys.includes(key)}
                    onCheckedChange={() => {
                      const removed = toggleKey(key);
                      if (removed && sorting[0]?.id === key) {
                        setSorting([]);
                      }
                    }}
                    className="cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span
                    className="flex-1 truncate"
                    style={{ color: getColorForKey(key) }}
                  >
                    {formatKeyLabel(key)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default KeySelector;
