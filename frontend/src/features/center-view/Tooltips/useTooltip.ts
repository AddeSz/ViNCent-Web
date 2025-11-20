import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useTooltipStore, type TooltipState } from "@/stores/useTooltipStore";
import type { FullData } from "@/types/network";
import throttle from "lodash.throttle";
import { useCallback, useEffect, useRef } from "react";
import type { ContextType } from "../CenterView";

export interface InteractionProps {
  onNodeHover: (nodeId: string | null) => void;
  onTooltipShow: (tooltipData: Partial<TooltipState>) => void;
  onTooltipHide: () => void;
  onContextMenu: (target: ContextType, data?: any) => void;
}

export const useTooltip = (dataMap?: Map<string, FullData>) => {
  const showTooltip = useTooltipStore((s) => s.showTooltip);
  const hideTooltip = useTooltipStore((s) => s.hideTooltip);
  const setHoveredNode = useNetworkStore((s) => s.setHoveredNode);
  const stickyHover = useSettingsStore((s) => s.displaySettings.stickyHover);
  const currentHoveredKey = useRef<string | null>(null);
  const stickyHoverRef = useRef(stickyHover);
  const nullUpdateTimer = useRef<number | null>(null);

  useEffect(() => {
    stickyHoverRef.current = stickyHover;
  }, [stickyHover]);

  const throttledShowTooltip = useRef(
    throttle((data: Partial<TooltipState>, key: string) => {
      showTooltip(data);
      currentHoveredKey.current = key;
    }, 150),
  ).current;

  const handleShowTooltip = useCallback(
    (data: Partial<TooltipState>) => {
      const key = `${data.type ?? "unknown"}-${data.nodeId ?? "unknown"}-${
        data.arcKey ?? ""
      }`;
      if (currentHoveredKey.current === key) {
        showTooltip(data);
        return;
      }
      throttledShowTooltip(data, key);
    },
    [showTooltip, throttledShowTooltip],
  );

  const handleHideTooltip = useCallback(() => {
    throttledShowTooltip.cancel?.();
    currentHoveredKey.current = null;
    hideTooltip();
  }, [hideTooltip, throttledShowTooltip]);

  const onNodeHover = useCallback(
    (nodeId: string | null) => {
      if (!dataMap) return;

      if (nodeId === null) {
        if (!stickyHoverRef.current) {
          nullUpdateTimer.current = window.setTimeout(() => {
            setHoveredNode(null);
            nullUpdateTimer.current = null;
          }, 300);
        }
        return;
      }

      if (nullUpdateTimer.current !== null) {
        clearTimeout(nullUpdateTimer.current);
        nullUpdateTimer.current = null;
      }

      setHoveredNode(nodeId);
    },
    [dataMap, setHoveredNode],
  );

  useEffect(() => {
    return () => {
      throttledShowTooltip.cancel?.();
      if (nullUpdateTimer.current !== null) {
        clearTimeout(nullUpdateTimer.current);
      }
    };
  }, [throttledShowTooltip, onNodeHover]);

  return {
    onNodeHover,
    showTooltip: handleShowTooltip,
    hideTooltip: handleHideTooltip,
  };
};
