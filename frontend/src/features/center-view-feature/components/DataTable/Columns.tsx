import { Button } from "@/components/shadcnUI/button";
import { Checkbox } from "@/components/shadcnUI/checkbox";
import { Label } from "@/components/shadcnUI/label";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import { formatValue } from "@/utils/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

export const createSelectColumn = <
  T extends { label?: string },
>(): ColumnDef<T> => ({
  id: "select",
  header: ({ table }) => {
    return (
      <div className="flex w-24 items-center space-x-2">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="cursor-pointer"
        />
        <Label>Labels</Label>
      </div>
    );
  },
  cell: ({ row }) => {
    const label = row.original.label;
    const rowId = row.id;
    return (
      <div className="flex w-24 items-center space-x-2">
        <Checkbox
          id={`select-${rowId}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="cursor-pointer"
        />
        <Label htmlFor={`select-${rowId}`} className="truncate font-medium">
          {label}
        </Label>
      </div>
    );
  },
  enableSorting: false,
  enableHiding: false,
});

export const createCentralityColumns = <T,>(
  enabledKeys: string[],
): ColumnDef<T>[] =>
  enabledKeys.map((key) => ({
    accessorKey: key,
    header: ({ column }) => {
      const color = useVisualizationStore.getState().getColorForKey(key);
      return (
        <Button
          variant="ghost"
          style={{ color }}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-24 justify-between gap-1"
          size={"none"}
        >
          <div className="truncate text-sm font-medium capitalize">
            {key.replace(/_/g, " ")}
          </div>
          <ArrowUpDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue(key);
      return (
        <div className="w-24 truncate px-2 text-left font-medium">
          {formatValue(value)}
        </div>
      );
    },
  }));

export const createAttributeColumns = <T,>(
  enabledKeys: string[],
): ColumnDef<T>[] =>
  enabledKeys.map((key) => ({
    id: key,
    accessorFn: (row) => row[key as keyof typeof row],
    header: ({ column }) => {
      const color = useVisualizationStore.getState().getColorForKey(key);
      return (
        <Button
          variant="ghost"
          style={{ color }}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="w-24 justify-between gap-1"
          size={"none"}
        >
          <div className="truncate text-sm font-medium capitalize">
            {key.replace(/_/g, " ")}
          </div>
          <ArrowUpDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const value = row.getValue(key);
      const headerColor = useVisualizationStore.getState().getColorForKey(key);

      const color =
        !headerColor || headerColor === "var(--muted-foreground)"
          ? useVisualizationStore
              .getState()
              .getColorForKey(key, value as string | number)
          : undefined;
      return (
        <div
          className="w-24 truncate px-2 text-left font-medium"
          style={{ color }}
        >
          {formatValue(value)}
        </div>
      );
    },
  }));
