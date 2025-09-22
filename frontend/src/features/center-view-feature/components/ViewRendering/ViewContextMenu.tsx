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
import type { ViewType } from "@/features/center-view-feature/CenterView";
import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import { formatKeyLabel } from "@/utils/utils";
import type { ViewRendererRef } from "./ViewRenderer";

interface ViewContextMenuProps {
  view: ViewType;
  viewRendererRef: React.RefObject<ViewRendererRef | null>;
  onContextMenuSort: (val: string) => void;
  children: React.ReactNode;
}

const ViewContextMenu = ({
  view,
  viewRendererRef,
  onContextMenuSort,
  children,
}: ViewContextMenuProps) => {
  const clearSelection = useNetworkStore((s) => s.clearSelection);
  const centralityKeys = useCentralityStore((s) => s.enabledCentralityKeys);
  const attributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const sortKey = useNetworkStore((s) => s.sortKey);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const displayMode = useChartSettings((s) => s.displayMode);

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
        <ContextMenuItem onSelect={handleResetZoom}>Reset Zoom</ContextMenuItem>

        <ContextMenuItem onSelect={clearSelection}>
          Reset Selection
        </ContextMenuItem>

        {view === "radial" && (
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
                    {centralityKeys.map((key) => (
                      <ContextMenuRadioItem
                        key={key}
                        value={key}
                        disabled={displayMode === "attributes"}
                      >
                        <span style={{ color: getColorForKey(key) }}>
                          {formatKeyLabel(key)}
                        </span>
                      </ContextMenuRadioItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSub>
                  <ContextMenuSubTrigger>Attributes</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="scrollbar-thin max-h-128 overflow-y-auto">
                    {attributeKeys.map((key) => (
                      <ContextMenuRadioItem
                        key={key}
                        value={key}
                        disabled={displayMode === "centrality"}
                      >
                        <span style={{ color: getColorForKey(key) }}>
                          {formatKeyLabel(key)}
                        </span>
                      </ContextMenuRadioItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
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
  );
};

export default ViewContextMenu;
