import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { formatKeyLabel } from "@/utils/utils";
import { type Table } from "@tanstack/react-table";
import { useState } from "react";

interface TableControlsProps<T> {
  table: Table<T>;
  setVisibilityFilter: React.Dispatch<
    React.SetStateAction<"all" | "hidden" | "visible" | "selected">
  >;
}

const TableControls = <T,>({
  table,
  setVisibilityFilter,
}: TableControlsProps<T>) => {
  const filterableColumns = table
    .getAllColumns()
    .filter((col) => col.getCanFilter() && col.id !== "select");

  const defaultColumn = filterableColumns.find((col) => col.id === "label")
    ? "label"
    : (filterableColumns[0]?.id ?? "");

  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const [selectedColumn, setSelectedColumn] = useState(defaultColumn);
  const [visibilityFilter, setLocalVisibilityFilter] = useState<
    "all" | "hidden" | "visible" | "selected"
  >("all");

  const handleVisibilityChange = (
    v: "all" | "hidden" | "visible" | "selected",
  ) => {
    setLocalVisibilityFilter(v);
    setVisibilityFilter(v);
  };

  const validSelectedColumn = filterableColumns.some(
    (c) => c.id === selectedColumn,
  )
    ? selectedColumn
    : defaultColumn;

  return (
    <div className="flex flex-wrap items-center gap-4 py-4">
      <Select value={validSelectedColumn} onValueChange={setSelectedColumn}>
        <SelectTrigger className="w-[160px]">
          <div
            className="truncate"
            style={{ color: getColorForKey(validSelectedColumn) }}
          >
            <SelectValue placeholder="Select column" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {filterableColumns.map((column) => (
            <SelectItem
              key={column.id}
              value={column.id}
              style={{ color: getColorForKey(column.id) }}
            >
              {column.id === "label" ? "Label" : formatKeyLabel(column.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder={`Filter by ${formatKeyLabel(validSelectedColumn)}...`}
        value={
          (table.getColumn(validSelectedColumn)?.getFilterValue() as string) ??
          ""
        }
        onChange={(event) =>
          table
            .getColumn(validSelectedColumn)
            ?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />

      <Select value={visibilityFilter} onValueChange={handleVisibilityChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Nodes</SelectItem>
          <SelectItem value="visible">Visible Only</SelectItem>
          <SelectItem value="hidden">Hidden Only</SelectItem>
          <SelectItem value="selected">Selected Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TableControls;
