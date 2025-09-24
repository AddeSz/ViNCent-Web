import type {
  ContextType,
  ViewType,
} from "@/features/center-view-feature/CenterView";
import DataTable from "@/features/center-view-feature/components/DataTable/DataTable";
import NodeLinkDiagram from "@/features/center-view-feature/components/NodeLinkDiagram/NodeLinkDiagram";
import RadialChart from "@/features/center-view-feature/components/RadialChart/RadialChart";
import type { CombinedData } from "@/types/network";
import type { SortingState } from "@tanstack/react-table";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useCombinedData } from "../../hooks/useCombinedData";

interface ViewRendererProps {
  view: ViewType;
  containerRef: React.RefObject<HTMLDivElement | null>;
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  onContextMenuTarget: (target: ContextType, data?: any) => void;
}

export interface ViewRendererRef {
  resetRadialZoom: () => void;
  resetNodeLinkZoom: () => void;
}

const ViewRenderer = forwardRef<ViewRendererRef, ViewRendererProps>(
  (
    { view, containerRef, sorting, onSortingChange, onContextMenuTarget },
    ref,
  ) => {
    const radialResetRef = useRef<() => void>(null);
    const nodeLinkResetRef = useRef<() => void>(null);
    const { combinedData, combinedDataMap } = useCombinedData();
    const [sortedCombinedData, setSortedCombinedData] = useState<
      CombinedData[]
    >([]);

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
            combinedDataMap={combinedDataMap}
            onContextMenuTarget={onContextMenuTarget}
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
            onContextMenuTarget={onContextMenuTarget}
            onSortedDataChange={setSortedCombinedData}
          />
        </div>
      </>
    );
  },
);
ViewRenderer.displayName = "ViewRenderer";

export default ViewRenderer;
