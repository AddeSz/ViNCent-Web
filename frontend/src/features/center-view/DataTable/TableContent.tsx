import {
  TableBody,
  TableCell,
  Table as TableComponent,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface RowData {
  removed?: boolean;
  hidden?: boolean;
}
interface TableContentProps<T extends RowData> {
  table: Table<T>;
  columnsLength: number;
}

const TableContent = <T extends RowData>({
  table,
  columnsLength,
}: TableContentProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className="scrollbar-thin flex-1 overflow-auto rounded-md border [scrollbar-gutter:stable] scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full"
    >
      <TableComponent>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{
                    width: header.column.getSize(),
                    minWidth: header.column.getSize(),
                    maxWidth: header.column.getSize(),
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody
          style={{
            position: "relative",
            height: `${totalSize}px`,
          }}
        >
          {virtualRows.length ? (
            virtualRows.map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              const isRemoved = row.original.removed;
              const isHidden = row.original.hidden;

              let backgroundColor: string | undefined = undefined;
              let opacity = 1;

              if (isRemoved && isHidden) {
                backgroundColor = "rgba(255, 0, 0, 0.1)";
                opacity = 0.6;
              } else if (isRemoved) {
                backgroundColor = "rgba(255, 0, 0, 0.1)";
                opacity = 1;
              } else if (isHidden) {
                backgroundColor = "rgba(128, 128, 128, 0.05)";
                opacity = 0.6;
              }

              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    display: "table-row",
                    height: "40px",
                    backgroundColor,
                    opacity,
                    transition: "opacity 0.3s, background-color 0.3s",
                  }}
                  className={
                    isRemoved
                      ? "removed-row"
                      : isHidden
                        ? "hidden-row"
                        : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        display: "table-cell",
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columnsLength} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableComponent>
    </div>
  );
};

export default TableContent;
