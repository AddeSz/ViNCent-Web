import { useCurrentMetricsInfo } from "@/hooks/useCurrentMetricsInfo";
import { useGetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useKeys } from "@/hooks/useKeys";
import { useInteractionStore } from "@/stores/useInteractionStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { ViewNode } from "@/types";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import { useMemo, type JSX } from "react";

interface ChartTooltipProps {
  dataMap: Map<string, ViewNode>;
}

const ChartTooltip = ({ dataMap }: ChartTooltipProps) => {
  const tooltip = useInteractionStore((s) => s.tooltip);
  const { allNodeKeys } = useKeys();
  const getColorForMetric = useGetColorForMetric();
  const communities = useNetworkStore((s) => s.currentCommunities);
  const selectedCommunity = useSettingsStore(
    (s) => s.displaySettings.selectedCommunity,
  );
  const currentMetricsInfo = useCurrentMetricsInfo();

  const communityStats = useMemo(() => {
    const currentCommunities = communities?.[selectedCommunity];
    if (!currentCommunities) {
      return {
        uniqueCommunities: 0,
        nodesByCommunity: new Map<number, number>(),
      };
    }

    const nodesByCommunity = new Map<number, number>();
    Object.values(currentCommunities).forEach((commId) => {
      nodesByCommunity.set(commId, (nodesByCommunity.get(commId) || 0) + 1);
    });

    return {
      uniqueCommunities: nodesByCommunity.size,
      nodesByCommunity,
    };
  }, [communities, selectedCommunity]);

  const {
    type,
    nodeId,
    x,
    y,
    visible,
    arcKey,
    lastChange,
    communityId,
    nodeCount,
  } = tooltip;

  if (!visible) return null;

  const nodeData = dataMap.get(nodeId);
  if (!nodeData) return null;
  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    left: x + 10,
    top: y - 50,
    zIndex: 1000,
    pointerEvents: "none",
  };

  let changeMessage = null;
  if (type === "change" && lastChange) {
    const { added = {}, removed = {}, updated = {} } = lastChange;
    if (Object.prototype.hasOwnProperty.call(added, nodeId)) {
      changeMessage = <span>Node was added</span>;
    } else if (Object.prototype.hasOwnProperty.call(removed, nodeId)) {
      changeMessage = <span>Node was removed</span>;
    } else if (Object.prototype.hasOwnProperty.call(updated, nodeId)) {
      const changes = updated[nodeId] || {};
      const allChanges: JSX.Element[] = [];

      allNodeKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(changes, key)) {
          const { before, after } = changes[key];
          const color = getColorForMetric(key);
          const info = currentMetricsInfo.get(key);
          let colorBefore = "var(--muted-foreground)";
          let colorAfter = "var(--muted-foreground)";
          if (info?.isCategory && !info?.isCentrality) {
            colorBefore = getColorForMetric(key, before);
            colorAfter = getColorForMetric(key, after);
          }
          const changeSpan = (
            <div key={key}>
              <span style={{ color }}>{formatKeyLabel(key)}</span>:{" "}
              <span style={{ color: colorBefore }}>{formatValue(before)}</span>{" "}
              {"->"}{" "}
              <span style={{ color: colorAfter }}>{formatValue(after)}</span>
            </div>
          );
          allChanges.push(changeSpan);
        }
      });

      changeMessage =
        allChanges.length > 0 ? (
          <div>{allChanges}</div>
        ) : (
          <span>Node was updated</span>
        );
    } else {
      changeMessage = <span>No recent change</span>;
    }
  }

  return (
    <div
      style={tooltipStyle}
      className="animate-in rounded-md border bg-background px-2 py-1 text-sm shadow-md fade-in-0 zoom-in-95"
    >
      {type === "arc" && (
        <>
          <div
            className="text-xs font-medium"
            style={{
              color: getColorForMetric(arcKey!, nodeData.attributes[arcKey!]),
            }}
          >
            {formatKeyLabel(arcKey!)}
          </div>
          <div className="text-xs">
            {formatValue(nodeData.attributes[arcKey!])}
          </div>
          <div className="text-xs text-muted-foreground">
            {nodeData.label ? nodeData.label : nodeId}
          </div>
        </>
      )}

      {type === "label" && (
        <div className="text-xs font-medium">
          {nodeData.label ? nodeData.label : nodeId}
          <div className="flex-col text-xs text-muted-foreground">
            <div>Links: {nodeData.linked.size} </div>
            {selectedCommunity !== "none" && (
              <div>Community: {nodeData?.attributes[selectedCommunity]}</div>
            )}
          </div>
        </div>
      )}

      {type === "node" && (
        <div className="text-xs font-medium">
          {nodeData.label ? nodeData.label : nodeId}
          <div className="flex-col text-xs text-muted-foreground">
            <div>Links: {nodeData.linked.size} </div>
            {selectedCommunity !== "none" && (
              <div>Community: {nodeData?.attributes[selectedCommunity]}</div>
            )}
          </div>
        </div>
      )}

      {type === "change" && (
        <div className="text-xs font-medium">
          {nodeData.label ? nodeData.label : nodeId}
          <div className="text-xs text-muted-foreground">{changeMessage}</div>
        </div>
      )}

      {type === "community" && (
        <div className="text-xs font-medium">
          Community {communityId}
          <div className="text-xs text-muted-foreground">
            Hovered Segment: {nodeCount} nodes
          </div>
          <div className="text-xs text-muted-foreground">
            Total in Community:{" "}
            {communityStats.nodesByCommunity.get(communityId!) || 0} nodes
          </div>
          <div className="text-xs text-muted-foreground">
            Total Communities: {communityStats.uniqueCommunities}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartTooltip;
