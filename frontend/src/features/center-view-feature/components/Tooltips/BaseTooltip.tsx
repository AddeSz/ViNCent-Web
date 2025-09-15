import React from "react";

export interface BaseTooltipProps {
  x: number;
  y: number;
  visible: boolean;
  children: React.ReactNode;
  className?: string;
}

export const BaseTooltip: React.FC<BaseTooltipProps> = ({
  x,
  y,
  visible,
  children,
  className = "",
}) => {
  if (!visible) return null;

  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    left: x + 10,
    top: y - 50,
    zIndex: 1000,
    pointerEvents: "none",
  };

  return (
    <div
      style={tooltipStyle}
      className={`animate-in rounded-md border bg-popover p-1 text-sm shadow-md fade-in-0 zoom-in-95 ${className}`}
    >
      {children}
    </div>
  );
};
