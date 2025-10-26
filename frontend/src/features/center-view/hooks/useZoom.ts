import * as d3 from "d3";
import type { RefObject } from "react";
import { useCallback, useRef } from "react";

export const useZoom = () => {
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform | null>(null);

  const setupZoom = useCallback(
    (
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
      initialTransform?: d3.ZoomTransform | null,
      onZoomChange?: (transform: d3.ZoomTransform) => void,
    ) => {
      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .filter((event) => {
          const target = event.target as HTMLElement;
          if (event.type === "wheel") return true;
          if ("button" in event && event.button === 2) return false;
          if (
            target.closest(".arcs-group") ||
            target.closest(".labels-group")
          ) {
            return false;
          }
          if (event.type === "dblclick" && target.closest(".node")) {
            return false;
          }
          return true;
        })
        .scaleExtent([0.1, 6])
        .on("zoom", (event) => {
          svgGroup.attr("transform", event.transform);
          transformRef.current = event.transform;
          if (onZoomChange) {
            onZoomChange(event.transform);
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

  return {
    setupZoom,
    resetZoom,
    zoomRef,
    transformRef,
  };
};
