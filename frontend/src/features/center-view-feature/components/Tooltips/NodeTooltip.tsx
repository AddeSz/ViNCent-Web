import React from "react";
import { BaseTooltip } from "./BaseTooltip";

export interface NodeTooltipProps {
  nodeId: string;
  label: string;
  linkCount: number;
  x: number;
  y: number;
  visible: boolean;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({
  nodeId,
  label,
  linkCount,
  x,
  y,
  visible,
}) => {
  return (
    <BaseTooltip x={x} y={y} visible={visible}>
      <div className="font-medium">{label || nodeId}</div>
      <div className="text-xs text-muted-foreground">Links: {linkCount}</div>
    </BaseTooltip>
  );
};
