import type { OptionMeta } from "@/api";
import { formatKeyLabel } from "@/utils/utils";
import { ChevronDown, Timer } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Label } from "../ui/label";

interface OptionsCategoryProps {
  category: string;
  options: OptionMeta[];
  selectedOptions: Set<string>;
  expandedCategories: Set<string>;
  toggleCategory: (category: string) => void;
  selectAllInCategory: (names: string[]) => void;
  deselectAllInCategory: (names: string[]) => void;
  toggleOption: (option: string) => void;
}

const OptionsCategory = ({
  category,
  options,
  selectedOptions,
  expandedCategories,
  toggleCategory,
  selectAllInCategory,
  deselectAllInCategory,
  toggleOption,
}: OptionsCategoryProps) => {
  const isExpanded = expandedCategories.has(category);
  const names = options.map((option) => option.name);

  const isFullySelected = options.every((option) =>
    selectedOptions.has(option.name),
  );
  const selectedCount = options.filter((option) =>
    selectedOptions.has(option.name),
  ).length;
  const isPartiallySelected =
    selectedCount > 0 && selectedCount < options.length;

  const countDisplay =
    selectedCount === options.length
      ? options.length
      : `${selectedCount}/${options.length}`;

  const getCategoryPerformance = (): string | null => {
    const selectedInCategory = options.filter((option) =>
      selectedOptions.has(option.name),
    );
    if (selectedInCategory.length === 0) return null;

    const performanceLevels = selectedInCategory
      .map((option) => option.performance)
      .filter((p): p is string => Boolean(p));

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
                selectAllInCategory(names);
              } else {
                deselectAllInCategory(names);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <CollapsibleTrigger className="flex h-full w-full min-w-0 flex-1 cursor-pointer items-center gap-1">
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-100 ${
                isExpanded ? "rotate-0" : "-rotate-90"
              }`}
            />
            <div className="flex items-baseline gap-1">
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
        {options.map((option) => (
          <div
            key={option.name}
            className="flex items-center space-x-2 rounded py-0.5 pl-6 hover:bg-accent/50"
          >
            <Checkbox
              id={option.name}
              checked={selectedOptions.has(option.name)}
              onCheckedChange={() => toggleOption(option.name)}
              className="shrink-0"
            />
            <Label
              htmlFor={option.name}
              className="min-w-0 flex-1 cursor-pointer text-xs"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span>{formatKeyLabel(option.name)}</span>
                  {option.requirement && (
                    <span className="text-[10px] text-muted-foreground italic">
                      ({option.requirement})
                    </span>
                  )}
                </div>
                {option.description && (
                  <span className="text-[10px] text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </div>
            </Label>
            {option.performance && (
              <span
                className={`ml-auto flex shrink-0 items-center space-x-1 pr-2 text-[10px] italic ${performanceColor(
                  option.performance,
                )}`}
              >
                <Timer className="h-3 w-3 shrink-0" />
                <span>{option.performance}</span>
              </span>
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OptionsCategory;
