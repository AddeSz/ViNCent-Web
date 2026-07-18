import { type GetColorForMetric } from "@/hooks/useGetColorForMetric";
import type { DataChanges, FullData } from "@/types";
import * as d3 from "d3";

export interface CommunitySegment {
  community: number;
  startAngle: number;
  endAngle: number;
  nodeIds: string[];
  color: string;
  algorithmKey: string;
  wrapsAround?: boolean;
}

export interface ChangeCircle {
  id: string;
  angle: number;
  distance: number;
  color: string;
  changeType: "added" | "removed" | "updated";
}

export interface CommunitiesData {
  segments: CommunitySegment[];
  changeCircles: ChangeCircle[];
  innerRadius: number;
  outerRadius: number;
  totalCommunities: number;
}

interface CommunitiesCanvasCache {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  segments: CommunitySegment[];
  changeCircles: ChangeCircle[];
  innerRadius: number;
  outerRadius: number;
  changeCircleRadius: number;
  center: number;
  canvasSize: number;
  zoomFactor: number;
  nodeChanges?: DataChanges;
  totalCommunities: number;
  hoveredCommunity: number | null;
}

let communitiesCache: CommunitiesCanvasCache | null = null;

export function drawOuterLayersCanvas(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodeMap: Map<string, FullData>,
  selectedAlgorithm: string,
  x: d3.ScaleBand<string>,
  outerRadius: number,
  outerArcsWidth: number,
  nodeChanges: DataChanges,
  zoomFactor: number,
  getColorForMetric: GetColorForMetric,
): CommunitiesData {
  const segmentWidth = 25;
  const innerRadiusSegment = outerRadius + outerArcsWidth;
  const outerRadiusSegment = innerRadiusSegment + segmentWidth;

  const changeCircleDistance =
    selectedAlgorithm === "none"
      ? outerRadius + outerArcsWidth * 1.5 + 1
      : outerRadiusSegment + outerArcsWidth * 1.5 + 1;

  const changeCircleRadius = outerArcsWidth;
  const requiredRadius =
    Math.max(outerRadiusSegment, changeCircleDistance + changeCircleRadius) +
    10;
  const canvasSize = Math.ceil(requiredRadius * 2);
  const center = Math.floor(canvasSize / 2);

  const segments = processCommunitySegments(
    nodeMap,
    selectedAlgorithm,
    x,
    getColorForMetric,
  );
  const totalCommunities =
    selectedAlgorithm === "none"
      ? 0
      : new Set(segments.map((s) => s.community)).size;

  const changeCircles = processChangeCircles(
    nodeChanges,
    x,
    changeCircleDistance,
  );

  const canvas = getOrCreateCommunitiesCanvas(
    svg,
    canvasSize,
    center,
    zoomFactor,
  );
  const ctx = canvas.node()?.getContext("2d");

  if (!ctx) {
    return {
      segments,
      changeCircles,
      innerRadius: innerRadiusSegment,
      outerRadius: outerRadiusSegment,
      totalCommunities,
    };
  }

  communitiesCache = {
    canvas: canvas.node()!,
    ctx,
    segments,
    changeCircles,
    innerRadius: innerRadiusSegment,
    outerRadius: outerRadiusSegment,
    changeCircleRadius,
    center,
    canvasSize,
    zoomFactor,
    nodeChanges,
    totalCommunities,
    hoveredCommunity: null,
  };

  drawOuterLayerOnCanvas(
    ctx,
    segments,
    changeCircles,
    innerRadiusSegment,
    outerRadiusSegment,
    changeCircleRadius,
    center,
    zoomFactor,
    null,
  );

  return {
    segments,
    changeCircles,
    innerRadius: innerRadiusSegment,
    outerRadius: outerRadiusSegment,
    totalCommunities,
  };
}

function processCommunitySegments(
  nodeMap: Map<string, FullData>,
  selectedAlgorithm: string,
  x: d3.ScaleBand<string>,
  getColorForMetric: GetColorForMetric,
): CommunitySegment[] {
  if (selectedAlgorithm === "none") {
    return [];
  }
  const communityGroups = new Map<number, string[]>();
  const domain = x.domain();

  for (const nodeId of domain) {
    const nodeData = nodeMap.get(nodeId);
    if (!nodeData) continue;

    const community = nodeData[selectedAlgorithm];
    if (community !== undefined && typeof community === "number") {
      if (!communityGroups.has(community)) {
        communityGroups.set(community, []);
      }
      communityGroups.get(community)!.push(nodeId);
    }
  }

  if (communityGroups.size === 0) {
    console.warn(`No community data found for algorithm: ${selectedAlgorithm}`);
    return [];
  }

  const segments: CommunitySegment[] = [];
  const bandwidth = x.bandwidth();
  const step = x.step();
  const gap = step - bandwidth;
  const halfGap = gap / 2;

  communityGroups.forEach((nodeIds, community) => {
    const sortedNodeIds = nodeIds
      .map((nodeId) => ({
        nodeId,
        index: domain.indexOf(nodeId),
        angle: x(nodeId)! + bandwidth / 2,
      }))
      .sort((a, b) => a.index - b.index);

    if (sortedNodeIds.length === 0) return;
    const color = getColorForMetric(selectedAlgorithm, community);

    const firstIndex = sortedNodeIds[0].index;
    const lastIndex = sortedNodeIds[sortedNodeIds.length - 1].index;
    const wrapsAround = lastIndex === domain.length - 1 && firstIndex === 0;

    let currentSegmentNodes = [sortedNodeIds[0]];

    for (let i = 1; i < sortedNodeIds.length; i++) {
      const prevIndex = sortedNodeIds[i - 1].index;
      const currentIndex = sortedNodeIds[i].index;

      if (currentIndex === prevIndex + 1) {
        currentSegmentNodes.push(sortedNodeIds[i]);
      } else {
        segments.push({
          community,
          startAngle: currentSegmentNodes[0].angle - bandwidth / 2 - halfGap,
          endAngle:
            currentSegmentNodes[currentSegmentNodes.length - 1].angle +
            bandwidth / 2 +
            halfGap,
          nodeIds: currentSegmentNodes.map((n) => n.nodeId),
          color,
          algorithmKey: selectedAlgorithm,
        });
        currentSegmentNodes = [sortedNodeIds[i]];
      }
    }

    if (wrapsAround && segments.length > 0) {
      const firstSegmentOfThisCommunity = segments.findIndex(
        (s) => s.community === community,
      );
      if (firstSegmentOfThisCommunity !== -1) {
        const firstSegment = segments[firstSegmentOfThisCommunity];
        segments[firstSegmentOfThisCommunity] = {
          community,
          startAngle: currentSegmentNodes[0].angle - bandwidth / 2 - halfGap,
          endAngle: firstSegment.endAngle,
          nodeIds: [
            ...currentSegmentNodes.map((n) => n.nodeId),
            ...firstSegment.nodeIds,
          ],
          color,
          wrapsAround: true,
          algorithmKey: selectedAlgorithm,
        };
        return;
      }
    }

    segments.push({
      community,
      startAngle: currentSegmentNodes[0].angle - bandwidth / 2 - halfGap,
      endAngle:
        currentSegmentNodes[currentSegmentNodes.length - 1].angle +
        bandwidth / 2 +
        halfGap,
      nodeIds: currentSegmentNodes.map((n) => n.nodeId),
      color,
      algorithmKey: selectedAlgorithm,
    });
  });

  return segments;
}

function processChangeCircles(
  nodeChanges: DataChanges,
  x: d3.ScaleBand<string>,
  distance: number,
): ChangeCircle[] {
  const changeCircles: ChangeCircle[] = [];

  const getChangeType = (
    id: string,
  ): "added" | "removed" | "updated" | null => {
    if (nodeChanges?.added && id in nodeChanges.added) return "added";
    if (nodeChanges?.removed && id in nodeChanges.removed) return "removed";
    if (
      nodeChanges?.updated &&
      Object.prototype.hasOwnProperty.call(nodeChanges.updated, id)
    )
      return "updated";
    return null;
  };

  const getFillColor = (
    changeType: "added" | "removed" | "updated" | null,
  ): string => {
    if (changeType === "added") return "green";
    if (changeType === "removed") return "red";
    if (changeType === "updated") return "yellow";
    return "none";
  };

  const domain = x.domain();
  for (const id of domain) {
    const changeType = getChangeType(id);
    if (!changeType) continue;

    const angle = x(id)! + x.bandwidth() / 2;
    const color = getFillColor(changeType);

    changeCircles.push({
      id,
      angle,
      distance,
      color,
      changeType,
    });
  }

  return changeCircles;
}

function drawOuterLayerOnCanvas(
  ctx: CanvasRenderingContext2D,
  segments: CommunitySegment[],
  changeCircles: ChangeCircle[],
  innerRadius: number,
  outerRadius: number,
  changeCircleRadius: number,
  center: number,
  zoomFactor: number,
  hoveredCommunity: number | null,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.scale(zoomFactor, zoomFactor);
  ctx.translate(center, center);
  ctx.rotate(-Math.PI / 2);

  const nonHoveredSegments: CommunitySegment[] = [];
  const hoveredSegments: CommunitySegment[] = [];

  for (const segment of segments) {
    const isHovered =
      hoveredCommunity !== null && segment.community === hoveredCommunity;
    if (isHovered) {
      hoveredSegments.push(segment);
    } else {
      nonHoveredSegments.push(segment);
    }
  }

  for (const segment of nonHoveredSegments) {
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, segment.startAngle, segment.endAngle, false);
    ctx.lineTo(
      innerRadius * Math.cos(segment.endAngle),
      innerRadius * Math.sin(segment.endAngle),
    );
    ctx.arc(0, 0, innerRadius, segment.endAngle, segment.startAngle, true);
    ctx.closePath();

    ctx.fillStyle = segment.color;
    ctx.globalAlpha = 0.9;
    ctx.fill();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  for (const segment of hoveredSegments) {
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, segment.startAngle, segment.endAngle, false);
    ctx.lineTo(
      innerRadius * Math.cos(segment.endAngle),
      innerRadius * Math.sin(segment.endAngle),
    );
    ctx.arc(0, 0, innerRadius, segment.endAngle, segment.startAngle, true);
    ctx.closePath();

    ctx.fillStyle = segment.color;
    ctx.globalAlpha = 1;
    ctx.fill();

    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const circle of changeCircles) {
    const x = Math.cos(circle.angle) * circle.distance;
    const y = Math.sin(circle.angle) * circle.distance;

    ctx.beginPath();
    ctx.arc(x, y, changeCircleRadius, 0, Math.PI * 2);
    ctx.fillStyle = circle.color;
    ctx.globalAlpha = 1;
    ctx.fill();
  }

  ctx.restore();
}

export function redrawOuterLayerOnZoom(zoomFactor: number): void {
  if (!communitiesCache) return;

  const {
    canvas,
    segments,
    changeCircles,
    innerRadius,
    outerRadius,
    changeCircleRadius,
    center,
    canvasSize,
    hoveredCommunity,
  } = communitiesCache;

  const bufferSize = Math.floor(canvasSize * zoomFactor);

  canvas.width = bufferSize;
  canvas.height = bufferSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  communitiesCache.ctx = ctx;
  communitiesCache.zoomFactor = zoomFactor;

  drawOuterLayerOnCanvas(
    ctx,
    segments,
    changeCircles,
    innerRadius,
    outerRadius,
    changeCircleRadius,
    center,
    zoomFactor,
    hoveredCommunity,
  );
}

export function updateCommunityHover(communityId: number | null): void {
  if (!communitiesCache) return;

  communitiesCache.hoveredCommunity = communityId;

  const {
    ctx,
    segments,
    changeCircles,
    innerRadius,
    outerRadius,
    changeCircleRadius,
    center,
    zoomFactor,
  } = communitiesCache;

  drawOuterLayerOnCanvas(
    ctx,
    segments,
    changeCircles,
    innerRadius,
    outerRadius,
    changeCircleRadius,
    center,
    zoomFactor,
    communityId,
  );
}

function getOrCreateCommunitiesCanvas(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  canvasSize: number,
  center: number,
  zoomFactor: number,
): d3.Selection<HTMLCanvasElement, unknown, null, undefined> {
  let foreignObject = g.select<SVGForeignObjectElement>(
    "foreignObject.communities-canvas-container",
  );

  if (foreignObject.empty()) {
    foreignObject = g
      .append("foreignObject")
      .attr("class", "communities-canvas-container")
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
  const bufferSize = Math.floor(canvasSize * zoomFactor);

  if (canvas.empty()) {
    canvas = foreignObject
      .append("xhtml:canvas")
      .attr("class", "communities-canvas")
      .attr("width", bufferSize)
      .attr("height", bufferSize)
      .style("width", `${canvasSize}px`)
      .style("height", `${canvasSize}px`)
      .style("pointer-events", "none") as unknown as d3.Selection<
      HTMLCanvasElement,
      unknown,
      null,
      undefined
    >;
  } else {
    canvas
      .attr("width", bufferSize)
      .attr("height", bufferSize)
      .style("width", `${canvasSize}px`)
      .style("height", `${canvasSize}px`)
      .style("pointer-events", "none");
  }

  return canvas as d3.Selection<HTMLCanvasElement, unknown, null, undefined>;
}

export default drawOuterLayersCanvas;
