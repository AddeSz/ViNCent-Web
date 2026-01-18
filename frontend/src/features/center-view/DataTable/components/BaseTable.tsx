import type { ColumnDef, Table } from "@tanstack/react-table";
import TableContent from "./TableContent";
import TablePagination from "./TablePagination";

interface BaseTableProps<T extends Record<string, any>> {
  table: Table<T>;
  columns: ColumnDef<T>[];
  scrollPosition: number;
  onScrollChange: (position: number) => void;
}

export function BaseTable<T extends Record<string, any>>({
  table,
  columns,
  scrollPosition,
  onScrollChange,
}: BaseTableProps<T>) {
  return (
    <>
      <TableContent
        table={table}
        columnsLength={columns.length}
        scrollPosition={scrollPosition}
        onScrollChange={onScrollChange}
      />
      <TablePagination table={table} rowsPerPageOptions={[10, 25, 50, 100]} />
    </>
  );
}
