import { formatKeyLabel } from "@/utils/utils";
import { ChevronDown, Timer } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Label } from "../ui/label";
import type { CentralityDataBackend } from "./FileUploader";

interface CentralityCategoryProps {
  category: string;
  centralities: string[];
  selectedCentralities: Set<string>;
  expandedCategories: Set<string>;
  centralityData: CentralityDataBackend;
  toggleCategory: (category: string) => void;
  selectAllInCategory: (centralities: string[]) => void;
  deselectAllInCategory: (centralities: string[]) => void;
  toggleCentrality: (centrality: string) => void;
}

const CentralityCategory = ({
  category,
  centralities,
  selectedCentralities,
  expandedCategories,
  centralityData,
  toggleCategory,
  selectAllInCategory,
  deselectAllInCategory,
  toggleCentrality,
}: CentralityCategoryProps) => {
  const isExpanded = expandedCategories.has(category);

  const isFullySelected = centralities.every((c) =>
    selectedCentralities.has(c),
  );
  const selectedCount = centralities.filter((c) =>
    selectedCentralities.has(c),
  ).length;
  const isPartiallySelected =
    selectedCount > 0 && selectedCount < centralities.length;

  const countDisplay =
    selectedCount === centralities.length
      ? centralities.length
      : `${selectedCount}/${centralities.length}`;

  const getCategoryPerformance = (): string | null => {
    const selectedInCategory = centralities.filter((c) =>
      selectedCentralities.has(c),
    );
    if (selectedInCategory.length === 0) return null;

    const performanceLevels = selectedInCategory
      .map((c) => centralityData?.performance[c])
      .filter(Boolean);

    if (performanceLevels.includes("Very slow")) return "Very slow";
    if (performanceLevels.includes("Slow")) return "Slow";
    if (performanceLevels.includes("Moderate")) return "Moderate";
    return "Fast";
  };

  const performanceColor = (p: string) => {
    switch (p.toLowerCase()) {
      case "fast":
        return "text-green-500";
      case "moderate":
        return "text-yellow-500";
      case "slow":
        return "text-orange-500";
      case "very slow":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const categoryPerf = getCategoryPerformance();

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => toggleCategory(category)}
    >
      <div className="flex h-7 items-center justify-between rounded-md border bg-muted/50 px-3 hover:bg-border/50">
        <div className="flex h-full w-full items-center gap-2">
          <Checkbox
            checked={
              isFullySelected
                ? true
                : isPartiallySelected
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) => {
              if (checked) {
                selectAllInCategory(centralities);
              } else {
                deselectAllInCategory(centralities);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <CollapsibleTrigger className="flex h-full w-full min-w-0 flex-1 cursor-pointer items-center gap-1">
            <ChevronDown
              className={`h-4 w-4 shrink-0 translate-y-px transition-transform duration-100 ${
                isExpanded ? "rotate-0" : "-rotate-90"
              }`}
            />
            <div className="flex -translate-y-px items-baseline gap-1">
              <span className="text-sm">{formatKeyLabel(category)}</span>
              <span className="text-xs text-muted-foreground">
                ({countDisplay})
              </span>
            </div>
          </CollapsibleTrigger>
          {categoryPerf && (
            <div
              className={`flex items-center gap-1 text-[10px] ${performanceColor(categoryPerf)}`}
            >
              <Timer className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
      <CollapsibleContent className="mt-1 min-w-0 space-y-1 overflow-hidden">
        {centralities.map((centrality) => {
          const requirement = centralityData.requirements[centrality];
          const performance = centralityData.performance[centrality];
          return (
            <div key={centrality} className="flex items-center space-x-2 pl-6">
              <Checkbox
                id={centrality}
                checked={selectedCentralities.has(centrality)}
                onCheckedChange={() => toggleCentrality(centrality)}
                className="shrink-0"
              />
              <Label
                htmlFor={centrality}
                className="min-w-0 flex-1 cursor-pointer truncate text-xs"
              >
                {formatKeyLabel(centrality)}
                {requirement && (
                  <span className="ml-1 text-[10px] text-muted-foreground italic">
                    ({requirement})
                  </span>
                )}
              </Label>
              {performance && (
                <span
                  className={`ml-auto flex shrink-0 items-center space-x-1 text-[10px] italic ${performanceColor(
                    performance,
                  )}`}
                >
                  <Timer className="h-3 w-3 shrink-0" />
                  <span>{performance}</span>
                </span>
              )}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CentralityCategory;
