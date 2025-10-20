import type { Link } from "@/types/network";
import {
  ForceEdgeBundling,
  type ForceEdgeBundlingOptions,
  type ForceNode,
} from "@/utils/ForceEdgeBundling";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";

export const createAngleMap = (x: d3.ScaleBand<string>) => {
  const angleMap = new Map<string, number>();
  x.domain().forEach((id) => {
    const angle = x(id);
    if (angle !== undefined) angleMap.set(id, angle + x.bandwidth() / 2);
  });
  return angleMap;
};

export const createBezierPath = (
  sourceAngle: number,
  targetAngle: number,
  r: number,
) => {
  const sx = Math.cos(sourceAngle - Math.PI / 2) * r;
  const sy = Math.sin(sourceAngle - Math.PI / 2) * r;
  const tx = Math.cos(targetAngle - Math.PI / 2) * r;
  const ty = Math.sin(targetAngle - Math.PI / 2) * r;
  const bend = 0.6;

  const path = d3.path();
  path.moveTo(sx, sy);
  path.bezierCurveTo(sx * bend, sy * bend, tx * bend, ty * bend, tx, ty);
  return path.toString();
};

export const createHierarchyPath = (
  sourceAngle: number,
  targetAngle: number,
  innerRadius: number,
) => {
  const line = d3
    .lineRadial<{ x: number; y: number }>()
    .curve(d3.curveBundle.beta(1))
    .radius((d) => d.y)
    .angle((d) => d.x);

  return (
    line([
      { x: sourceAngle, y: innerRadius },
      { x: (sourceAngle + targetAngle) / 2, y: innerRadius * 0.3 },
      { x: targetAngle, y: innerRadius },
    ]) ?? null
  );
};

export const createFdebPaths = (
  links: Link[],
  x: d3.ScaleBand<string>,
  innerRadius: number,
  fdebSettings: ForceEdgeBundlingOptions,
) => {
  const nodes: ForceNode[] = x.domain().map((id) => {
    const angle = (x(id) ?? 0) + x.bandwidth() / 2;
    return {
      id,
      x: Math.cos(angle - Math.PI / 2) * innerRadius,
      y: Math.sin(angle - Math.PI / 2) * innerRadius,
    };
  });

  const nodeIds = new Set(nodes.map((n) => n.id));
  const validEdges = links
    .map((l, i) => ({
      index: i,
      source: getNodeId(l.source),
      target: getNodeId(l.target),
    }))
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  const edgesForBundling = validEdges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  if (!edgesForBundling.length) return new Array(links.length).fill(null);

  const fdeb = new ForceEdgeBundling(fdebSettings)
    .setNodes(nodes)
    .setEdges(edgesForBundling);
  const bundled = fdeb.bundle();

  const line = d3
    .line<{ x: number; y: number }>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(d3.curveBundle.beta(0.85));

  const fdebPaths = new Array(links.length).fill(null);
  bundled.forEach((b, j) => {
    const originalIndex = validEdges[j].index;
    fdebPaths[originalIndex] = line(b) ?? null;
  });

  return fdebPaths;
};
