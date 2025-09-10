import { useRef, useState, useEffect } from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnUI/toggle-group";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
} from "@/components/shadcnUI/context-menu";

import RadialChart from "./components/RadialChart/RadialChart";
import NodeLinkDiagram from "./components/NodeLinkDiagram/NodeLinkDiagram";
import { useDataStore } from "@/hooks/useDataStore";

const VIEW_KEY = "center-view-mode";

const CenterView = () => {
  const [view, setView] = useState<"radial" | "node-link">("radial");
  const [isViewLoaded, setIsViewLoaded] = useState(false);
  const clearSelection = useDataStore((state) => state.clearSelection);
  const centralityKeys = useDataStore((state) => state.centralityKeys);
  const sortKey = useDataStore((state) => state.sortKey);
  const setSortKey = useDataStore((state) => state.setSortKey);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const radialResetRef = useRef<() => void>(null);
  const nodeLinkResetRef = useRef<() => void>(null);

  const formatKeyLabel = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_KEY);
    if (savedView === "radial" || savedView === "node-link") {
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
          onValueChange={(val) => val && setView(val as "radial" | "node-link")}
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
              <RadialChart containerRef={containerRef} ref={radialResetRef} />
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
              <ContextMenuSubContent>
                <ContextMenuRadioGroup
                  value={sortKey}
                  onValueChange={(val) => setSortKey(val)}
                >
                  <ContextMenuRadioItem value="default">
                    Default
                  </ContextMenuRadioItem>
                  {centralityKeys.map((key) => (
                    <ContextMenuRadioItem key={key} value={key}>
                      {formatKeyLabel(key)}
                    </ContextMenuRadioItem>
                  ))}
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
