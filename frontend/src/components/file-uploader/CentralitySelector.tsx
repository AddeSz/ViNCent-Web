import { Timer } from "lucide-react";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Spinner } from "../ui/spinner";
import CentralityCategory from "./CentralityCategory";
import type { CentralityDataBackend } from "./FileUploader";

interface CentralitySelectorProps {
  centralityData: CentralityDataBackend | null;
  isLoading?: boolean;
  error?: string | null;
  selectedCentralities: Set<string>;
  setSelectedCentralities: React.Dispatch<React.SetStateAction<Set<string>>>;
  expandedCategories: Set<string>;
  setExpandedCategories: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const CentralitySelector = ({
  centralityData,
  isLoading = false,
  error = null,
  selectedCentralities,
  setSelectedCentralities,
  expandedCategories,
  setExpandedCategories,
}: CentralitySelectorProps) => {
  const toggleCentrality = (centrality: string) => {
    setSelectedCentralities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(centrality)) {
        newSet.delete(centrality);
      } else {
        newSet.add(centrality);
      }
      return newSet;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const selectAllInCategory = (centralities: string[]) => {
    setSelectedCentralities((prev) => {
      const newSet = new Set(prev);
      centralities.forEach((c) => newSet.add(c));
      return newSet;
    });
  };

  const deselectAllInCategory = (centralities: string[]) => {
    setSelectedCentralities((prev) => {
      const newSet = new Set(prev);
      centralities.forEach((c) => newSet.delete(c));
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Collapsible>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Available Centralities</p>
            <div className="flex gap-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={isLoading}
                >
                  <Timer className="mr-1 h-3 w-3" />
                  Performance Guide
                </Button>
              </CollapsibleTrigger>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  centralityData &&
                  setSelectedCentralities(new Set(centralityData.all))
                }
                className="h-7 text-xs"
                disabled={isLoading || !centralityData}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCentralities(new Set())}
                className="h-7 text-xs"
                disabled={isLoading || !centralityData}
              >
                Clear
              </Button>
            </div>
          </div>
          <CollapsibleContent className="pt-2">
            <PerformanceLegend />
          </CollapsibleContent>
        </Collapsible>

        <div className="min-x-0 scrollbar-thin max-h-[330px] min-h-[190px] w-full space-y-2 overflow-y-auto rounded-md border bg-muted/50 p-2">
          {isLoading ? (
            <div className="flex h-[170px] items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : error ? (
            <div className="flex h-[170px] flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Failed to load centralities
              </p>
              <p className="text-xs text-destructive">{error}</p>
            </div>
          ) : centralityData ? (
            Object.entries(centralityData.categories).map(
              ([category, centralities]) => (
                <CentralityCategory
                  key={category}
                  category={category}
                  centralities={centralities}
                  selectedCentralities={selectedCentralities}
                  expandedCategories={expandedCategories}
                  centralityData={centralityData}
                  toggleCategory={toggleCategory}
                  selectAllInCategory={selectAllInCategory}
                  deselectAllInCategory={deselectAllInCategory}
                  toggleCentrality={toggleCentrality}
                />
              ),
            )
          ) : (
            <div className="flex h-[170px] items-center justify-center text-sm text-muted-foreground">
              Failed to load centralities
            </div>
          )}
        </div>

        {centralityData && (
          <p className="text-xs text-muted-foreground">
            {selectedCentralities.size} of {centralityData.all.length} selected
          </p>
        )}
      </div>
    </div>
  );
};

const PerformanceLegend = () => (
  <div className="space-y-1 rounded-md border bg-muted/30 px-3 py-2 text-xs">
    <p className="font-medium">Performance Guide (4K nodes/10K edges):</p>
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Timer className="h-3 w-3 text-green-500" />
        <span className="font-medium text-green-500">Fast:</span>
        <span className="text-muted-foreground">{"<"} 5 seconds</span>
      </div>
      <div className="flex items-center gap-2">
        <Timer className="h-3 w-3 text-yellow-500" />
        <span className="font-medium text-yellow-500">Moderate:</span>
        <span className="text-muted-foreground">5-60 seconds</span>
      </div>
      <div className="flex items-center gap-2">
        <Timer className="h-3 w-3 text-orange-500" />
        <span className="font-medium text-orange-500">Slow:</span>
        <span className="text-muted-foreground">1-5 minutes</span>
      </div>
      <div className="flex items-center gap-2">
        <Timer className="h-3 w-3 text-red-500" />
        <span className="font-medium text-red-500">Very Slow:</span>
        <span className="text-muted-foreground">{"> 30 minutes"}</span>
      </div>
    </div>
    <p className="text-[10px] text-muted-foreground italic">
      Times scale with network size. Larger networks take longer.
    </p>
  </div>
);

export default CentralitySelector;
