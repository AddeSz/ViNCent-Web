import { Button } from "@/components/shadcnUI/button";
import { Label } from "@/components/shadcnUI/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcnUI/popover";
import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { Check, ChevronsUpDown } from "lucide-react";

interface SortingSelectorProps {
  sorting: SortingState;
  onSortKeyChange: (key: string, preserveDirection?: boolean) => void;
}

const SortingSelector = ({
  sorting,
  onSortKeyChange,
}: SortingSelectorProps) => {
  const centralityKeys = useCentralityStore((s) => s.enabledCentralityKeys);
  const attributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);

  const sortKey = sorting[0]?.id || "none";

  const allKeys = ["none", ...centralityKeys, ...attributeKeys];

  const renderOption = (key: string) => {
    const isSelected = sortKey === key;

    return (
      <div
        key={key}
        className={`flex w-full cursor-pointer items-center justify-between rounded-[4px] p-1 px-2 ${
          isSelected ? "bg-accent" : "hover:bg-accent"
        }`}
        onClick={() => {
          onSortKeyChange(key, false);
        }}
        title={formatKeyLabel(key)}
      >
        <Label
          htmlFor={`sort-${key}`}
          className="flex-1 cursor-pointer truncate"
        >
          <span
            className="truncate leading-normal"
            style={{ color: getColorForKey(key) }}
          >
            {formatKeyLabel(key)}
          </span>
        </Label>
        {isSelected && (
          <Check size={16} className="ml-2 shrink-0 text-muted-foreground" />
        )}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          title="Sort By"
          className="w-full cursor-pointer"
        >
          <span className="max-w-20 truncate">{formatKeyLabel(sortKey)}</span>
          <ChevronsUpDown />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="scrollbar-thin max-h-80 w-54 overflow-y-auto p-1">
        <>{allKeys.map((key) => renderOption(key))}</>
      </PopoverContent>
    </Popover>
  );
};

export default SortingSelector;
