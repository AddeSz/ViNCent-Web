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
import type {
  ContextMenuTarget,
  ViewType,
} from "@/features/center-view/CenterView";
import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { handleHighlight } from "@/utils/ColorHelper";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ViewRendererRef } from "./ViewRenderer";

interface ViewContextMenuProps {
  view: ViewType;
  viewRendererRef: React.RefObject<ViewRendererRef | null>;
  onContextMenuSort: (val: string) => void;
  children: React.ReactNode;
  contextMenuTarget: ContextMenuTarget;
  sorting: SortingState;
}

const ViewContextMenu = ({
  view,
  viewRendererRef,
  onContextMenuSort,
  children,
  contextMenuTarget,
  sorting,
}: ViewContextMenuProps) => {
  const clearSelection = useNetworkStore((s) => s.clearSelection);
  const centralityKeys = useCentralityStore((s) => s.enabledCentralityKeys);
  const attributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const sortKey = useNetworkStore((s) => s.sortKey);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const displayMode = useChartSettings((s) => s.displayMode);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);

  const handleResetZoom = () => {
    if (view === "radial") {
      viewRendererRef.current?.resetRadialZoom();
    } else if (view === "node-link") {
      viewRendererRef.current?.resetNodeLinkZoom();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {contextMenuTarget.type !== "data-table" &&
          contextMenuTarget.type !== "arc" && (
            <ContextMenuItem onSelect={handleResetZoom}>
              Reset Zoom
            </ContextMenuItem>
          )}

        {contextMenuTarget.type !== "arc" && (
          <ContextMenuItem onSelect={clearSelection}>
            Reset Selection
          </ContextMenuItem>
        )}

        {contextMenuTarget.type === "arc" && (
          <>
            <ContextMenuItem
              onSelect={() => handleHighlight(contextMenuTarget.data.id, true)}
            >
              {selectedNodes.has(contextMenuTarget.data.id)
                ? "Deselect Node"
                : "Highlight Node"}
            </ContextMenuItem>

            <ContextMenuItem
              onSelect={() => onContextMenuSort(contextMenuTarget.data.key)}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <span>
                  Sort by{" "}
                  <span
                    style={{
                      color: getColorForKey(
                        contextMenuTarget.data.key,
                        contextMenuTarget.data.value,
                      ),
                    }}
                  >
                    {formatKeyLabel(contextMenuTarget.data.key)}
                  </span>
                </span>

                {sorting[0]?.id === contextMenuTarget.data.key && (
                  <>
                    {sorting[0].desc ? (
                      <ArrowDown size={14} />
                    ) : (
                      <ArrowUp size={14} />
                    )}
                  </>
                )}
              </div>
            </ContextMenuItem>
          </>
        )}

        {contextMenuTarget.type === "radial" && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Sort</ContextMenuSubTrigger>
            <ContextMenuSubContent className="overflow-y-auto">
              <ContextMenuRadioGroup
                value={
                  (centralityKeys.includes(sortKey) &&
                    displayMode !== "attributes") ||
                  (attributeKeys.includes(sortKey) &&
                    displayMode !== "centrality")
                    ? sortKey
                    : "none"
                }
                onValueChange={onContextMenuSort}
              >
                <ContextMenuRadioItem value="none">None</ContextMenuRadioItem>

                <ContextMenuSub>
                  <ContextMenuSubTrigger>Centralities</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                    {centralityKeys.map((key) => {
                      const isSorted = sorting[0]?.id === key;
                      const desc = sorting[0]?.desc;

                      return (
                        <ContextMenuRadioItem
                          key={key}
                          value={key}
                          disabled={displayMode === "attributes"}
                        >
                          <div className="flex w-full items-center justify-between gap-1">
                            <span style={{ color: getColorForKey(key) }}>
                              {formatKeyLabel(key)}
                            </span>
                            {isSorted &&
                              (desc ? (
                                <ArrowDown size={14} />
                              ) : (
                                <ArrowUp size={14} />
                              ))}
                          </div>
                        </ContextMenuRadioItem>
                      );
                    })}
                  </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSub>
                  <ContextMenuSubTrigger>Attributes</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                    {attributeKeys.map((key) => {
                      const isSorted = sorting[0]?.id === key;
                      const desc = sorting[0]?.desc;

                      return (
                        <ContextMenuRadioItem
                          key={key}
                          value={key}
                          disabled={displayMode === "centrality"}
                        >
                          <div className="flex w-full items-center justify-between gap-1">
                            <span style={{ color: getColorForKey(key) }}>
                              {formatKeyLabel(key)}
                            </span>
                            {isSorted &&
                              (desc ? (
                                <ArrowDown size={16} />
                              ) : (
                                <ArrowUp size={16} />
                              ))}
                          </div>
                        </ContextMenuRadioItem>
                      );
                    })}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {contextMenuTarget.type === "node-link" && (
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
  );
};

export default ViewContextMenu;
