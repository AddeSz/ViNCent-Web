import type { ViewType } from "@/App";
import DataSummary from "@/components/DataSummary";
import { TimestepSlider } from "@/components/TimeStepSlider";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { FullData, Network, NodeChange } from "@/types/network";
import { useRef, useState } from "react";
import DataTable from "./DataTable/DataTable";
import NodeLinkDiagram from "./NodeLinkDiagram/NodeLinkDiagram";
import RadialChart from "./RadialChart/RadialChart";
import ViewContextMenu from "./ViewRendering/ViewContextMenu";
import ViewToggle from "./ViewRendering/ViewToggle";

export type ContextType =
  | "radial"
  | "arc"
  | "node-link"
  | "data-table"
  | "label"
  | "node";

export type ContextMenuTarget = {
  type: ContextType;
  data?: any;
};

interface CenterViewProps {
  data: FullData[];
  dataMap: Map<string, FullData>;
  filteredNetwork: Network;
  changes: NodeChange;
  canPreview?: boolean | null;
  onPreview?: () => void;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  isViewLoaded: boolean;
}

const CenterView = ({
  data,
  dataMap,
  filteredNetwork,
  changes,
  canPreview = false,
  onPreview,
  view,
  onViewChange,
  isViewLoaded,
}: CenterViewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { sorting, handleSortingChange, handleContextMenuSort, sortedData } =
    useSortingLogic(data);
  const [contextMenuTarget, setContextMenuTarget] = useState<ContextMenuTarget>(
    { type: "radial" },
  );

  const timesteps = useTimelineStore((s) => s.timesteps);
  const timelines = timesteps.length > 0;

  const handleContextMenu = (target: ContextType, data?: any) => {
    setContextMenuTarget((prev) => {
      if (prev.type === target && prev.data === data) return prev;
      return { type: target, data };
    });
  };

  const rawDimensions = useResizeObserver(containerRef);
  const dimensions = useDebouncedValue(rawDimensions, 300);

  if (!isViewLoaded) return null;
  return (
    <div className="flex h-full flex-col">
      <ViewToggle view={view} onViewChange={onViewChange} />
      <ViewContextMenu
        view={view}
        onContextMenuSort={handleContextMenuSort}
        contextMenuTarget={contextMenuTarget}
        sorting={sorting}
        canPreview={canPreview}
        onPreview={onPreview}
      >
        <div
          ref={containerRef}
          className="relative h-full w-full overflow-hidden bg-card"
        >
          <div
            className={`absolute inset-0 ${
              view === "radial"
                ? "pointer-events-auto block"
                : "pointer-events-none hidden"
            }`}
          >
            <RadialChart
              key="radial-chart"
              dimensions={dimensions}
              data={sortedData}
              dataMap={dataMap}
              changes={changes}
              links={filteredNetwork.links}
              isViewActive={view === "radial"}
              handleContextMenu={handleContextMenu}
            />
          </div>
          <div
            className={`absolute inset-0 ${
              view === "node-link"
                ? "pointer-events-auto block"
                : "pointer-events-none hidden"
            }`}
          >
            <NodeLinkDiagram
              key="nodeLink-chart"
              dimensions={dimensions}
              filteredNetwork={filteredNetwork}
              dataMap={dataMap}
              handleContextMenu={handleContextMenu}
              changes={changes}
              isViewActive={view === "node-link"}
            />
          </div>

          {view === "data-table" && (
            <div className="absolute inset-0">
              <DataTable
                key="data-table-component"
                data={sortedData}
                sorting={sorting}
                onSortingChange={handleSortingChange}
                handleContextMenu={handleContextMenu}
              />
            </div>
          )}
          {view !== "data-table" && (
            <>
              <div className="pointer-events-none absolute bottom-2 left-2">
                <DataSummary
                  filteredNetwork={filteredNetwork}
                  dataMap={dataMap}
                />
              </div>

              {canPreview && onPreview && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                  <Button
                    onClick={onPreview}
                    size="sm"
                    variant="outline"
                    className="pointer-events-auto shadow-lg"
                  >
                    Remove Preview
                  </Button>
                </div>
              )}

              {timelines && (
                <div className="pointer-events-none absolute right-2 bottom-2">
                  <div className="pointer-events-auto w-54 rounded-lg border bg-background px-2 py-1 shadow-lg">
                    <TimestepSlider />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ViewContextMenu>
    </div>
  );
};

export default CenterView;
