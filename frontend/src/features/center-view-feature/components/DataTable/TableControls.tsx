import { ChevronDown } from "lucide-react";
import { type Table } from "@tanstack/react-table";
import { Button } from "@/components/shadcnUI/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shadcnUI/dropdown-menu";
import { Input } from "@/components/shadcnUI/input";

interface TableControlsProps<T> {
  table: Table<T>;
  firstColumnKey: string;
}

export const TableControls = <T,>({
  table,
  firstColumnKey,
}: TableControlsProps<T>) => (
  <div className="flex items-center py-4">
    <Input
      placeholder="Filter..."
      value={
        (table.getColumn(firstColumnKey)?.getFilterValue() as string) ?? ""
      }
      onChange={(event) =>
        table.getColumn(firstColumnKey)?.setFilterValue(event.target.value)
      }
      className="max-w-sm"
    />
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Columns <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
