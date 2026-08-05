import { useCallback, useEffect, useRef, useState } from "react";

// Tracks the rendered size of an element
// The graph needs explicit width/height, so we measure the wrapper div
// on mount, window resize, and whenever the containing tab becomes active
export function useElementSize<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const measure = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setSize((prev) =>
      prev.width === rect.width && prev.height === rect.height
        ? prev
        : { width: rect.width, height: rect.height },
    );
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // remeasure when the diagram becomes active again
  useEffect(() => {
    if (active) measure();
  }, [active, measure]);

  return { ref, size };
}
