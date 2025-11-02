/**
 * Force-Directed Edge Bundling (FDEB) algorithm implementation
 * Based on: https://github.com/upphiminn/d3.ForceBundle
 *
 * Modernized TypeScript version by me
 */

export interface Point {
  x: number;
  y: number;
}

export interface ForceNode extends Point {
  id: string;
}

export interface Edge {
  source: string;
  target: string;
}

export interface ForceEdgeBundlingOptions {
  bundlingStiffness?: number;
  stepSize?: number;
  cycles?: number;
  iterations?: number;
  iterationsRate?: number;
  subdivisionPointsSeed?: number;
  subdivisionRate?: number;
  compatibilityThreshold?: number;
}

interface EdgeCache {
  vector: Point;
  length: number;
  midpoint: Point;
  sourcePoint: Point;
  targetPoint: Point;
}

export class ForceEdgeBundling {
  private dataNodes: Map<string, Point> = new Map();
  private dataEdges: Edge[] = [];
  private compatibilityListForEdge: number[][] = [];
  private subdivisionPointsForEdge: Point[][] = [];

  private edgeCache: EdgeCache[] = [];

  // Algorithm parameters
  private K: number; // global bundling constant controlling edge stiffness
  private S_initial: number; // initial distance to move points
  private P_initial: number; // initial subdivision number
  private P_rate: number; // subdivision rate increase
  private C: number; // number of cycles to perform
  private I_initial: number; // initial number of iterations for cycle
  private I_rate: number; // rate at which iteration number decreases
  private compatibilityThreshold: number;
  private readonly eps = 1e-6;

  constructor(options: ForceEdgeBundlingOptions = {}) {
    this.K = options.bundlingStiffness ?? 0.1;
    this.S_initial = options.stepSize ?? 0.1;
    this.P_initial = options.subdivisionPointsSeed ?? 1;
    this.P_rate = options.subdivisionRate ?? 2;
    this.C = options.cycles ?? 6;
    this.I_initial = options.iterations ?? 90;
    this.I_rate = options.iterationsRate ?? 0.6666667;
    this.compatibilityThreshold = options.compatibilityThreshold ?? 0.6;
  }

  private buildEdgeCache(): void {
    this.edgeCache = new Array(this.dataEdges.length);

    for (let i = 0; i < this.dataEdges.length; i++) {
      const edge = this.dataEdges[i];
      const source = this.dataNodes.get(edge.source)!;
      const target = this.dataNodes.get(edge.target)!;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const length = Math.sqrt(dx * dx + dy * dy) || this.eps;

      this.edgeCache[i] = {
        vector: { x: dx, y: dy },
        length,
        midpoint: {
          x: (source.x + target.x) * 0.5,
          y: (source.y + target.y) * 0.5,
        },
        sourcePoint: source,
        targetPoint: target,
      };
    }
  }

  private projectPointOnLine(
    p: Point,
    Q: { source: Point; target: Point },
  ): Point {
    const dx = Q.target.x - Q.source.x;
    const dy = Q.target.y - Q.source.y;
    const L_sq = dx * dx + dy * dy;
    const r =
      ((Q.source.y - p.y) * (Q.source.y - Q.target.y) -
        (Q.source.x - p.x) * (Q.target.x - Q.source.x)) /
      L_sq;

    return {
      x: Q.source.x + r * dx,
      y: Q.source.y + r * dy,
    };
  }

  private initializeEdgeSubdivisions(): void {
    this.subdivisionPointsForEdge = new Array(this.dataEdges.length);

    for (let i = 0; i < this.dataEdges.length; i++) {
      if (this.P_initial === 1) {
        this.subdivisionPointsForEdge[i] = [];
      } else {
        const cache = this.edgeCache[i];
        this.subdivisionPointsForEdge[i] = [
          cache.sourcePoint,
          cache.targetPoint,
        ];
      }
    }
  }

  private initializeCompatibilityLists(): void {
    this.compatibilityListForEdge = Array.from(
      { length: this.dataEdges.length },
      () => [],
    );
  }

  private filterSelfLoops(edgeList: Edge[]): Edge[] {
    return edgeList.filter((edge) => {
      const source = this.dataNodes.get(edge.source)!;
      const target = this.dataNodes.get(edge.target)!;
      return source.x !== target.x || source.y !== target.y;
    });
  }

  private applySpringForce(edgeIdx: number, i: number, kP: number): Point {
    const points = this.subdivisionPointsForEdge[edgeIdx];
    const prev = points[i - 1];
    const next = points[i + 1];
    const crnt = points[i];

    return {
      x: (prev.x - crnt.x + next.x - crnt.x) * kP,
      y: (prev.y - crnt.y + next.y - crnt.y) * kP,
    };
  }

  private applyElectrostaticForce(edgeIdx: number, i: number): Point {
    let sumX = 0;
    let sumY = 0;
    const compatibleEdges = this.compatibilityListForEdge[edgeIdx];
    const currentPoint = this.subdivisionPointsForEdge[edgeIdx][i];

    for (let j = 0; j < compatibleEdges.length; j++) {
      const oe = compatibleEdges[j];
      const otherPoint = this.subdivisionPointsForEdge[oe][i];

      const dx = otherPoint.x - currentPoint.x;
      const dy = otherPoint.y - currentPoint.y;

      if (Math.abs(dx) > this.eps || Math.abs(dy) > this.eps) {
        const distSq = dx * dx + dy * dy;
        const diff = 1 / Math.sqrt(distSq);

        sumX += dx * diff;
        sumY += dy * diff;
      }
    }

    return { x: sumX, y: sumY };
  }

  private applyResultingForcesOnSubdivisionPoints(
    edgeIdx: number,
    P: number,
    S: number,
  ): Point[] {
    const kP = this.K / (this.edgeCache[edgeIdx].length * (P + 1));
    const forces = new Array(P + 2);

    forces[0] = { x: 0, y: 0 };

    for (let i = 1; i < P + 1; i++) {
      const springForce = this.applySpringForce(edgeIdx, i, kP);
      const electrostaticForce = this.applyElectrostaticForce(edgeIdx, i);

      forces[i] = {
        x: S * (springForce.x + electrostaticForce.x),
        y: S * (springForce.y + electrostaticForce.y),
      };
    }

    forces[P + 1] = { x: 0, y: 0 };
    return forces;
  }

  private computeDividedEdgeLength(edgeIdx: number): number {
    let length = 0;
    const points = this.subdivisionPointsForEdge[edgeIdx];

    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }

    return length;
  }

  private updateEdgeDivisions(P: number): void {
    for (let edgeIdx = 0; edgeIdx < this.dataEdges.length; edgeIdx++) {
      const cache = this.edgeCache[edgeIdx];

      if (P === 1) {
        this.subdivisionPointsForEdge[edgeIdx] = [
          cache.sourcePoint,
          cache.midpoint,
          cache.targetPoint,
        ];
      } else {
        const dividedEdgeLength = this.computeDividedEdgeLength(edgeIdx);
        const segmentLength = dividedEdgeLength / (P + 1);
        let currentSegmentLength = segmentLength;
        const newSubdivisionPoints: Point[] = [cache.sourcePoint];
        const oldPoints = this.subdivisionPointsForEdge[edgeIdx];

        for (let i = 1; i < oldPoints.length; i++) {
          const dx = oldPoints[i].x - oldPoints[i - 1].x;
          const dy = oldPoints[i].y - oldPoints[i - 1].y;
          let oldSegmentLength = Math.sqrt(dx * dx + dy * dy);

          while (oldSegmentLength > currentSegmentLength) {
            const percentPosition = currentSegmentLength / oldSegmentLength;
            newSubdivisionPoints.push({
              x: oldPoints[i - 1].x + percentPosition * dx,
              y: oldPoints[i - 1].y + percentPosition * dy,
            });

            oldSegmentLength -= currentSegmentLength;
            currentSegmentLength = segmentLength;
          }
          currentSegmentLength -= oldSegmentLength;
        }

        newSubdivisionPoints.push(cache.targetPoint);
        this.subdivisionPointsForEdge[edgeIdx] = newSubdivisionPoints;
      }
    }
  }

  private angleCompatibility(edgeIdxP: number, edgeIdxQ: number): number {
    const cacheP = this.edgeCache[edgeIdxP];
    const cacheQ = this.edgeCache[edgeIdxQ];

    const dotProduct =
      cacheP.vector.x * cacheQ.vector.x + cacheP.vector.y * cacheQ.vector.y;

    return Math.abs(dotProduct / (cacheP.length * cacheQ.length));
  }

  private scaleCompatibility(edgeIdxP: number, edgeIdxQ: number): number {
    const lenP = this.edgeCache[edgeIdxP].length;
    const lenQ = this.edgeCache[edgeIdxQ].length;
    const lavg = (lenP + lenQ) * 0.5;
    const minLen = Math.min(lenP, lenQ);
    const maxLen = Math.max(lenP, lenQ);

    return 2.0 / (lavg / minLen + maxLen / lavg);
  }

  private positionCompatibility(edgeIdxP: number, edgeIdxQ: number): number {
    const cacheP = this.edgeCache[edgeIdxP];
    const cacheQ = this.edgeCache[edgeIdxQ];
    const lavg = (cacheP.length + cacheQ.length) * 0.5;

    const dx = cacheP.midpoint.x - cacheQ.midpoint.x;
    const dy = cacheP.midpoint.y - cacheQ.midpoint.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return lavg / (lavg + dist);
  }

  private edgeVisibility(edgeIdxP: number, edgeIdxQ: number): number {
    const cacheP = this.edgeCache[edgeIdxP];
    const cacheQ = this.edgeCache[edgeIdxQ];

    const I0 = this.projectPointOnLine(cacheQ.sourcePoint, {
      source: cacheP.sourcePoint,
      target: cacheP.targetPoint,
    });
    const I1 = this.projectPointOnLine(cacheQ.targetPoint, {
      source: cacheP.sourcePoint,
      target: cacheP.targetPoint,
    });

    const midIx = (I0.x + I1.x) * 0.5;
    const midIy = (I0.y + I1.y) * 0.5;

    const dx1 = cacheP.midpoint.x - midIx;
    const dy1 = cacheP.midpoint.y - midIy;
    const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

    const dx2 = I0.x - I1.x;
    const dy2 = I0.y - I1.y;
    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    return Math.max(0, 1 - (2 * dist1) / dist2);
  }

  private visibilityCompatibility(edgeIdxP: number, edgeIdxQ: number): number {
    return Math.min(
      this.edgeVisibility(edgeIdxP, edgeIdxQ),
      this.edgeVisibility(edgeIdxQ, edgeIdxP),
    );
  }

  private compatibilityScore(edgeIdxP: number, edgeIdxQ: number): number {
    return (
      this.angleCompatibility(edgeIdxP, edgeIdxQ) *
      this.scaleCompatibility(edgeIdxP, edgeIdxQ) *
      this.positionCompatibility(edgeIdxP, edgeIdxQ) *
      this.visibilityCompatibility(edgeIdxP, edgeIdxQ)
    );
  }

  private computeCompatibilityLists(): void {
    for (let e = 0; e < this.dataEdges.length - 1; e++) {
      for (let oe = e + 1; oe < this.dataEdges.length; oe++) {
        if (this.compatibilityScore(e, oe) >= this.compatibilityThreshold) {
          this.compatibilityListForEdge[e].push(oe);
          this.compatibilityListForEdge[oe].push(e);
        }
      }
    }
  }

  public bundle(): Point[][] {
    let S = this.S_initial;
    let I = this.I_initial;
    let P = this.P_initial;

    this.buildEdgeCache();

    this.initializeEdgeSubdivisions();
    this.initializeCompatibilityLists();
    this.updateEdgeDivisions(P);
    this.computeCompatibilityLists();

    for (let cycle = 0; cycle < this.C; cycle++) {
      for (let iteration = 0; iteration < I; iteration++) {
        const forces: Point[][] = new Array(this.dataEdges.length);

        for (let edge = 0; edge < this.dataEdges.length; edge++) {
          forces[edge] = this.applyResultingForcesOnSubdivisionPoints(
            edge,
            P,
            S,
          );
        }

        for (let e = 0; e < this.dataEdges.length; e++) {
          const edgeForces = forces[e];
          const points = this.subdivisionPointsForEdge[e];

          for (let i = 0; i < P + 1; i++) {
            points[i].x += edgeForces[i].x;
            points[i].y += edgeForces[i].y;
          }
        }
      }

      S *= 0.5;
      P *= this.P_rate;
      I *= this.I_rate;

      this.updateEdgeDivisions(P);
    }

    return this.subdivisionPointsForEdge;
  }

  public setNodes(nodes: ForceNode[]): this {
    this.dataNodes.clear();
    for (const node of nodes) {
      this.dataNodes.set(node.id, { x: node.x, y: node.y });
    }
    return this;
  }

  public setEdges(edges: Edge[]): this {
    this.dataEdges = this.filterSelfLoops(edges);
    return this;
  }

  public setBundlingStiffness(k: number): this {
    this.K = k;
    return this;
  }

  public setStepSize(step: number): this {
    this.S_initial = step;
    return this;
  }

  public setCycles(c: number): this {
    this.C = c;
    return this;
  }

  public setIterations(i: number): this {
    this.I_initial = i;
    return this;
  }

  public setIterationsRate(i: number): this {
    this.I_rate = i;
    return this;
  }

  public setSubdivisionPointsSeed(p: number): this {
    this.P_initial = p;
    return this;
  }

  public setSubdivisionRate(r: number): this {
    this.P_rate = r;
    return this;
  }

  public setCompatibilityThreshold(t: number): this {
    this.compatibilityThreshold = t;
    return this;
  }

  public getNodes(): Map<string, Point> {
    return this.dataNodes;
  }

  public getEdges(): Edge[] {
    return this.dataEdges;
  }
}

export function forceEdgeBundling(
  options?: ForceEdgeBundlingOptions,
): ForceEdgeBundling {
  return new ForceEdgeBundling(options);
}
