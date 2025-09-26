import type { ContextType, ViewType } from "@/features/center-view/CenterView";
import DataTable from "@/features/center-view/components/DataTable/DataTable";
import NodeLinkDiagram from "@/features/center-view/components/NodeLinkDiagram/NodeLinkDiagram";
import RadialChart from "@/features/center-view/components/RadialChart/RadialChart";
import type { CombinedData } from "@/types/network";
import type { SortingState } from "@tanstack/react-table";
import { forwardRef, useImperativeHandle, useRef } from "react";

export interface ViewRendererRef {
  resetRadialZoom: () => void;
  resetNodeLinkZoom: () => void;
}

interface ViewRendererProps {
  view: ViewType;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onContextMenuTarget: (target: ContextType, data?: any) => void;
  sortedData: CombinedData[];
  dataMap: Map<string, CombinedData>;
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
}

const ViewRenderer = forwardRef<ViewRendererRef, ViewRendererProps>(
  (
    {
      view,
      containerRef,
      onContextMenuTarget,
      sortedData,
      dataMap,
      sorting,
      onSortingChange,
    },
    ref,
  ) => {
    const radialResetRef = useRef<() => void>(null);
    const nodeLinkResetRef = useRef<() => void>(null);

    useImperativeHandle(ref, () => ({
      resetRadialZoom: () => radialResetRef.current?.(),
      resetNodeLinkZoom: () => nodeLinkResetRef.current?.(),
    }));

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
            containerRef={containerRef}
            ref={radialResetRef}
            combinedData={sortedData}
            combinedDataMap={dataMap}
            onContextMenuTarget={onContextMenuTarget}
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
            combinedDataMap={dataMap}
            onContextMenuTarget={onContextMenuTarget}
          />
        </div>

        {view === "data-table" && (
          <div className="absolute inset-0">
            <DataTable
              combinedData={sortedData}
              sorting={sorting}
              onSortingChange={onSortingChange}
              onContextMenuTarget={onContextMenuTarget}
            />
          </div>
        )}
      </>
    );
  },
);

ViewRenderer.displayName = "ViewRenderer";

export default ViewRenderer;
