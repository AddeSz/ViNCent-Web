import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, EyeOff } from "lucide-react";

export const createSelectColumn = <
  T extends Record<string, any>,
>(): ColumnDef<T> => ({
  id: "select",
  size: 40,
  header: ({ table }) => {
    return (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="cursor-pointer"
        />
      </div>
    );
  },
  cell: ({ row }) => {
    const rowId = row.id;
    return (
      <div className="flex items-center justify-center">
        <Checkbox
          id={`select-${rowId}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="cursor-pointer"
        />
      </div>
    );
  },
  enableSorting: false,
  enableHiding: false,
});

export const createLabelColumn = <
  T extends Record<string, any>,
>(): ColumnDef<T> => ({
  id: "label",
  accessorFn: (row) => row.label ?? row.id,
  sortDescFirst: true,
  size: 100,
  header: ({ column }) => {
    let SortIcon = ArrowUpDown;
    if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
    if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
    return (
      <Button
        variant="ghost"
        onClick={column.getToggleSortingHandler()}
        className="w-full justify-between gap-1"
        size={"none"}
        title="Label"
      >
        <div className="truncate text-sm font-medium">Label</div>
        <SortIcon className="h-4 w-4 shrink-0" />
      </Button>
    );
  },
  cell: ({ row }) => {
    const value = row.getValue("label");
    return (
      <div
        className="truncate px-2 text-left font-medium"
        title={formatValue(value)}
      >
        {formatValue(value)}
      </div>
    );
  },
});

export const createHiddenColumn = <
  T extends { id: string },
>(): ColumnDef<T> => ({
  id: "isHidden",
  size: 60,
  header: () => (
    <div
      className="flex items-center justify-center text-sm font-medium"
      title="Toggle node visibility"
    >
      Visibility
    </div>
  ),
  cell: ({ row }) => {
    const nodeId = row.original.id;
    const hiddenNodes = useNetworkStore((s) => s.hiddenNodes);
    const hideNode = useNetworkStore((s) => s.hideNode);
    const restoreNode = useNetworkStore((s) => s.restoreNode);

    const isHidden = hiddenNodes.has(nodeId);

    const toggleHidden = () => {
      if (isHidden) restoreNode(nodeId);
      else hideNode(nodeId);
    };

    return (
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHidden}
          title={isHidden ? "Show node" : "Hide node"}
          className="h-6 w-6"
        >
          {isHidden ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-foreground" />
          )}
        </Button>
      </div>
    );
  },
  enableSorting: false,
  enableHiding: false,
});

export const createDataColumns = <T extends Record<string, any>>(
  keys: string[],
): ColumnDef<T>[] =>
  keys.map((key) => ({
    id: key,
    accessorFn: (row) => row[key as keyof T],
    size: 100,
    enableSortingRemoval: true,
    sortDescFirst: true,
    filterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);

      const stringValue = String(value).toLowerCase();
      const stringFilter = String(filterValue).toLowerCase();

      return stringValue.includes(stringFilter);
    },
    header: ({ column }) => {
      const color = useMetricsStore.getState().getColorForMetric(key);
      let SortIcon = ArrowUpDown;
      if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
      if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
      return (
        <Button
          variant="ghost"
          style={{ color }}
          onClick={column.getToggleSortingHandler()}
          className="w-full justify-between gap-1"
          size={"none"}
          title={formatKeyLabel(key)}
        >
          <div className="truncate text-sm font-medium capitalize">
            {formatKeyLabel(key)}
          </div>
          <SortIcon className="h-4 w-4 shrink-0" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue(key);
      const headerColor = useMetricsStore.getState().getColorForMetric(key);
      const color =
        !headerColor || headerColor === "var(--muted-foreground)"
          ? useMetricsStore
              .getState()
              .getColorForMetric(key, value as string | number)
          : undefined;
      return (
        <div
          className="truncate px-2 text-left font-medium"
          style={{ color }}
          title={formatValue(value)}
        >
          {formatValue(value)}
        </div>
      );
    },
  }));
