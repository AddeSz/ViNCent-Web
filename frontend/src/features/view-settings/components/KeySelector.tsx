import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import { useFilterStore } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { formatKeyLabel } from "@/utils/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

interface KeySelectorProps {
  label?: string;
  description?: string;
  options: string[];
  enabledKeys: string[];
  type: string;
}

const KeySelector = ({
  label = "Keys",
  description,
  options,
  enabledKeys,
  type,
}: KeySelectorProps) => {
  const [open, setOpen] = useState(false);
  const getColorForMetric = useGetColorForMetric();
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());
  const { sortingState, setSorting } = useSortingLogic();
  const toggleMetricsKey = useFilterStore((s) => s.toggleMetricsKey);

  const handleToggle = (key: string) => {
    const removed = toggleMetricsKey(key, type === "edge");
    if (removed && sortingState[0]?.id === key) {
      setSorting([]);
    }
  };

  return (
    <div className="space-y-1">
      {description && (
        <Label htmlFor={`key-selector-${label}`} className="text-sm">
          {description}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`key-selector-${label}`}
            variant="outline"
            className="flex w-full cursor-pointer items-center justify-between px-2 text-sm"
            title={label}
            disabled={isEmpty}
            size="sm"
          >
            <span className="truncate text-muted-foreground">{label}</span>
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
    </div>
  );
};

export default KeySelector;
