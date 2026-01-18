import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { formatKeyLabel } from "@/utils/utils";
import { type Table } from "@tanstack/react-table";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TableSearchProps<T> {
  table: Table<T>;
  searchColumn: string;
  searchValue: string;
  onSearchColumnChange: (column: string) => void;
  onSearchValueChange: (value: string) => void;
}

const TableSearch = <T,>({
  table,
  searchColumn,
  searchValue,
  onSearchColumnChange,
  onSearchValueChange,
}: TableSearchProps<T>) => {
  const [open, setOpen] = useState(false);
  const getColorForMetric = useMetricsStore((s) => s.getColorForMetric);

  const filterableColumns = table
    .getAllColumns()
    .filter(
      (col) =>
        col.getCanFilter() && col.id !== "select" && col.id !== "hiddenCol",
    );

  const defaultColumn = filterableColumns.find((col) => col.id === "label")
    ? "label"
    : filterableColumns.find((col) => col.id === "source")
      ? "source"
      : filterableColumns.find((col) => col.id === "key")
        ? "key"
        : (filterableColumns[0]?.id ?? "");

  const validSearchColumn = filterableColumns.some((c) => c.id === searchColumn)
    ? searchColumn
    : defaultColumn;

  useEffect(() => {
    const currentFilters = table.getState().columnFilters;

    const newFilters = searchValue
      ? [{ id: validSearchColumn, value: searchValue }]
      : [];

    const filtersChanged =
      JSON.stringify(currentFilters) !== JSON.stringify(newFilters);

    if (filtersChanged) {
      table.setColumnFilters(newFilters);
    }
  }, [table, validSearchColumn, searchValue]);

  const handleColumnChange = (column: string) => {
    onSearchColumnChange(column);
    setOpen(false);
  };

  const handleValueChange = (value: string) => {
    onSearchValueChange(value);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative max-w-sm">
        <Input
          placeholder={`Filter by ${formatKeyLabel(validSearchColumn)}...`}
          value={searchValue}
          onChange={(event) => handleValueChange(event.target.value)}
          className="pr-8"
        />
        {searchValue && (
          <button
            onClick={() => handleValueChange("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex w-40 cursor-pointer items-center justify-between px-2 text-sm"
            size="sm"
          >
            <span
              className="truncate"
              style={{ color: getColorForMetric(validSearchColumn) }}
            >
              {formatKeyLabel(validSearchColumn)}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search columns..." className="h-9" />
            <CommandEmpty>No columns found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {filterableColumns.map((column) => (
                  <CommandItem
                    key={column.id}
                    value={column.id}
                    onSelect={() => handleColumnChange(column.id)}
                    className="flex cursor-pointer items-center justify-between gap-2"
                    style={{
                      color: getColorForMetric(column.id),
                    }}
                  >
                    <span className="truncate">
                      {formatKeyLabel(column.id)}
                    </span>
                    {validSearchColumn === column.id && (
                      <Check className="h-4 w-4 shrink-0" />
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

export default TableSearch;
