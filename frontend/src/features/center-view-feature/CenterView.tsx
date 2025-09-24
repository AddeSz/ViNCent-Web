import { useRef, useState } from "react";
import { useViewPersistence } from "./components/ViewRendering/useViewPersistence";
import ViewContextMenu from "./components/ViewRendering/ViewContextMenu";
import ViewRenderer, {
  type ViewRendererRef,
} from "./components/ViewRendering/ViewRenderer";
import ViewToggle from "./components/ViewRendering/ViewToggle";
import { useSortingLogic } from "./hooks/useSortingLogic";

const VIEW_KEY = "center-view-mode";
export type ViewType = "radial" | "node-link" | "data-table";
export type ContextType = "radial" | "arc" | "node-link" | "data-table";
export type ContextMenuTarget = {
  type: ContextType;
  data?: any;
};

const CenterView = () => {
  const { view, setView, isViewLoaded } = useViewPersistence(VIEW_KEY);
  const { sorting, handleSortingChange, handleContextMenuSort } =
    useSortingLogic();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRendererRef = useRef<ViewRendererRef>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<ContextMenuTarget>(
    {
      type: "radial",
    },
  );

  const handleContextMenuTarget = (target: ContextType, data?: any) => {
    setContextMenuTarget((prev) => {
      if (prev.type === target && prev.data === data) return prev;
      return { type: target, data };
    });
  };

  if (!isViewLoaded) return null;
  return (
    <div className="flex h-full flex-col">
      <ViewToggle view={view} onViewChange={setView} />

      <ViewContextMenu
        view={view}
        viewRendererRef={viewRendererRef}
        onContextMenuSort={handleContextMenuSort}
        contextMenuTarget={contextMenuTarget}
        sorting={sorting}
      >
        <div
          ref={containerRef}
          className="relative flex-grow overflow-hidden bg-card"
        >
          <ViewRenderer
            ref={viewRendererRef}
            view={view}
            containerRef={containerRef}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            onContextMenuTarget={handleContextMenuTarget}
          />
        </div>
      </ViewContextMenu>
    </div>
  );
};

export default CenterView;
