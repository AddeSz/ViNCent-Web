import type { ViewType } from "@/App";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import type { FullData, Network, NodeChange } from "@/types/network";
import { useRef, useState } from "react";
import ViewContextMenu from "./ViewRendering/ViewContextMenu";
import ViewRenderer from "./ViewRendering/ViewRenderer";
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
  lastChanges: NodeChange | null;
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
  lastChanges,
  canPreview = false,
  onPreview,
  view,
  onViewChange,
  isViewLoaded,
}: CenterViewProps) => {
  const { sorting, handleSortingChange, handleContextMenuSort, sortedData } =
    useSortingLogic(data);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<ContextMenuTarget>(
    { type: "radial" },
  );

  const handleContextMenuTarget = (target: ContextType, data?: any) => {
    setContextMenuTarget((prev) => {
      if (prev.type === target && prev.data === data) return prev;
      return { type: target, data };
    });
  };

  const rawDimensions = useResizeObserver(containerRef);
  const dimensions = useDebouncedValue(rawDimensions, 200);

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
          className="relative flex-grow overflow-hidden bg-card"
        >
          <ViewRenderer
            view={view}
            dimensions={dimensions}
            data={sortedData}
            dataMap={dataMap}
            filteredNetwork={filteredNetwork}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onContextMenuTarget={handleContextMenuTarget}
            lastChanges={lastChanges}
            canPreview={canPreview}
            onPreview={onPreview}
          />
        </div>
      </ViewContextMenu>
    </div>
  );
};

export default CenterView;
