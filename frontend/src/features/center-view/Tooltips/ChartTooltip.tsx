import { useKeys } from "@/hooks/useKeys";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type { FullData, NodeChange } from "@/types/network";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import type { JSX } from "react";

export type TooltipType = "arc" | "label" | "node" | "change";

interface ChartTooltipProps {
  type: TooltipType;
  nodeId: string;
  x: number;
  y: number;
  visible: boolean;
  dataMap: Map<string, FullData>;
  arcKey?: string;
  lastChange?: NodeChange | null;
}

const ChartTooltip = ({
  type,
  nodeId,
  x,
  y,
  visible,
  dataMap,
  arcKey,
  lastChange,
}: ChartTooltipProps) => {
  const { attributeKeys, centralityKeys } = useKeys();
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);

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

      const attributeChanges: JSX.Element[] = [];
      const centralityChanges: JSX.Element[] = [];

      Object.entries(changes).forEach(([key, { before, after }]) => {
        const color = getColorForKey(key);
        const changeSpan = (
          <span key={key}>
            <span style={{ color }}>{formatKeyLabel(key)}</span>:{" "}
            {formatValue(before)} → {formatValue(after)}
          </span>
        );

        if (attributeKeys.includes(key)) {
          attributeChanges.push(changeSpan);
        } else if (centralityKeys.includes(key)) {
          centralityChanges.push(changeSpan);
        }
      });

      const sections = [];

      if (centralityChanges.length > 0) {
        sections.push(
          <div key="centrality">
            Centrality:{" "}
            {centralityChanges.map((el, i) => (
              <span key={i}>
                {i > 0 && ", "}
                {el}
              </span>
            ))}
          </div>,
        );
      }

      if (attributeChanges.length > 0) {
        sections.push(
          <div key="attributes">
            Attributes:{" "}
            {attributeChanges.map((el, i) => (
              <span key={i}>
                {i > 0 && ", "}
                {el}
              </span>
            ))}
          </div>,
        );
      }

      changeMessage =
        sections.length > 0 ? (
          <span>{sections}</span>
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
      className="animate-in rounded-md border bg-popover p-2 text-sm shadow-md fade-in-0 zoom-in-95"
    >
      {type === "arc" && (
        <>
          <div
            className="text-sm"
            style={{ color: getColorForKey(arcKey!, nodeData[arcKey!]) }}
          >
            {formatKeyLabel(arcKey!)}
          </div>
          <div className="font-mono text-sm">
            {formatValue(nodeData[arcKey!])}
          </div>
          <div className="text-xs text-muted-foreground">
            Node: {nodeData.label ? nodeData.label : nodeId}
          </div>
        </>
      )}

      {type === "label" && (
        <div className="text-sm font-medium">
          {nodeData.label ? nodeData.label : nodeId}
          <div className="text-xs text-muted-foreground">
            Links: {nodeData.linkCount}
          </div>
        </div>
      )}

      {type === "node" && (
        <div className="font-medium">
          <div>{nodeData.label || nodeId}</div>
          <div className="text-xs text-muted-foreground">
            Links: {nodeData.linkCount}
          </div>
        </div>
      )}

      {type === "change" && (
        <div className="font-medium">
          <div>{nodeData.label || nodeId}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {changeMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartTooltip;
