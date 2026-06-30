import { useNetworkStore } from "@/stores/useNetworkStore";
import type { DataChanges } from "@/types";
import { handleHighlight } from "@/utils/ColorHelper";
import * as d3 from "d3";
import type { InteractionProps } from "../Tooltips/useTooltip";
import type { ProcessedArc } from "./drawArcsCanvas";
import {
  updateCommunityHover,
  type ChangeCircle,
  type CommunitySegment,
} from "./drawOuterLayersCanvas";

interface InteractionCache {
  processedArcs: ProcessedArc[];
  changeCircles: ChangeCircle[];
  communitySegments: CommunitySegment[];
  changeCircleRadius: number;
  communityInnerRadius: number;
  communityOuterRadius: number;
  center: number;
  canvasSize: number;
  nodeChanges: DataChanges;
  totalCommunities: number;
}

let interactionCache: InteractionCache | null = null;

export function drawInteractionCanvas(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  processedArcs: ProcessedArc[],
  changeCircles: ChangeCircle[],
  communitySegments: CommunitySegment[],
  changeCircleRadius: number,
  communityInnerRadius: number,
  communityOuterRadius: number,
  outerRadius: number,
  interactionProps: InteractionProps,
  nodeChanges: DataChanges,
  totalCommunities: number,
): void {
  const requiredRadius = outerRadius + 100;
  const canvasSize = Math.ceil(requiredRadius * 2);
  const center = Math.floor(canvasSize / 2);

  interactionCache = {
    processedArcs,
    changeCircles,
    communitySegments,
    changeCircleRadius,
    communityInnerRadius,
    communityOuterRadius,
    center,
    canvasSize,
    nodeChanges,
    totalCommunities,
  };

  const canvas = getOrCreateInteractionCanvas(svg, canvasSize, center);
  setupInteractions(canvas, interactionProps);
}

export function updateInteractionData(
  processedArcs: ProcessedArc[],
  changeCircles: ChangeCircle[],
  communitySegments: CommunitySegment[],
  totalCommunities: number,
): void {
  if (!interactionCache) return;

  interactionCache.processedArcs = processedArcs;
  interactionCache.changeCircles = changeCircles;
  interactionCache.communitySegments = communitySegments;
  interactionCache.totalCommunities = totalCommunities;
}

function getOrCreateInteractionCanvas(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  canvasSize: number,
  center: number,
): d3.Selection<HTMLCanvasElement, unknown, null, undefined> {
  let foreignObject = g.select<SVGForeignObjectElement>(
    "foreignObject.interaction-canvas-container",
  );

  if (foreignObject.empty()) {
    foreignObject = g
      .append("foreignObject")
      .attr("class", "interaction-canvas-container")
      .attr("x", -center)
      .attr("y", -center)
      .attr("width", canvasSize)
      .attr("height", canvasSize)
      .style("pointer-events", "none");
  } else {
    foreignObject
      .attr("x", -center)
      .attr("y", -center)
      .attr("width", canvasSize)
      .attr("height", canvasSize);
  }

  let canvas = foreignObject.select<HTMLCanvasElement>("canvas");

  if (canvas.empty()) {
    canvas = foreignObject
      .append("xhtml:canvas")
      .attr("class", "interaction-canvas")
      .attr("width", canvasSize)
      .attr("height", canvasSize)
      .style("width", `${canvasSize}px`)
      .style("height", `${canvasSize}px`)
      .style("pointer-events", "all")
      .style("opacity", "0") as unknown as d3.Selection<
      HTMLCanvasElement,
      unknown,
      null,
      undefined
    >;
  } else {
    canvas.style("width", `${canvasSize}px`).style("height", `${canvasSize}px`);
  }

  return canvas as d3.Selection<HTMLCanvasElement, unknown, null, undefined>;
}

function setupInteractions(
  canvas: d3.Selection<HTMLCanvasElement, unknown, null, undefined>,
  interactionProps: InteractionProps,
): void {
  const { onNodeHover, onContextMenu, onTooltipShow, onTooltipHide } =
    interactionProps;

  let hoveredArc: ProcessedArc | null = null;
  let hoveredCircle: ChangeCircle | null = null;
  let hoveredSegment: CommunitySegment | null = null;
  let hoveredLabel: string | null = null;

  function getArcAtPoint(x: number, y: number): ProcessedArc | null {
    if (!interactionCache) return null;

    const { processedArcs, center } = interactionCache;
    const canvasX = x - center;
    const canvasY = y - center;

    const angle = Math.atan2(canvasY, canvasX) + Math.PI / 2;
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
    const radius = Math.sqrt(canvasX * canvasX + canvasY * canvasY);

    for (const arc of processedArcs) {
      if (
        normalizedAngle >= arc.startAngle &&
        normalizedAngle <= arc.endAngle &&
        radius >= arc.innerRadius &&
        radius <= arc.fullOuterRadius
      ) {
        return arc;
      }
    }
    return null;
  }

  function getCircleAtPoint(x: number, y: number): ChangeCircle | null {
    if (!interactionCache) return null;

    const { changeCircles, changeCircleRadius, center } = interactionCache;
    const canvasX = x - center;
    const canvasY = y - center;

    const rotatedX =
      canvasX * Math.cos(Math.PI / 2) - canvasY * Math.sin(Math.PI / 2);
    const rotatedY =
      canvasX * Math.sin(Math.PI / 2) + canvasY * Math.cos(Math.PI / 2);

    for (const circle of changeCircles) {
      const circleX = Math.cos(circle.angle) * circle.distance;
      const circleY = Math.sin(circle.angle) * circle.distance;

      const distance = Math.sqrt(
        Math.pow(rotatedX - circleX, 2) + Math.pow(rotatedY - circleY, 2),
      );

      if (distance <= changeCircleRadius) {
        return circle;
      }
    }
    return null;
  }

  function getCommunitySegmentAtPoint(
    x: number,
    y: number,
  ): CommunitySegment | null {
    if (!interactionCache) return null;

    const {
      communitySegments,
      communityInnerRadius,
      communityOuterRadius,
      center,
    } = interactionCache;
    const canvasX = x - center;
    const canvasY = y - center;

    const angle = Math.atan2(canvasY, canvasX) + Math.PI / 2;
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
    const radius = Math.sqrt(canvasX * canvasX + canvasY * canvasY);

    for (const segment of communitySegments) {
      if (radius < communityInnerRadius || radius > communityOuterRadius) {
        continue;
      }

      if (segment.wrapsAround) {
        if (
          normalizedAngle >= segment.startAngle ||
          normalizedAngle <= segment.endAngle
        ) {
          return segment;
        }
      } else {
        if (
          normalizedAngle >= segment.startAngle &&
          normalizedAngle <= segment.endAngle
        ) {
          return segment;
        }
      }
    }
    return null;
  }

  function getLabelAtPoint(event: MouseEvent): string | null {
    const elements = document.elementsFromPoint(event.clientX, event.clientY);

    for (const el of elements) {
      if (el.tagName === "text" && el.hasAttribute("data-type")) {
        return el.getAttribute("data-type");
      }
      if (el.tagName === "g" && el.classList.contains("label")) {
        const text = el.querySelector("text[data-type]");
        if (text) {
          return text.getAttribute("data-type");
        }
      }
    }
    return null;
  }
  const setHoveredCommunity = useNetworkStore.getState().setHoveredCommunity;
  canvas
    .on("mousemove", function (event) {
      if (!interactionCache) return;

      const { canvasSize, nodeChanges } = interactionCache;
      const rect = this.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const label = getLabelAtPoint(event);
      const circle = label ? null : getCircleAtPoint(x, y);
      const segment = label || circle ? null : getCommunitySegmentAtPoint(x, y);
      const arc = label || circle || segment ? null : getArcAtPoint(x, y);

      if (
        label !== hoveredLabel ||
        circle !== hoveredCircle ||
        segment !== hoveredSegment ||
        arc !== hoveredArc
      ) {
        hoveredLabel = label;
        hoveredCircle = circle;
        hoveredSegment = segment;
        hoveredArc = arc;

        if (segment) {
          updateCommunityHover(segment.community);
          setHoveredCommunity(segment.algorithmKey, segment.community);
        } else {
          updateCommunityHover(null);
          setHoveredCommunity(null, null);
        }

        if (label || circle || segment || arc) {
          (this as HTMLCanvasElement).style.cursor = "pointer";

          if (label) {
            onNodeHover(label);
          } else if (arc) {
            onNodeHover(arc.data.id);
          } else if (circle) {
            onNodeHover(circle.id);
          } else if (segment) {
            onNodeHover(null);
          }
        } else {
          (this as HTMLCanvasElement).style.cursor = "default";
          onNodeHover(null);
        }
      }

      if (circle) {
        onTooltipShow({
          type: "change",
          nodeId: circle.id,
          x: event.clientX,
          y: event.clientY,
          lastChange: nodeChanges,
        });
      } else if (segment) {
        onTooltipShow({
          type: "community",
          communityId: segment.community,
          nodeCount: segment.nodeIds.length,
          x: event.clientX,
          y: event.clientY,
        });
      } else if (arc) {
        onTooltipShow({
          type: "arc",
          nodeId: arc.data.id,
          x: event.clientX,
          y: event.clientY,
          arcKey: arc.data.key,
        });
      } else if (label) {
        onTooltipShow({
          type: "label",
          nodeId: label,
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        onTooltipHide();
      }
    })
    .on("mouseout", function () {
      if (hoveredArc || hoveredCircle || hoveredSegment || hoveredLabel) {
        hoveredArc = null;
        hoveredCircle = null;
        hoveredSegment = null;
        hoveredLabel = null;
        updateCommunityHover(null);
        setHoveredCommunity(null, null);
        (this as HTMLCanvasElement).style.cursor = "default";
        onNodeHover(null);
        onTooltipHide();
      }
    })
    .on("contextmenu", function (event) {
      if (!interactionCache) return;

      const { canvasSize } = interactionCache;
      const rect = this.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const label = getLabelAtPoint(event);
      const circle = label ? null : getCircleAtPoint(x, y);
      const segment = label || circle ? null : getCommunitySegmentAtPoint(x, y);
      const arc = label || circle || segment ? null : getArcAtPoint(x, y);

      if (arc) {
        (event as any)._handledByChild = true;
        onContextMenu("arc", arc.data);
      } else if (label) {
        (event as any)._handledByChild = true;
        onContextMenu("label", label);
      } else if (segment) {
        (event as any)._handledByChild = true;
        onContextMenu("community", segment);
      }
    })
    .on("click", function (event) {
      if (!interactionCache) return;

      const { canvasSize } = interactionCache;
      const rect = this.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const label = getLabelAtPoint(event);
      const circle = label ? null : getCircleAtPoint(x, y);
      const segment = label || circle ? null : getCommunitySegmentAtPoint(x, y);
      const arc = label || circle || segment ? null : getArcAtPoint(x, y);

      if (arc || circle || label) {
        const multi = event.shiftKey || event.ctrlKey;
        const id = arc?.data.id || circle?.id || label;
        if (id) {
          handleHighlight(id, multi);
        }
      } else if (segment) {
        segment.nodeIds.forEach((id) => {
          handleHighlight(id, true);
        });
      }
    });
}

export default drawInteractionCanvas;
