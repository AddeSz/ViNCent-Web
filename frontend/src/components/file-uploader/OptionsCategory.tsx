import { formatKeyLabel } from "@/utils/utils";
import { ChevronDown, Timer } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Label } from "../ui/label";
import type { OptionsDataBackend } from "./FileUploader";

interface OptionsCategoryProps {
  category: string;
  options: string[];
  selectedOptions: Set<string>;
  expandedCategories: Set<string>;
  optionsData: OptionsDataBackend;
  toggleCategory: (category: string) => void;
  selectAllInCategory: (options: string[]) => void;
  deselectAllInCategory: (options: string[]) => void;
  toggleOption: (option: string) => void;
}

const OptionsCategory = ({
  category,
  options,
  selectedOptions,
  expandedCategories,
  optionsData,
  toggleCategory,
  selectAllInCategory,
  deselectAllInCategory,
  toggleOption,
}: OptionsCategoryProps) => {
  const isExpanded = expandedCategories.has(category);

  const isFullySelected = options.every((m) => selectedOptions.has(m));
  const selectedCount = options.filter((m) => selectedOptions.has(m)).length;
  const isPartiallySelected =
    selectedCount > 0 && selectedCount < options.length;

  const countDisplay =
    selectedCount === options.length
      ? options.length
      : `${selectedCount}/${options.length}`;

  const getCategoryPerformance = (): string | null => {
    const selectedInCategory = options.filter((m) => selectedOptions.has(m));
    if (selectedInCategory.length === 0) return null;

    const performanceLevels = selectedInCategory
      .map((m) => optionsData?.performance[m])
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
                selectAllInCategory(options);
              } else {
                deselectAllInCategory(options);
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
        {options.map((option) => {
          const requirement = optionsData.requirements[option];
          const performance = optionsData.performance[option];
          const description = optionsData.descriptions?.[option];
          return (
            <div
              key={option}
              className="flex items-center space-x-2 rounded py-0.5 pl-6 hover:bg-accent/50"
            >
              <Checkbox
                id={option}
                checked={selectedOptions.has(option)}
                onCheckedChange={() => toggleOption(option)}
                className="shrink-0"
              />
              <Label
                htmlFor={option}
                className="min-w-0 flex-1 cursor-pointer text-xs"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span>{formatKeyLabel(option)}</span>
                    {requirement && (
                      <span className="text-[10px] text-muted-foreground italic">
                        ({requirement})
                      </span>
                    )}
                  </div>
                  {description && (
                    <span className="text-[10px] text-muted-foreground">
                      {description}
                    </span>
                  )}
                </div>
              </Label>
              {performance && (
                <span
                  className={`ml-auto flex shrink-0 items-center space-x-1 pr-2 text-[10px] italic ${performanceColor(
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

export default OptionsCategory;
