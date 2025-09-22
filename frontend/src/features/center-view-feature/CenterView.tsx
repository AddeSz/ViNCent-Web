import type { CombinedData } from "@/types/network";
import { useRef, useState } from "react";
import { useViewPersistence } from "./components/ViewRendering/useViewPersistence";
import ViewContextMenu from "./components/ViewRendering/ViewContextMenu";
import ViewRenderer, {
  type ViewRendererRef,
} from "./components/ViewRendering/ViewRenderer";
import ViewToggle from "./components/ViewRendering/ViewToggle";
import { useCombinedData } from "./hooks/useCombinedData";
import { useSortingLogic } from "./hooks/useSortingLogic";

const VIEW_KEY = "center-view-mode";
export type ViewType = "radial" | "node-link" | "data-table";

const CenterView = () => {
  const { view, setView, isViewLoaded } = useViewPersistence(VIEW_KEY);
  const { combinedData, combinedDataMap } = useCombinedData();
  const { sorting, handleSortingChange, handleContextMenuSort } =
    useSortingLogic();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRendererRef = useRef<ViewRendererRef>(null);
  const [sortedCombinedData, setSortedCombinedData] = useState<CombinedData[]>(
    [],
  );

  if (!isViewLoaded) return null;
  return (
    <div className="flex h-full flex-col">
      <ViewToggle view={view} onViewChange={setView} />

      <ViewContextMenu
        view={view}
        viewRendererRef={viewRendererRef}
        onContextMenuSort={handleContextMenuSort}
      >
        <div
          ref={containerRef}
          className="relative flex-grow overflow-hidden bg-card"
        >
          <ViewRenderer
            ref={viewRendererRef}
            view={view}
            containerRef={containerRef}
            combinedData={combinedData}
            combinedDataMap={combinedDataMap}
            sortedCombinedData={sortedCombinedData}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onSortedDataChange={setSortedCombinedData}
          />
        </div>
      </ViewContextMenu>
    </div>
  );
};

export default CenterView;
