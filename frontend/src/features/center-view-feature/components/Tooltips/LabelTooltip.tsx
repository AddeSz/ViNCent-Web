import React from "react";
import { BaseTooltip } from "./BaseTooltip";

export interface LabelTooltipProps {
  nodeId: string;
  label?: string;
  x: number;
  y: number;
  visible: boolean;
}

export const LabelTooltip: React.FC<LabelTooltipProps> = ({
  nodeId,
  label,
  x,
  y,
  visible,
}) => {
  return (
    <BaseTooltip x={x} y={y} visible={visible}>
      <div className="font-medium">
        {label && <div>{label}</div>}
        <div>ID: {nodeId}</div>
      </div>
    </BaseTooltip>
  );
};
