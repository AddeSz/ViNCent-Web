import type { ViewType } from "@/App";
import DataSummary from "@/components/DataSummary";
import { TimestepSlider } from "@/components/TimeStepSlider";
import { Button } from "@/components/ui/button";
import type { ContextType } from "@/features/center-view/CenterView";
import DataTable from "@/features/center-view/DataTable/DataTable";
import NodeLinkDiagram from "@/features/center-view/NodeLinkDiagram/NodeLinkDiagram";
import RadialChart from "@/features/center-view/RadialChart/RadialChart";
import { useTimelineStore } from "@/stores/useTimelineStore";
import type { FullData, Network, NodeChange } from "@/types/network";
import type { SortingState } from "@tanstack/react-table";

interface ViewRendererProps {
  view: ViewType;
  dimensions: DOMRectReadOnly | null;
  onContextMenuTarget: (target: ContextType, data?: any) => void;
  data: FullData[];
  dataMap: Map<string, FullData>;
  filteredNetwork: Network;
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  lastChanges: NodeChange | null;
  canPreview: boolean | null;
  onPreview?: () => void;
}

const ViewRenderer = ({
  view,
  dimensions,
  onContextMenuTarget,
  data,
  dataMap,
  filteredNetwork,
  sorting,
  onSortingChange,
  lastChanges,
  canPreview = false,
  onPreview,
}: ViewRendererProps) => {
  const timesteps = useTimelineStore((s) => s.timesteps);
  const timelines = timesteps.length > 0;

  return (
    <>
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          view === "radial"
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <RadialChart
          dimensions={dimensions}
          data={data}
          dataMap={dataMap}
          onContextMenuTarget={onContextMenuTarget}
          lastChanges={lastChanges}
          links={filteredNetwork.links}
        />

        <div className="pointer-events-none absolute bottom-2 left-2">
          <DataSummary filteredNetwork={filteredNetwork} dataMap={dataMap} />
        </div>

        {canPreview && onPreview && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <Button
              onClick={onPreview}
              size="sm"
              variant="outline"
              className="pointer-events-auto shadow-lg"
            >
              Remove Preview Nodes
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
      </div>

      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          view === "node-link"
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <NodeLinkDiagram
          dimensions={dimensions}
          data={filteredNetwork}
          dataMap={dataMap}
          onContextMenuTarget={onContextMenuTarget}
        />

        <div className="pointer-events-none absolute bottom-2 left-2">
          <DataSummary filteredNetwork={filteredNetwork} dataMap={dataMap} />
        </div>

        {canPreview && onPreview && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <Button
              onClick={onPreview}
              size="sm"
              variant="outline"
              className="pointer-events-auto shadow-lg"
            >
              Remove Preview Nodes
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
      </div>

      {view === "data-table" && (
        <div className="absolute inset-0">
          <DataTable
            data={data}
            sorting={sorting}
            onSortingChange={onSortingChange}
            onContextMenuTarget={onContextMenuTarget}
          />
        </div>
      )}
    </>
  );
};

ViewRenderer.displayName = "ViewRenderer";

export default ViewRenderer;
