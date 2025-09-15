import React from "react";
import { formatValue } from "@/utils/utils";
import { BaseTooltip } from "./BaseTooltip";

export interface ArcTooltipProps {
  nodeId: string;
  centralityKey: string;
  value: number | undefined;
  x: number;
  y: number;
  visible: boolean;
}

export const ArcTooltip: React.FC<ArcTooltipProps> = ({
  nodeId,
  centralityKey,
  value,
  x,
  y,
  visible,
}) => {
  return (
    <BaseTooltip x={x} y={y} visible={visible}>
      <div className="text-sm font-medium">
        {nodeId}:{" "}
        <span className="text-xs text-muted-foreground capitalize">
          {centralityKey.replace(/([A-Z])/g, " $1").trim()}
        </span>
      </div>
      <div className="font-mono text-sm">{formatValue(value)}</div>
    </BaseTooltip>
  );
};
