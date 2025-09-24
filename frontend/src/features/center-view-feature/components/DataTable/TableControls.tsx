import { Button } from "@/components/shadcnUI/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shadcnUI/dropdown-menu";
import { Input } from "@/components/shadcnUI/input";
import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { formatKeyLabel } from "@/utils/utils";
import { type Table } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

interface TableControlsProps<T> {
  table: Table<T>;
  firstColumnKey: string;
}

const TableControls = <T,>({
  table,
  firstColumnKey,
}: TableControlsProps<T>) => {
  const displayMode = useChartSettings((s) => s.displayMode);

  const validFirstColumnKey = table
    .getAllColumns()
    .some((c) => c.id === firstColumnKey)
    ? firstColumnKey
    : (table.getAllColumns()[0]?.id ?? "");

  const allCentralityKeys = useCentralityStore((s) => s.centralityKeys);
  const enabledCentralityKeys = useCentralityStore(
    (s) => s.enabledCentralityKeys,
  );
  const toggleCentralityKey = useCentralityStore((s) => s.toggleCentralityKey);

  const allAttributeKeys = useAttributeStore((s) => s.attributeKeys);
  const enabledAttributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const toggleAttributeKey = useAttributeStore((s) => s.toggleAttributeKey);

  const isCentralityVisible =
    displayMode === "centrality" || displayMode === "both";

  const isAttributeVisible =
    displayMode === "attributes" || displayMode === "both";
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Columns <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isCentralityVisible &&
            allCentralityKeys.map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                className="capitalize"
                checked={enabledCentralityKeys.includes(key)}
                onCheckedChange={() => toggleCentralityKey(key)}
                onSelect={(event) => event.preventDefault()}
              >
                {formatKeyLabel(key)}
              </DropdownMenuCheckboxItem>
            ))}

          {isAttributeVisible &&
            allAttributeKeys.map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                className="capitalize"
                checked={enabledAttributeKeys.includes(key)}
                onCheckedChange={() => toggleAttributeKey(key)}
                onSelect={(event) => event.preventDefault()}
              >
                {formatKeyLabel(key)}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TableControls;
