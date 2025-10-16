import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useKeys } from "@/hooks/useKeys";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown } from "lucide-react";

interface SortingSelectorProps {
  sorting: SortingState;
  onSortKeyChange: (key: string, preserveDirection?: boolean) => void;
  setSorting: (sorting: SortingState) => void;
}

const SortingSelector = ({
  sorting,
  onSortKeyChange,
  setSorting,
}: SortingSelectorProps) => {
  const { allKeys } = useKeys();
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);

  const sortKey = sorting[0]?.id || "none";
  const keys = ["none", ...allKeys];

  const isDisabled = sorting.length === 0;
  const currentDirection = sorting[0]?.desc ? "desc" : "asc";

  const toggleDirection = () => {
    if (sorting.length > 0) {
      setSorting([{ id: sorting[0].id, desc: !sorting[0].desc }]);
    }
  };

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
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-full flex-grow sm:flex-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              title="Sort By"
              className="flex w-full cursor-pointer items-center justify-center gap-2 px-2"
            >
              <div className="flex w-full items-center justify-center gap-2">
                <p
                  className="w-fit max-w-[160px] truncate"
                  style={{ color: getColorForKey(sortKey) }}
                >
                  {formatKeyLabel(sortKey)}
                </p>
                <ChevronsUpDown />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="scrollbar-thin max-h-80 w-54 overflow-y-auto p-1">
            <>{keys.map((key) => renderOption(key))}</>
          </PopoverContent>
        </Popover>
      </div>
      <div className="w-full flex-grow sm:flex-1">
        <Button
          variant="outline"
          title="Direction"
          disabled={isDisabled}
          onClick={toggleDirection}
          className="flex w-full cursor-pointer items-center justify-center gap-2 px-2"
        >
          <div className="flex w-full items-center justify-center gap-2">
            <p className="w-fit truncate">
              {isDisabled
                ? "Direction"
                : currentDirection === "asc"
                  ? "Ascending"
                  : "Descending"}
            </p>
            {!isDisabled &&
              (currentDirection === "asc" ? (
                <ArrowUp size={14} />
              ) : (
                <ArrowDown size={14} />
              ))}
          </div>
        </Button>
      </div>
    </div>
  );
};

export default SortingSelector;
