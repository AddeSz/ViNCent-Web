import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, EyeOff } from "lucide-react";

import type { AttributeInfo } from "@/types";
import { createColumnHelper } from "@tanstack/react-table";
import { Check, X } from "lucide-react";

export type AttributeRow = AttributeInfo & {
  id: string;
  rangeLabel: string;
  minValue: number | null;
  maxValue: number | null;
  uniqueValues: number;
};

const booleanFilterFn = (row: any, columnId: string, filterValue: string) => {
  const value = row.getValue(columnId) as boolean;
  const filter = filterValue.toLowerCase().trim();

  if (
    filter === "true" ||
    filter === "yes" ||
    filter === "1" ||
    filter === "check"
  ) {
    return value === true;
  }

  if (
    filter === "false" ||
    filter === "no" ||
    filter === "0" ||
    filter === "x"
  ) {
    return value === false;
  }

  return true;
};

const calculateColumnWidth = (text: string, minWidth = 100, maxWidth = 300) => {
  const estimatedWidth = text.length * 8 + 60;
  return Math.min(Math.max(estimatedWidth, minWidth), maxWidth);
};

export const createSelectColumn = <
  T extends Record<string, any>,
>(): ColumnDef<T> => ({
  id: "select",
  size: 40,
  minSize: 40,
  maxSize: 40,
  enableResizing: false,
  header: ({ table }) => {
    return (
      <div className="flex shrink-0 items-center justify-center">
        <Checkbox
          id={"select-all-main"}
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
      <div className="flex shrink-0 items-center justify-center">
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

export const createHiddenColumn = <
  T extends { id: string },
>(): ColumnDef<T> => ({
  id: "hiddenCol",
  size: 40,
  minSize: 40,
  maxSize: 40,
  enableResizing: false,
  header: ({ table }) => {
    const hiddenNodes = useNetworkStore((s) => s.hiddenNodes);
    const hideNode = useNetworkStore((s) => s.hideNode);
    const restoreNode = useNetworkStore((s) => s.restoreNode);

    const allRows = table.getRowModel().rows;
    const allHidden = allRows.every((row) => hiddenNodes.has(row.original.id));
    const someHidden = allRows.some((row) => hiddenNodes.has(row.original.id));

    const toggleAllHidden = () => {
      if (allHidden) {
        allRows.forEach((row) => restoreNode(row.original.id));
      } else {
        allRows.forEach((row) => hideNode(row.original.id));
      }
    };

    return (
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAllHidden}
          title={allHidden ? "Show all nodes" : "Hide all nodes"}
          className="h-6 w-6"
        >
          {allHidden ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : someHidden ? (
            <Eye className="h-4 w-4 text-muted-foreground opacity-90" />
          ) : (
            <Eye className="h-4 w-4 text-foreground" />
          )}
        </Button>
      </div>
    );
  },
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

export const createLabelColumn = <
  T extends Record<string, any>,
>(): ColumnDef<T> => ({
  id: "label",
  size: 150,
  minSize: 60,
  maxSize: 400,
  accessorFn: (row) => row.label ?? row.id,
  sortDescFirst: true,
  header: ({ column, header }) => {
    let SortIcon = ArrowUpDown;
    if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
    if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
    return (
      <div className="relative flex items-center">
        <Button
          variant="ghost"
          onClick={column.getToggleSortingHandler()}
          className="flex w-full items-center justify-start gap-1 rounded-none py-3"
          size={"none"}
          title="Label"
        >
          <SortIcon className="h-4 w-4 shrink-0" />
          <div className="truncate text-sm font-medium">Label</div>
        </Button>
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
            header.column.getIsResizing() ? "bg-primary opacity-100" : ""
          }`}
        />
      </div>
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

export const createEdgeSelectColumn = <
  T extends { id: string },
>(): ColumnDef<T> => ({
  id: "select",
  size: 40,
  minSize: 40,
  maxSize: 40,
  enableResizing: false,
  header: ({ table }) => {
    const selectedNodes = useNetworkStore((s) => s.selectedNodes);
    const toggleNodesSelection = useNetworkStore((s) => s.toggleNodesSelection);

    const allEdgeNodeIds = table.getRowModel().rows.flatMap((row) => {
      const [source, target] = row.original.id.split("|");
      return [source, target];
    });

    const allSelected =
      allEdgeNodeIds.length > 0 &&
      allEdgeNodeIds.every((id) => selectedNodes.has(id));

    const someSelected =
      !allSelected && allEdgeNodeIds.some((id) => selectedNodes.has(id));

    const toggleAll = () => {
      toggleNodesSelection(allEdgeNodeIds);
    };

    return (
      <div className="flex shrink-0 items-center justify-center">
        <Checkbox
          id="select-all-edges"
          checked={allSelected || (someSelected && "indeterminate")}
          onCheckedChange={toggleAll}
          aria-label="Select all edges"
          className="cursor-pointer"
        />
      </div>
    );
  },
  cell: ({ row }) => {
    const selectedNodes = useNetworkStore((s) => s.selectedNodes);
    const toggleNodesSelection = useNetworkStore((s) => s.toggleNodesSelection);

    const [source, target] = row.original.id.split("|");
    const nodeIds = [source, target];

    const sourceSelected = selectedNodes.has(source);
    const targetSelected = selectedNodes.has(target);
    const bothSelected = sourceSelected && targetSelected;
    const oneSelected = sourceSelected || targetSelected;

    const toggleSelection = () => {
      toggleNodesSelection(nodeIds);
    };

    return (
      <div className="flex shrink-0 items-center justify-center">
        <Checkbox
          id={`select-edge-${row.id}`}
          checked={bothSelected || (oneSelected && "indeterminate")}
          onCheckedChange={toggleSelection}
          aria-label="Select edge nodes"
          className="cursor-pointer"
        />
      </div>
    );
  },
  enableSorting: false,
  enableHiding: false,
});

export const createEdgeColumn = <T extends { id: string }>(
  nodeMap: Map<string, any>,
  type: "source" | "target",
): ColumnDef<T> => ({
  id: type,
  size: 150,
  minSize: 60,
  maxSize: 400,
  accessorFn: (row) => {
    const index = type === "source" ? 0 : 1;
    const nodeId = row.id.split("|")[index];
    const node = nodeMap.get(nodeId);
    return node?.label ?? nodeId;
  },
  sortDescFirst: true,
  header: ({ column, header }) => {
    let SortIcon = ArrowUpDown;
    if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
    if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
    const label = type === "source" ? "Source" : "Target";
    return (
      <div className="relative flex items-center">
        <Button
          variant="ghost"
          onClick={column.getToggleSortingHandler()}
          className="flex w-full items-center justify-start gap-1 rounded-none py-3"
          size={"none"}
          title={label}
        >
          <SortIcon className="h-4 w-4 shrink-0" />
          <div className="truncate text-sm font-medium">{label}</div>
        </Button>
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
            header.column.getIsResizing() ? "bg-primary opacity-100" : ""
          }`}
        />
      </div>
    );
  },
  cell: ({ row }) => {
    const value = row.getValue(type);
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

export const createDataColumns = <T extends Record<string, any>>(
  keys: string[],
): ColumnDef<T>[] =>
  keys.map((key) => {
    const formattedLabel = formatKeyLabel(key);
    const calculatedSize = calculateColumnWidth(formattedLabel);

    return {
      id: key,
      accessorFn: (row) => row[key as keyof T],
      size: calculatedSize,
      minSize: 60,
      maxSize: 400,
      enableSortingRemoval: true,
      sortDescFirst: true,
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId);
        const stringValue = String(value).toLowerCase();
        const stringFilter = String(filterValue).toLowerCase();
        return stringValue.includes(stringFilter);
      },
      header: ({ column, header }) => {
        const color = useMetricsStore.getState().getColorForMetric(key);
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
        return (
          <div className="relative w-full">
            <Button
              variant="ghost"
              style={{ color }}
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-start gap-1 rounded-none py-3"
              size="none"
              title={formattedLabel}
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium capitalize">
                {formattedLabel}
              </div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
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
            title={String(value)}
          >
            {formatValue(value)}
          </div>
        );
      },
    };
  });

const columnHelper = createColumnHelper<AttributeRow>();

export const createAttributeColumns = () => {
  return [
    columnHelper.accessor("key", {
      header: ({ column, header }) => {
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
        return (
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-start gap-1 rounded-none py-3"
              size="none"
              title="Attribute Key"
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium">Attribute Key</div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
        );
      },
      cell: (info) => {
        const key = info.getValue() as string;
        const color = useMetricsStore.getState().getColorForMetric(key);

        return (
          <div
            className="truncate px-2 text-left font-medium"
            style={{ color }}
            title={formatKeyLabel(key)}
          >
            {formatKeyLabel(key)}
          </div>
        );
      },
      size: 200,
      minSize: 80,
      maxSize: 400,
      sortDescFirst: true,
    }),
    columnHelper.accessor("isCentrality", {
      filterFn: booleanFilterFn,
      header: ({ column, header }) => {
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
        return (
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-center gap-1 rounded-none py-3"
              size="none"
              title="Centrality"
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium">Centrality</div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
        );
      },
      cell: (info) => (
        <div className="flex items-center justify-center">
          {info.getValue() ? (
            <Check className="h-4 w-4 text-blue-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ),
      size: 110,
      minSize: 80,
      maxSize: 150,
      sortDescFirst: true,
    }),
    columnHelper.accessor("isCommunity", {
      filterFn: booleanFilterFn,
      header: ({ column, header }) => {
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
        return (
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-center gap-1 rounded-none py-3"
              size="none"
              title="Community"
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium">Community</div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
        );
      },
      cell: (info) => (
        <div className="flex items-center justify-center">
          {info.getValue() ? (
            <Check className="h-4 w-4 text-blue-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ),
      size: 110,
      minSize: 80,
      maxSize: 150,
      sortDescFirst: true,
    }),
    columnHelper.accessor("isNumeric", {
      filterFn: booleanFilterFn,
      header: ({ column, header }) => {
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
        return (
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-center gap-1 rounded-none py-3"
              size="none"
              title="Numeric"
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium">Numeric</div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
        );
      },
      cell: (info) => (
        <div className="flex items-center justify-center">
          {info.getValue() ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ),
      size: 100,
      minSize: 80,
      maxSize: 150,
      sortDescFirst: true,
    }),
    columnHelper.accessor("isCategory", {
      filterFn: booleanFilterFn,
      header: ({ column, header }) => {
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
        return (
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-center gap-1 rounded-none py-3"
              size="none"
              title="Categorical"
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium">Categorical</div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
        );
      },
      cell: (info) => (
        <div className="flex items-center justify-center">
          {info.getValue() ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ),
      size: 120,
      minSize: 80,
      maxSize: 180,
      sortDescFirst: true,
    }),
    columnHelper.accessor("isBoolean", {
      filterFn: booleanFilterFn,
      header: ({ column, header }) => {
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;

        return (
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-center gap-1 rounded-none py-3"
              size="none"
              title="Boolean"
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium">Boolean</div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
        );
      },
      cell: (info) => (
        <div className="flex items-center justify-center">
          {info.getValue() ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ),
      size: 100,
      minSize: 80,
      maxSize: 150,
      sortDescFirst: true,
    }),
    columnHelper.accessor("rangeLabel", {
      header: ({ column, header }) => {
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;

        return (
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-start gap-1 rounded-none py-3"
              size="none"
              title="Range"
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium">Range</div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
        );
      },
      cell: (info) => (
        <div
          className="truncate px-2 text-left text-sm text-muted-foreground"
          title={`${info.getValue()}`}
        >
          {info.getValue()}
        </div>
      ),
      size: 150,
      minSize: 100,
      maxSize: 300,
      sortDescFirst: true,
    }),
    columnHelper.accessor("uniqueValues", {
      header: ({ column, header }) => {
        let SortIcon = ArrowUpDown;
        if (column.getIsSorted() === "asc") SortIcon = ArrowUp;
        if (column.getIsSorted() === "desc") SortIcon = ArrowDown;
        return (
          <div className="relative flex items-center">
            <Button
              variant="ghost"
              onClick={column.getToggleSortingHandler()}
              className="flex w-full items-center justify-start gap-1 rounded-none py-3"
              size="none"
              title="Unique Values"
            >
              <SortIcon className="h-4 w-4 shrink-0" />
              <div className="truncate text-sm font-medium">Unique Values</div>
            </Button>
            <div
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={`absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none bg-border opacity-0 transition-opacity select-none hover:opacity-100 ${
                header.column.getIsResizing() ? "bg-primary opacity-100" : ""
              }`}
            />
          </div>
        );
      },
      cell: (info) => (
        <div
          className="truncate px-2 text-left text-sm text-muted-foreground"
          title={`${info.getValue()}`}
        >
          {info.getValue()}
        </div>
      ),
      size: 135,
      minSize: 100,
      maxSize: 200,
      sortDescFirst: true,
    }),
  ];
};
