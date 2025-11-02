import * as d3 from "d3";
import type { RefObject } from "react";
import { useCallback, useRef } from "react";

export const ZOOM_LEVELS = [0.5, 1, 2.5] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

export function getClosestZoomLevel(zoomFactor: number): ZoomLevel {
  return ZOOM_LEVELS.reduce((prev, curr) =>
    Math.abs(curr - zoomFactor) < Math.abs(prev - zoomFactor) ? curr : prev,
  );
}

export const useZoom = (scaleExtent: [number, number] = [0.3, 6]) => {
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const onZoomRef = useRef<((k: number) => void) | null>(null);

  const setupZoom = useCallback(
    (
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
      initialTransform?: d3.ZoomTransform | null,
      onZoom?: (k: number) => void,
    ) => {
      onZoomRef.current = onZoom || null;

      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .filter((event) => {
          const target = event.target as HTMLElement;
          if (event.type === "wheel") return true;
          if ("button" in event && event.button === 2) return false;
          if (target.classList.contains("arc-canvas")) return true;

          if (target.closest(".arcs-group") || target.closest(".labels-group"))
            return false;

          if (event.type === "dblclick" && target.closest(".node"))
            return false;

          return true;
        })
        .scaleExtent(scaleExtent)
        .on("zoom", (event) => {
          svgGroup.attr("transform", event.transform);
          transformRef.current = event.transform;

          if (onZoomRef.current) {
            onZoomRef.current(event.transform.k);
          }
        });

      zoomRef.current = zoomBehavior;
      svg.call(zoomBehavior);

      const transform = initialTransform || d3.zoomIdentity;
      svg.call(zoomBehavior.transform, transform);
      transformRef.current = transform;
    },
    [],
  );

  const resetZoom = useCallback(
    (svgRef?: RefObject<SVGSVGElement | null>, onZoomReset?: () => void) => {
      if (!zoomRef.current) return;
      const svgElement = svgRef?.current;
      if (!svgElement) return;
      const svgSelection = d3.select<SVGSVGElement, unknown>(svgElement);
      svgSelection
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, d3.zoomIdentity);
      transformRef.current = d3.zoomIdentity;
      if (onZoomReset) {
        onZoomReset();
      }
    },
    [],
  );

  const getCurrentTransform = useCallback(() => {
    return transformRef.current;
  }, []);

  return {
    setupZoom,
    resetZoom,
    getCurrentTransform,
    zoomRef,
    transformRef,
  };
};
