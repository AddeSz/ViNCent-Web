import type { ViewType } from "@/App";
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
} from "@/components/ui/context-menu";
import type { ContextMenuTarget } from "@/features/center-view/CenterView";
import { useGetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useKeys } from "@/hooks/useKeys";
import { useFilterStore } from "@/stores/useFilterStore";
import { useInteractionStore } from "@/stores/useInteractionStore";
import { handleHighlight } from "@/utils/ColorHelper";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ViewContextMenuProps {
  view: ViewType;
  onContextMenuSort: (val: string) => void;
  children: React.ReactNode;
  contextMenuTarget: ContextMenuTarget;
  sortingState: SortingState;
  canConfirm: boolean;
  confirmRemovals: () => void;
}

const ViewContextMenu = ({
  view,
  onContextMenuSort,
  children,
  contextMenuTarget,
  sortingState,
  canConfirm,
  confirmRemovals,
}: ViewContextMenuProps) => {
  const clearSelection = useInteractionStore((s) => s.clearSelection);
  const resetRadialZoom = useInteractionStore((s) => s.resetRadialZoom);
  const resetNodeLinkZoom = useInteractionStore((s) => s.resetNodeLinkZoom);
  const setHoveredNode = useInteractionStore((s) => s.setHoveredNode);
  const hoveredNode = useInteractionStore((s) => s.hoveredNode);
  const sortKey = useInteractionStore((s) => s.sortKey);
  const selectedNodes = useInteractionStore((s) => s.selectedNodes);
  const hideNode = useFilterStore((s) => s.hideNode);
  const hiddenNodes = useFilterStore((s) => s.hiddenNodes);
  const toggleMetricsKey = useFilterStore((s) => s.toggleMetricsKey);
  const hideSelection = useFilterStore((s) => s.hideSelection);
  const restoreAllNodes = useFilterStore((s) => s.restoreAllNodes);

  const getColorForMetric = useGetColorForMetric();
  const { allNodeCentralityKeys, allNodeAttributeKeys, allNodeCommunityKeys } =
    useKeys();

  const handleResetZoom = () => {
    if (view === "radial") {
      resetRadialZoom();
    } else if (view === "node-link") {
      resetNodeLinkZoom();
    }
  };

  const hiddenCount = hiddenNodes.size;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {(contextMenuTarget.type === "radial" ||
          contextMenuTarget.type === "node-link") && (
          <>
            <ContextMenuItem
              onSelect={handleResetZoom}
              className="cursor-pointer"
            >
              Reset Zoom
            </ContextMenuItem>
            {hoveredNode && (
              <ContextMenuItem
                onSelect={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                Clear Hover
              </ContextMenuItem>
            )}
          </>
        )}

        {(contextMenuTarget.type === "radial" ||
          contextMenuTarget.type === "node-link" ||
          contextMenuTarget.type === "data-table") &&
          selectedNodes.size > 0 && (
            <>
              <ContextMenuItem
                onSelect={clearSelection}
                className="cursor-pointer"
              >
                Clear Selection
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={hideSelection}
                className="cursor-pointer"
              >
                <span>Hide Selected Nodes ({selectedNodes.size})</span>
              </ContextMenuItem>
            </>
          )}

        {contextMenuTarget.type === "arc" && (
          <>
            <ContextMenuItem
              onSelect={() => handleHighlight(contextMenuTarget.data.id, true)}
              className="cursor-pointer"
            >
              {selectedNodes.has(contextMenuTarget.data.id)
                ? "Deselect Node"
                : "Select Node"}
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => hideNode(contextMenuTarget.data.id)}
              className="cursor-pointer"
            >
              <p>
                <span className="text-red-500">Hide </span>
                <span>Node</span>
              </p>
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => onContextMenuSort(contextMenuTarget.data.key)}
            >
              <div className="flex w-full cursor-pointer items-center justify-between gap-1">
                <span>
                  Order By{" "}
                  <span
                    style={{
                      color: getColorForMetric(
                        contextMenuTarget.data.key,
                        contextMenuTarget.data.value,
                      ),
                    }}
                  >
                    {formatKeyLabel(contextMenuTarget.data.key)}
                  </span>
                </span>

                {sortingState[0]?.id === contextMenuTarget.data.key && (
                  <>
                    {sortingState[0].desc ? (
                      <ArrowDown size={14} />
                    ) : (
                      <ArrowUp size={14} />
                    )}
                  </>
                )}
              </div>
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                const key = contextMenuTarget.data.key;
                toggleMetricsKey(key, false);
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <span className="text-red-500">Disable</span>
                <span
                  style={{
                    color: getColorForMetric(
                      contextMenuTarget.data.key,
                      contextMenuTarget.data.value,
                    ),
                  }}
                >
                  {formatKeyLabel(contextMenuTarget.data.key)}
                </span>
              </div>
            </ContextMenuItem>
          </>
        )}

        {(contextMenuTarget.type === "label" ||
          contextMenuTarget.type === "node") && (
          <>
            <ContextMenuItem
              onSelect={() => {
                handleHighlight(contextMenuTarget.data, true);
              }}
              className="cursor-pointer"
            >
              {selectedNodes.has(contextMenuTarget.data)
                ? "Deselect Node"
                : "Select Node"}
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => hideNode(contextMenuTarget.data)}
              className="cursor-pointer text-red-500"
            >
              Hide Node
            </ContextMenuItem>
          </>
        )}

        {contextMenuTarget.type === "radial" && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Order By</ContextMenuSubTrigger>
            <ContextMenuSubContent className="overflow-y-auto">
              <ContextMenuRadioGroup
                value={sortKey || "none"}
                onValueChange={onContextMenuSort}
              >
                <ContextMenuRadioItem value="none" className="cursor-pointer">
                  None
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="label" className="cursor-pointer">
                  Label
                </ContextMenuRadioItem>

                {allNodeCentralityKeys.length > 0 && (
                  <ContextMenuSub>
                    <ContextMenuSubTrigger
                      className={
                        allNodeCentralityKeys.includes(sortKey || "")
                          ? "text-blue-500"
                          : ""
                      }
                    >
                      Centralities
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                      {allNodeCentralityKeys.map((key) => {
                        const isSorted = sortingState[0]?.id === key;
                        const desc = sortingState[0]?.desc;
                        return (
                          <ContextMenuRadioItem
                            key={key}
                            value={key}
                            className="cursor-pointer"
                          >
                            <div className="flex w-full items-center justify-between gap-1">
                              <span style={{ color: getColorForMetric(key) }}>
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
                )}

                {allNodeAttributeKeys.length > 0 && (
                  <ContextMenuSub>
                    <ContextMenuSubTrigger
                      className={
                        allNodeAttributeKeys.includes(sortKey || "")
                          ? "text-blue-500"
                          : ""
                      }
                    >
                      Attributes
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                      {allNodeAttributeKeys.map((key) => {
                        const isSorted = sortingState[0]?.id === key;
                        const desc = sortingState[0]?.desc;
                        return (
                          <ContextMenuRadioItem
                            key={key}
                            value={key}
                            className="cursor-pointer"
                          >
                            <div className="flex w-full items-center justify-between gap-1">
                              <span style={{ color: getColorForMetric(key) }}>
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
                )}

                {allNodeCommunityKeys.length > 0 && (
                  <ContextMenuSub>
                    <ContextMenuSubTrigger
                      className={
                        allNodeCommunityKeys.includes(sortKey || "")
                          ? "text-blue-500"
                          : ""
                      }
                    >
                      Community
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                      {allNodeCommunityKeys.map((key) => {
                        const isSorted = sortingState[0]?.id === key;
                        const desc = sortingState[0]?.desc;
                        return (
                          <ContextMenuRadioItem
                            key={key}
                            value={key}
                            className="cursor-pointer"
                          >
                            <div className="flex w-full items-center justify-between gap-1">
                              <span style={{ color: getColorForMetric(key) }}>
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
                )}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {contextMenuTarget.type === "community" && (
          <>
            <ContextMenuItem
              onSelect={() => {
                const algorithmKey = contextMenuTarget.data.algorithmKey;
                onContextMenuSort(algorithmKey);
              }}
              className="cursor-pointer"
            >
              <div className="flex w-full items-center justify-between gap-1">
                <span>
                  Sort by{" "}
                  <span>
                    {formatKeyLabel(contextMenuTarget.data.algorithmKey)}
                  </span>{" "}
                  Communities
                </span>
                {sortingState[0]?.id ===
                  contextMenuTarget.data.algorithmKey && (
                  <>
                    {sortingState[0].desc ? (
                      <ArrowDown size={14} />
                    ) : (
                      <ArrowUp size={14} />
                    )}
                  </>
                )}
              </div>
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                contextMenuTarget.data.nodeIds.forEach((id: string) => {
                  handleHighlight(id, true);
                });
              }}
              className="cursor-pointer"
            >
              Select All Nodes ({contextMenuTarget.data.nodeIds.length})
            </ContextMenuItem>
          </>
        )}

        {(contextMenuTarget.type === "radial" ||
          contextMenuTarget.type === "node-link" ||
          contextMenuTarget.type === "data-table") &&
          hiddenCount > 0 && (
            <ContextMenuItem
              onSelect={() => restoreAllNodes()}
              className="cursor-pointer"
            >
              Restore Hidden Nodes ({hiddenCount})
            </ContextMenuItem>
          )}

        {canConfirm && (
          <ContextMenuItem onSelect={confirmRemovals}>
            <div className="flex items-center gap-2">Confirm Removals</div>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ViewContextMenu;
