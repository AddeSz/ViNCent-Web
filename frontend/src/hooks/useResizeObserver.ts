import type { RefObject } from "react";
import { useEffect, useState } from "react";

export const useResizeObserver = <T extends Element>(
  ref: RefObject<T | null>,
): DOMRectReadOnly | null => {
  const [dimensions, setDimensions] = useState<DOMRectReadOnly | null>(null);

  useEffect(() => {
    const observeTarget = ref.current;
    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setDimensions(entry.contentRect);
      });
    });

    resizeObserver.observe(observeTarget);

    return () => {
      resizeObserver.unobserve(observeTarget);
      resizeObserver.disconnect();
    };
  }, [ref.current]);

  return dimensions;
};
