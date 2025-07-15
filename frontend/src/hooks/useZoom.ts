// useZoom.ts
import { useRef, useCallback } from "react";
import * as d3 from "d3";
import type { RefObject } from "react";
import type { ZoomTransform } from "d3";

export function useZoom() {
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<ZoomTransform | null>(null);

  const setupZoom = useCallback(
    (
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      svgRef: RefObject<SVGSVGElement | null>,
      svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
    ) => {
      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .filter((event) => {
          return event.type === "wheel" || event.target === svgRef.current;
        })
        .scaleExtent([0.1, 6])
        .on("zoom", (event) => {
          svgGroup.attr("transform", event.transform);
          transformRef.current = event.transform;
        });

      zoomRef.current = zoomBehavior;

      svg.call(zoomBehavior);
      const initialTransform = d3.zoomTransform(svgRef.current!);
      svg.call(zoomBehavior.transform, initialTransform);

      // const initialTransform = transformRef.current || d3.zoomIdentity;
      // transformRef.current = initialTransform;

      // svg.call(zoomBehavior.transform, initialTransform);
    },
    [],
  );

  const resetZoom = useCallback((svgRef?: RefObject<SVGSVGElement | null>) => {
    if (!zoomRef.current) return;

    const svgElement = svgRef?.current;
    if (!svgElement) return;

    const svgSelection = d3.select<SVGSVGElement, unknown>(svgElement);
    svgSelection
      .transition()
      .duration(750)
      .call(zoomRef.current.transform, d3.zoomIdentity);

    transformRef.current = d3.zoomIdentity;
  }, []);

  return {
    setupZoom,
    resetZoom,
    zoomRef,
    transformRef,
  };
}
