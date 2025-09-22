import type { ViewType } from "@/features/center-view-feature/CenterView";
import DataTable from "@/features/center-view-feature/components/DataTable/DataTable";
import NodeLinkDiagram from "@/features/center-view-feature/components/NodeLinkDiagram/NodeLinkDiagram";
import RadialChart from "@/features/center-view-feature/components/RadialChart/RadialChart";
import type { CombinedData } from "@/types/network";
import type { SortingState } from "@tanstack/react-table";
import { forwardRef, memo, useImperativeHandle, useRef } from "react";

interface ViewRendererProps {
  view: ViewType;
  containerRef: React.RefObject<HTMLDivElement | null>;
  combinedData: CombinedData[];
  combinedDataMap: Map<string, CombinedData>;
  sortedCombinedData: CombinedData[];
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  onSortedDataChange: (data: CombinedData[]) => void;
}

export interface ViewRendererRef {
  resetRadialZoom: () => void;
  resetNodeLinkZoom: () => void;
}

const ViewRenderer = memo(
  forwardRef<ViewRendererRef, ViewRendererProps>(
    (
      {
        view,
        containerRef,
        combinedData,
        combinedDataMap,
        sortedCombinedData,
        sorting,
        onSortingChange,
        onSortedDataChange,
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
              onSortingChange={onSortingChange}
              onSortedDataChange={onSortedDataChange}
            />
          </div>
        </>
      );
    },
  ),
);

ViewRenderer.displayName = "ViewRenderer";

export default ViewRenderer;
