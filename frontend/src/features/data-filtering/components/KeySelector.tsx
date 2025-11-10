import { Button } from "@/components/ui/button";
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
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { Check, ChevronDown } from "lucide-react";
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
  const getColorForMetric = useMetricsStore((s) => s.getColorForMetric);
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());

  const handleToggle = (key: string) => {
    const removed = toggleKey(key);
    if (removed && sorting[0]?.id === key) {
      setSorting([]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex w-full cursor-pointer items-center justify-between px-2 text-sm"
          title={label}
          disabled={isEmpty}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Search keys..." className="h-9" />
          <CommandEmpty>No keys found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((key) => (
                <CommandItem
                  key={key}
                  value={key}
                  onSelect={() => handleToggle(key)}
                  className="flex cursor-pointer items-center justify-between gap-2"
                  style={{
                    color: getColorForMetric(key),
                  }}
                >
                  <span className="truncate">{formatKeyLabel(key)}</span>
                  {enabledKeys.includes(key) && (
                    <Check className="h-4 w-4 shrink-0" />
                  )}
                  {!enabledKeys.includes(key) && (
                    <span className="h-4 w-4 shrink-0" />
                  )}
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
