import {
  TableBody,
  TableCell,
  Table as TableComponent,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/shadcnutils";
import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";

interface TableContentProps<T extends Record<string, any>> {
  table: Table<T>;
  columnsLength: number;
  scrollPosition: number;
  onScrollChange: (position: number) => void;
}

const TableContent = <T extends Record<string, any>>({
  table,
  columnsLength,
  scrollPosition,
  onScrollChange,
}: TableContentProps<T>) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  useEffect(() => {
    if (parentRef.current && scrollPosition > 0) {
      parentRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    onScrollChange(scrollTop);
  };

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className="scrollbar-thin flex-1 overflow-auto border"
      onScroll={handleScroll}
    >
      <TableComponent style={{ width: "100%", tableLayout: "fixed" }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} noHover>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{
                    width:
                      header.id === "filler" ? "auto" : `${header.getSize()}px`,
                    minWidth:
                      header.id === "filler" ? 0 : `${header.getSize()}px`,
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
              const pendingRemoval =
                row.original.flags?.pendingRemoval ?? false;
              const isHidden = row.original.flags?.hidden ?? false;

              let backgroundColor: string | undefined = undefined;
              let opacity = 1;

              if (pendingRemoval && isHidden) {
                backgroundColor = "rgba(255, 0, 0, 0.1)";
                opacity = 0.6;
              } else if (pendingRemoval) {
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
                    height: "40px",
                    backgroundColor,
                    opacity,
                    transition: "opacity 0.3s, background-color 0.3s",
                  }}
                  className={cn(
                    "group",
                    pendingRemoval
                      ? "removed-row"
                      : isHidden
                        ? "hidden-row"
                        : undefined,
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        width:
                          cell.column.id === "filler"
                            ? "auto"
                            : `${cell.column.getSize()}px`,
                        minWidth:
                          cell.column.id === "filler"
                            ? 0
                            : `${cell.column.getSize()}px`,
                        maxWidth:
                          cell.column.id === "filler"
                            ? "none"
                            : `${cell.column.getSize()}px`,
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
              <TableCell colSpan={columnsLength} className="h-10 text-center">
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
