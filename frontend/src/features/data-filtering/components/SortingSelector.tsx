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
import { useKeys } from "@/hooks/useKeys";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { formatKeyLabel } from "@/utils/utils";
import { ArrowDown, ArrowUp, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

const SortingSelector = () => {
  const [open, setOpen] = useState(false);
  const { enabledNodeKeys, enabledNodeCommunityKeys } = useKeys();
  const { sorting, setSorting, handleSortKeyChange } = useSortingLogic();
  const getColorForMetric = useMetricsStore((s) => s.getColorForMetric);

  const sortKey = sorting[0]?.id || "none";
  const keys = [
    "none",
    "label",
    ...enabledNodeKeys,
    ...enabledNodeCommunityKeys,
  ];
  const isDisabled = sorting.length === 0;
  const currentDirection = sorting[0]?.desc ? "desc" : "asc";
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());

  const toggleDirection = () => {
    if (sorting.length > 0) {
      setSorting([{ id: sorting[0].id, desc: !sorting[0].desc }]);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor={"sort-by"} className="truncate text-sm">
          Sort by
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="sort-by"
              variant="outline"
              title="Sort By"
              className="flex w-full cursor-pointer items-center justify-between px-2 text-sm"
              disabled={isEmpty}
              size="sm"
            >
              <span
                className="truncate"
                style={{ color: getColorForMetric(sortKey) }}
              >
                {formatKeyLabel(sortKey)}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Command>
              <CommandInput placeholder="Search keys..." className="h-9" />
              <CommandEmpty>No keys found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {keys.map((key) => (
                    <CommandItem
                      key={key}
                      value={key}
                      onSelect={() => {
                        handleSortKeyChange(key, false);
                        setOpen(false);
                      }}
                      className="flex cursor-pointer items-center justify-between gap-2"
                      style={{ color: getColorForMetric(key) }}
                    >
                      <span className="truncate">{formatKeyLabel(key)}</span>
                      {sortKey === key && (
                        <Check className="h-4 w-4 shrink-0" />
                      )}
                      {sortKey !== key && <span className="h-4 w-4 shrink-0" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="outline"
        title="Direction"
        disabled={isDisabled}
        onClick={toggleDirection}
        className="flex w-full cursor-pointer items-center justify-center gap-2 px-2"
        size="sm"
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
    </>
  );
};

export default SortingSelector;
