import type { TooltipType } from "@/features/center-view/components/Tooltips/Tooltip";
import { useEffect, useRef, useState } from "react";

interface TooltipState {
  type: TooltipType;
  nodeId: string;
  x: number;
  y: number;
  visible: boolean;
  arcKey?: string;
}

export const useTooltip = (initial?: Partial<TooltipState>) => {
  const [tooltip, setTooltip] = useState<TooltipState>(() => ({
    type: "arc",
    nodeId: "",
    x: 0,
    y: 0,
    visible: false,
    ...initial,
  }));

  const tooltipTimer = useRef<NodeJS.Timeout | null>(null);
  const currentHoveredKey = useRef<string | null>(null);

  const showTooltip = (data: Partial<TooltipState>, key: string) => {
    if (currentHoveredKey.current === key) {
      if (tooltipTimer.current) {
        clearTimeout(tooltipTimer.current);
        tooltipTimer.current = null;
      }
      setTooltip((prev) => ({ ...prev, ...data, visible: true }));
      return;
    }

    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }

    tooltipTimer.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, ...data, visible: true }));
      currentHoveredKey.current = key;
      tooltipTimer.current = null;
    }, 150);
  };

  const hideTooltip = () => {
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }
    currentHoveredKey.current = null;
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    };
  }, []);

  return { tooltip, setTooltip, showTooltip, hideTooltip };
};
