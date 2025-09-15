import { useState, useRef, useEffect } from "react";

type BaseTooltip = {
  x: number;
  y: number;
  visible: boolean;
};

export function useTooltip<T extends BaseTooltip>(initial?: Partial<T>) {
  const [tooltip, setTooltip] = useState<T>(
    () =>
      ({
        x: 0,
        y: 0,
        visible: false,
        ...initial,
      }) as T,
  );

  const tooltipTimer = useRef<NodeJS.Timeout | null>(null);
  const currentHoveredKey = useRef<string | null>(null);

  const showTooltip = (tooltipData: T, key: string) => {
    if (currentHoveredKey.current === key) {
      if (tooltipTimer.current) {
        clearTimeout(tooltipTimer.current);
        tooltipTimer.current = null;
      }
      setTooltip({ ...tooltipData, visible: true });
      return;
    }

    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
      tooltipTimer.current = null;
    }

    tooltipTimer.current = setTimeout(() => {
      setTooltip({ ...tooltipData, visible: true });
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
      if (tooltipTimer.current) {
        clearTimeout(tooltipTimer.current);
      }
    };
  }, []);

  return {
    tooltip,
    setTooltip,
    showTooltip,
    hideTooltip,
  };
}
