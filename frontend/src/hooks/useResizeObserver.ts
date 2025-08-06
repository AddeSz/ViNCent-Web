import { useEffect, useState } from "react";
import type { RefObject } from "react";

const useResizeObserver = <T extends Element>(
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

export default useResizeObserver;
