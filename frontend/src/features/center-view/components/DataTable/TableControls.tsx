import { Input } from "@/components/shadcnUI/input";
import { type SortingState, type Table } from "@tanstack/react-table";

interface TableControlsProps<T> {
  table: Table<T>;
  firstColumnKey: string;
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
}

const TableControls = <T,>({
  table,
  firstColumnKey,
  sorting,
  onSortingChange,
}: TableControlsProps<T>) => {
  const validFirstColumnKey = table
    .getAllColumns()
    .some((c) => c.id === firstColumnKey)
    ? firstColumnKey
    : (table.getAllColumns()[0]?.id ?? "");

  return (
    <div className="flex items-center space-x-4 py-4">
      <Input
        placeholder="Filter..."
        value={
          (table.getColumn(validFirstColumnKey)?.getFilterValue() as string) ??
          ""
        }
        onChange={(event) =>
          table
            .getColumn(validFirstColumnKey)
            ?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
    </div>
  );
};

export default TableControls;
