import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/shadcnUI/context-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnUI/toggle-group";
import { useEffect, useRef, useState } from "react";

import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import type { CombinedData } from "@/types/network";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import DataTable from "./components/DataTable/DataTable";
import NodeLinkDiagram from "./components/NodeLinkDiagram/NodeLinkDiagram";
import RadialChart from "./components/RadialChart/RadialChart";
import { useCombinedData } from "./hooks/useCombinedData";

const VIEW_KEY = "center-view-mode";

const CenterView = () => {
  const [view, setView] = useState<"radial" | "node-link" | "data-table">(
    "radial",
  );
  const [isViewLoaded, setIsViewLoaded] = useState(false);
  const clearSelection = useNetworkStore((s) => s.clearSelection);
  const centralityKeys = useCentralityStore((s) => s.enabledCentralityKeys);
  const attributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const sortKey = useNetworkStore((s) => s.sortKey);
  const setSortKey = useNetworkStore((s) => s.setSortKey);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const { combinedData, combinedDataMap } = useCombinedData();
  const displayMode = useChartSettings((s) => s.displayMode);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const radialResetRef = useRef<() => void>(null);
  const nodeLinkResetRef = useRef<() => void>(null);

  const [sorting, setSorting] = useState<SortingState>(
    sortKey !== "none" ? [{ id: sortKey, desc: false }] : [],
  );

  const [sortedCombinedData, setSortedCombinedData] = useState<CombinedData[]>(
    [],
  );

  const handleSortingChange = (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const newSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    setSorting(newSorting);

    if (newSorting.length === 0) setSortKey("none");
    else setSortKey(newSorting[0].id);
  };

  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_KEY);
    if (
      savedView === "radial" ||
      savedView === "node-link" ||
      savedView === "data-table"
    ) {
      setView(savedView);
    }
    setIsViewLoaded(true);
  }, []);

  useEffect(() => {
    if (isViewLoaded) {
      localStorage.setItem(VIEW_KEY, view);
    }
  }, [view, isViewLoaded]);

  if (!isViewLoaded) return null;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b-2 border-border">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(val) =>
            val && setView(val as "radial" | "node-link" | "data-table")
          }
          className="rounded-l-none border-r-2 bg-card"
        >
          <ToggleGroupItem
            value="radial"
            className="w-30"
            aria-label="Toggle radial view"
          >
            Radial View
          </ToggleGroupItem>
          <ToggleGroupItem
            value="node-link"
            className="w-30"
            aria-label="Toggle node-link view"
          >
            Node-Link View
          </ToggleGroupItem>
          <ToggleGroupItem
            value="data-table"
            className="w-30"
            aria-label="Toggle data-table view"
          >
            Data Table View
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={containerRef}
            className="relative flex-grow overflow-hidden bg-card"
          >
            <div
              className={`absolute inset-0 transition-opacity duration-200 ${
                view === "radial"
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <RadialChart
                containerRef={containerRef}
                ref={radialResetRef}
                combinedData={sortedCombinedData}
                combinedDataMap={combinedDataMap}
              />
            </div>

            <div
              className={`absolute inset-0 transition-opacity duration-200 ${
                view === "node-link"
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <NodeLinkDiagram
                containerRef={containerRef}
                ref={nodeLinkResetRef}
                combinedDataMap={combinedDataMap}
              />
            </div>

            <div
              className={`absolute inset-0 transition-opacity duration-200 ${
                view === "data-table"
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <DataTable
                combinedData={combinedData}
                sorting={sorting}
                onSortingChange={handleSortingChange}
                onSortedDataChange={setSortedCombinedData}
              />
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem
            onSelect={() => {
              if (view === "radial") radialResetRef.current?.();
              else if (view === "node-link") nodeLinkResetRef.current?.();
            }}
          >
            Reset Zoom
          </ContextMenuItem>

          <ContextMenuItem onSelect={clearSelection}>
            Reset Selection
          </ContextMenuItem>

          {view === "radial" && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>Sort</ContextMenuSubTrigger>
              <ContextMenuSubContent className="overflow-y-auto">
                <ContextMenuRadioGroup
                  value={
                    centralityKeys.includes(sortKey) ||
                    attributeKeys.includes(sortKey)
                      ? sortKey
                      : "none"
                  }
                  onValueChange={(val) => {
                    setSortKey(val);

                    if (val === "none") {
                      setSorting([]);
                    } else {
                      setSorting([{ id: val, desc: true }]);
                    }
                  }}
                >
                  <ContextMenuRadioItem value="none">None</ContextMenuRadioItem>

                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Centralities</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                      {centralityKeys.map((key) => (
                        <ContextMenuRadioItem
                          key={key}
                          value={key}
                          disabled={displayMode === "attributes"}
                        >
                          <span style={{ color: getColorForKey(key) }}>
                            {formatKeyLabel(key)}
                          </span>
                        </ContextMenuRadioItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>

                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Attributes</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                      {attributeKeys.map((key) => (
                        <ContextMenuRadioItem
                          key={key}
                          value={key}
                          disabled={displayMode === "centrality"}
                        >
                          <span style={{ color: getColorForKey(key) }}>
                            {formatKeyLabel(key)}
                          </span>
                        </ContextMenuRadioItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          {view === "node-link" && (
            <ContextMenuItem
              onSelect={() => {
                console.log("cluster clicked");
              }}
            >
              Cluster
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default CenterView;
