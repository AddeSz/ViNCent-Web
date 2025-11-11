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
import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { handleHighlight } from "@/utils/ColorHelper";
import { formatKeyLabel } from "@/utils/utils";
import type { SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface ViewContextMenuProps {
  view: ViewType;
  onContextMenuSort: (val: string) => void;
  children: React.ReactNode;
  contextMenuTarget: ContextMenuTarget;
  sorting: SortingState;
  canPreview: boolean | null;
  onPreview?: () => void;
}

const ViewContextMenu = ({
  view,
  onContextMenuSort,
  children,
  contextMenuTarget,
  sorting,
  canPreview = false,
  onPreview,
}: ViewContextMenuProps) => {
  const clearSelection = useNetworkStore((s) => s.clearSelection);
  const resetRadialZoom = useNetworkStore((s) => s.resetRadialZoom);
  const resetNodeLinkZoom = useNetworkStore((s) => s.resetNodeLinkZoom);
  const setHoveredNode = useNetworkStore((s) => s.setHoveredNode);
  const hoveredNode = useNetworkStore((s) => s.hoveredNode);
  const { centralityKeys, attributeKeys } = useKeys();
  const sortKey = useNetworkStore((s) => s.sortKey);
  const getColorForMetric = useMetricsStore((s) => s.getColorForMetric);
  const displayMode = useSettingsStore((s) => s.displaySettings.displayMode);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const hideNode = useNetworkStore((s) => s.hideNode);
  const hiddenCount = useNetworkStore((s) => s.hiddenNodes.size);
  const toggleMetricsKey = useMetricsStore((s) => s.toggleMetricsKey);
  const handleResetZoom = () => {
    if (view === "radial") {
      resetRadialZoom();
    } else if (view === "node-link") {
      resetNodeLinkZoom();
    }
  };

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
          contextMenuTarget.type === "data-table") && (
          <>
            <ContextMenuItem
              onSelect={clearSelection}
              className="cursor-pointer"
            >
              Reset Selection
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
              onSelect={() => onContextMenuSort(contextMenuTarget.data.key)}
            >
              <div className="flex w-full cursor-pointer items-center justify-between gap-1">
                <span>
                  Sort by{" "}
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
              onSelect={() => {
                const key = contextMenuTarget.data.key;
                if (centralityKeys.includes(key)) {
                  toggleMetricsKey(key);
                } else {
                  toggleMetricsKey(key);
                }
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <span className="text-red-500">Hide</span>
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
            <ContextMenuSubTrigger>Sort By</ContextMenuSubTrigger>
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

                {displayMode === "both" ? (
                  <>
                    <ContextMenuSub>
                      <ContextMenuSubTrigger>
                        Centralities
                      </ContextMenuSubTrigger>
                      <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                        {centralityKeys.map((key) => {
                          const isSorted = sorting[0]?.id === key;
                          const desc = sorting[0]?.desc;
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
                  </>
                ) : displayMode === "attributes" ? (
                  <>
                    {attributeKeys.map((key) => {
                      const isSorted = sorting[0]?.id === key;
                      const desc = sorting[0]?.desc;
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
                    {sortKey && centralityKeys.includes(sortKey) && (
                      <ContextMenuRadioItem
                        value={sortKey}
                        className="cursor-pointer"
                      >
                        <div className="flex w-full items-center justify-between gap-1">
                          <span style={{ color: getColorForMetric(sortKey) }}>
                            {formatKeyLabel(sortKey)}
                          </span>
                          {sorting[0]?.id === sortKey &&
                            (sorting[0].desc ? (
                              <ArrowDown size={14} />
                            ) : (
                              <ArrowUp size={14} />
                            ))}
                        </div>
                      </ContextMenuRadioItem>
                    )}
                  </>
                ) : (
                  <>
                    {centralityKeys.map((key) => {
                      const isSorted = sorting[0]?.id === key;
                      const desc = sorting[0]?.desc;
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
                    {sortKey && attributeKeys.includes(sortKey) && (
                      <ContextMenuRadioItem
                        value={sortKey}
                        className="cursor-pointer"
                      >
                        <div className="flex w-full items-center justify-between gap-1">
                          <span style={{ color: getColorForMetric(sortKey) }}>
                            {formatKeyLabel(sortKey)}
                          </span>
                          {sorting[0]?.id === sortKey &&
                            (sorting[0].desc ? (
                              <ArrowDown size={16} />
                            ) : (
                              <ArrowUp size={16} />
                            ))}
                        </div>
                      </ContextMenuRadioItem>
                    )}
                  </>
                )}
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {(contextMenuTarget.type === "radial" ||
          contextMenuTarget.type === "node-link" ||
          contextMenuTarget.type === "data-table") &&
          hiddenCount > 0 && (
            <ContextMenuItem
              onSelect={() => useNetworkStore.getState().restoreAllNodes()}
              className="cursor-pointer"
            >
              Restore Hidden Nodes ({hiddenCount})
            </ContextMenuItem>
          )}

        {canPreview && onPreview && (
          <ContextMenuItem onSelect={onPreview}>
            <div className="flex items-center gap-2">Remove Preview Nodes</div>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ViewContextMenu;
