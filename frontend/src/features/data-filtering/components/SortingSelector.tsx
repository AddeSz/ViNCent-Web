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
import { useKeys } from "@/hooks/useKeys";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);
  const { allKeys } = useKeys();
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);

  const sortKey = sorting[0]?.id || "none";
  const keys = ["none", "label", ...allKeys];
  const isDisabled = sorting.length === 0;
  const currentDirection = sorting[0]?.desc ? "desc" : "asc";
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());

  const toggleDirection = () => {
    if (sorting.length > 0) {
      setSorting([{ id: sorting[0].id, desc: !sorting[0].desc }]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-full flex-grow sm:flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              title="Sort By"
              className="flex w-full cursor-pointer items-center px-2"
              disabled={isEmpty}
            >
              <p
                className="w-fit max-w-[160px] truncate"
                style={{ color: getColorForKey(sortKey) }}
              >
                {formatKeyLabel(sortKey)}
              </p>
              <ChevronsUpDown />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-54 p-0" align="start" side="top">
            <Command>
              <CommandInput placeholder="Search keys..." className="h-9" />
              <CommandEmpty>No keys found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {keys.map((key) => (
                    <CommandItem
                      key={key}
                      value={formatKeyLabel(key)}
                      onSelect={() => {
                        onSortKeyChange(key, false);
                        setOpen(false);
                      }}
                      className="flex cursor-pointer items-center justify-between"
                      title={formatKeyLabel(key)}
                    >
                      <span
                        className="flex-1 truncate"
                        style={{ color: getColorForKey(key) }}
                      >
                        {formatKeyLabel(key)}
                      </span>
                      {sortKey === key && <Check />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
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
              {isDisabled ? (
                "Direction"
              ) : currentDirection === "asc" ? (
                <>Ascending&nbsp;</>
              ) : (
                "Descending"
              )}
            </p>
            {!isDisabled &&
              (currentDirection === "asc" ? <ArrowUp /> : <ArrowDown />)}
          </div>
        </Button>
      </div>
    </div>
  );
};

export default SortingSelector;
