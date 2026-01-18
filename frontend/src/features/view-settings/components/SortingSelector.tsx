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
  const { sortingState, setSorting, handleSortKeyChange } = useSortingLogic();
  const getColorForMetric = useMetricsStore((s) => s.getColorForMetric);

  const sortKey = sortingState[0]?.id || "none";
  const keys = [
    "none",
    "label",
    ...enabledNodeKeys,
    ...enabledNodeCommunityKeys,
  ];
  const isDisabled = sortingState.length === 0;
  const currentDirection = sortingState[0]?.desc ? "desc" : "asc";
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());

  const toggleDirection = () => {
    if (sortingState.length > 0) {
      setSorting([{ id: sortingState[0].id, desc: !sortingState[0].desc }]);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor={"order-by"} className="truncate text-sm">
          Order by
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="order-by"
              variant="outline"
              title="Order By"
              className="w-full justify-between border-input px-3 font-normal"
              disabled={isEmpty}
              size="sm"
            >
              <span
                className="truncate text-sm"
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
