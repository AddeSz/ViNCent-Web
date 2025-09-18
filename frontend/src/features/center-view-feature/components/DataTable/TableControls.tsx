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
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { formatKeyLabel } from "@/utils/utils";

interface TableControlsProps<T> {
  table: Table<T>;
  firstColumnKey: string;
  centralityKeys: string[];
  attributeKeys: string[];
}

export const TableControls = <T,>({
  table,
  firstColumnKey,
  centralityKeys,
  attributeKeys,
}: TableControlsProps<T>) => {
  const displayMode = useChartSettings((s) => s.displayMode);

  const enabledCentralityKeys = useCentralityStore(
    (s) => s.enabledCentralityKeys,
  );
  const toggleCentralityKey = useCentralityStore((s) => s.toggleCentralityKey);

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
          {isCentralityVisible &&
            centralityKeys.map((key) => (
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
            attributeKeys.map((key) => (
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
