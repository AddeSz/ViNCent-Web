import type { CombinedData } from "@/types/network";
import { formatKeyLabel, formatValue } from "@/utils/utils";

export type TooltipType = "arc" | "label" | "node";

interface ChartTooltipProps {
  type: TooltipType;
  nodeId: string;
  x: number;
  y: number;
  visible: boolean;
  combinedDataMap: Map<string, CombinedData>;
  getColorForKey: (key: string, value?: string | number) => string;
  arcKey?: string;
}

const ChartTooltip = ({
  type,
  nodeId,
  x,
  y,
  visible,
  combinedDataMap,
  getColorForKey,
  arcKey,
}: ChartTooltipProps) => {
  if (!visible) return null;
  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    left: x + 10,
    top: y - 50,
    zIndex: 1000,
    pointerEvents: "none",
  };

  const nodeData = combinedDataMap.get(nodeId);

  if (!nodeData) return null;
  return (
    <div
      style={tooltipStyle}
      className={`animate-in rounded-md border bg-popover p-1 text-sm shadow-md fade-in-0 zoom-in-95`}
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
          <div className="text-xs">
            Node: {nodeData.label ? nodeData.label : nodeId}
          </div>
        </>
      )}

      {type === "label" && (
        <div className="text-sm font-medium">
          {nodeData.label ? nodeData.label : nodeId}
          <div className="text-xs">Links: {nodeData.linkCount}</div>
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
    </div>
  );
};

export default ChartTooltip;
