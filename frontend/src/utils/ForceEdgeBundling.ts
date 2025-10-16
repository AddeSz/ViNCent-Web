/**
 * Force-Directed Edge Bundling (FDEB) algorithm implementation
 * Based on: https://github.com/upphiminn/d3.ForceBundle
 *
 * Modernized TypeScript version
 */

export interface Point {
  x: number;
  y: number;
}

export interface Node extends Point {
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

export class ForceEdgeBundling {
  private dataNodes: Map<string, Point> = new Map();
  private dataEdges: Edge[] = [];
  private compatibilityListForEdge: number[][] = [];
  private subdivisionPointsForEdge: Point[][] = [];

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

  private vectorDotProduct(p: Point, q: Point): number {
    return p.x * q.x + p.y * q.y;
  }

  private edgeAsVector(edge: Edge): Point {
    const source = this.dataNodes.get(edge.source)!;
    const target = this.dataNodes.get(edge.target)!;
    return {
      x: target.x - source.x,
      y: target.y - source.y,
    };
  }

  private edgeLength(edge: Edge): number {
    const source = this.dataNodes.get(edge.source)!;
    const target = this.dataNodes.get(edge.target)!;

    if (
      Math.abs(source.x - target.x) < this.eps &&
      Math.abs(source.y - target.y) < this.eps
    ) {
      return this.eps;
    }

    return Math.sqrt(
      Math.pow(source.x - target.x, 2) + Math.pow(source.y - target.y, 2),
    );
  }

  private customEdgeLength(edge: { source: Point; target: Point }): number {
    return Math.sqrt(
      Math.pow(edge.source.x - edge.target.x, 2) +
        Math.pow(edge.source.y - edge.target.y, 2),
    );
  }

  private edgeMidpoint(edge: Edge): Point {
    const source = this.dataNodes.get(edge.source)!;
    const target = this.dataNodes.get(edge.target)!;

    return {
      x: (source.x + target.x) / 2.0,
      y: (source.y + target.y) / 2.0,
    };
  }

  private computeDividedEdgeLength(edgeIdx: number): number {
    let length = 0;
    const points = this.subdivisionPointsForEdge[edgeIdx];

    for (let i = 1; i < points.length; i++) {
      length += this.euclideanDistance(points[i], points[i - 1]);
    }

    return length;
  }

  private euclideanDistance(p: Point, q: Point): number {
    return Math.sqrt(Math.pow(p.x - q.x, 2) + Math.pow(p.y - q.y, 2));
  }

  private projectPointOnLine(
    p: Point,
    Q: { source: Point; target: Point },
  ): Point {
    const L = Math.sqrt(
      (Q.target.x - Q.source.x) * (Q.target.x - Q.source.x) +
        (Q.target.y - Q.source.y) * (Q.target.y - Q.source.y),
    );
    const r =
      ((Q.source.y - p.y) * (Q.source.y - Q.target.y) -
        (Q.source.x - p.x) * (Q.target.x - Q.source.x)) /
      (L * L);

    return {
      x: Q.source.x + r * (Q.target.x - Q.source.x),
      y: Q.source.y + r * (Q.target.y - Q.source.y),
    };
  }

  private initializeEdgeSubdivisions(): void {
    for (let i = 0; i < this.dataEdges.length; i++) {
      if (this.P_initial === 1) {
        this.subdivisionPointsForEdge[i] = [];
      } else {
        const source = this.dataNodes.get(this.dataEdges[i].source)!;
        const target = this.dataNodes.get(this.dataEdges[i].target)!;
        this.subdivisionPointsForEdge[i] = [source, target];
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

    const x = (prev.x - crnt.x + next.x - crnt.x) * kP;
    const y = (prev.y - crnt.y + next.y - crnt.y) * kP;

    return { x, y };
  }

  private applyElectrostaticForce(edgeIdx: number, i: number): Point {
    const sumOfForces: Point = { x: 0, y: 0 };
    const compatibleEdgesList = this.compatibilityListForEdge[edgeIdx];

    for (const oe of compatibleEdgesList) {
      const force: Point = {
        x:
          this.subdivisionPointsForEdge[oe][i].x -
          this.subdivisionPointsForEdge[edgeIdx][i].x,
        y:
          this.subdivisionPointsForEdge[oe][i].y -
          this.subdivisionPointsForEdge[edgeIdx][i].y,
      };

      if (Math.abs(force.x) > this.eps || Math.abs(force.y) > this.eps) {
        const diff =
          1 /
          Math.pow(
            this.customEdgeLength({
              source: this.subdivisionPointsForEdge[oe][i],
              target: this.subdivisionPointsForEdge[edgeIdx][i],
            }),
            1,
          );

        sumOfForces.x += force.x * diff;
        sumOfForces.y += force.y * diff;
      }
    }

    return sumOfForces;
  }

  private applyResultingForcesOnSubdivisionPoints(
    edgeIdx: number,
    P: number,
    S: number,
  ): Point[] {
    const kP = this.K / (this.edgeLength(this.dataEdges[edgeIdx]) * (P + 1));
    const resultingForcesForSubdivisionPoints: Point[] = [{ x: 0, y: 0 }];

    for (let i = 1; i < P + 1; i++) {
      const springForce = this.applySpringForce(edgeIdx, i, kP);
      const electrostaticForce = this.applyElectrostaticForce(edgeIdx, i);

      resultingForcesForSubdivisionPoints.push({
        x: S * (springForce.x + electrostaticForce.x),
        y: S * (springForce.y + electrostaticForce.y),
      });
    }

    resultingForcesForSubdivisionPoints.push({ x: 0, y: 0 });
    return resultingForcesForSubdivisionPoints;
  }

  private updateEdgeDivisions(P: number): void {
    for (let edgeIdx = 0; edgeIdx < this.dataEdges.length; edgeIdx++) {
      const edge = this.dataEdges[edgeIdx];
      const source = this.dataNodes.get(edge.source)!;
      const target = this.dataNodes.get(edge.target)!;

      if (P === 1) {
        this.subdivisionPointsForEdge[edgeIdx] = [
          source,
          this.edgeMidpoint(edge),
          target,
        ];
      } else {
        const dividedEdgeLength = this.computeDividedEdgeLength(edgeIdx);
        const segmentLength = dividedEdgeLength / (P + 1);
        let currentSegmentLength = segmentLength;
        const newSubdivisionPoints: Point[] = [source];
        const oldPoints = this.subdivisionPointsForEdge[edgeIdx];

        for (let i = 1; i < oldPoints.length; i++) {
          let oldSegmentLength = this.euclideanDistance(
            oldPoints[i],
            oldPoints[i - 1],
          );

          while (oldSegmentLength > currentSegmentLength) {
            const percentPosition = currentSegmentLength / oldSegmentLength;
            const newPoint: Point = {
              x:
                oldPoints[i - 1].x +
                percentPosition * (oldPoints[i].x - oldPoints[i - 1].x),
              y:
                oldPoints[i - 1].y +
                percentPosition * (oldPoints[i].y - oldPoints[i - 1].y),
            };
            newSubdivisionPoints.push(newPoint);

            oldSegmentLength -= currentSegmentLength;
            currentSegmentLength = segmentLength;
          }
          currentSegmentLength -= oldSegmentLength;
        }

        newSubdivisionPoints.push(target);
        this.subdivisionPointsForEdge[edgeIdx] = newSubdivisionPoints;
      }
    }
  }

  private angleCompatibility(P: Edge, Q: Edge): number {
    return Math.abs(
      this.vectorDotProduct(this.edgeAsVector(P), this.edgeAsVector(Q)) /
        (this.edgeLength(P) * this.edgeLength(Q)),
    );
  }

  private scaleCompatibility(P: Edge, Q: Edge): number {
    const lavg = (this.edgeLength(P) + this.edgeLength(Q)) / 2.0;
    return (
      2.0 /
      (lavg / Math.min(this.edgeLength(P), this.edgeLength(Q)) +
        Math.max(this.edgeLength(P), this.edgeLength(Q)) / lavg)
    );
  }

  private positionCompatibility(P: Edge, Q: Edge): number {
    const lavg = (this.edgeLength(P) + this.edgeLength(Q)) / 2.0;
    const midP = this.edgeMidpoint(P);
    const midQ = this.edgeMidpoint(Q);
    return lavg / (lavg + this.euclideanDistance(midP, midQ));
  }

  private edgeVisibility(P: Edge, Q: Edge): number {
    const sourceP = this.dataNodes.get(P.source)!;
    const targetP = this.dataNodes.get(P.target)!;
    const sourceQ = this.dataNodes.get(Q.source)!;
    const targetQ = this.dataNodes.get(Q.target)!;

    const I0 = this.projectPointOnLine(sourceQ, {
      source: sourceP,
      target: targetP,
    });
    const I1 = this.projectPointOnLine(targetQ, {
      source: sourceP,
      target: targetP,
    });

    const midI: Point = {
      x: (I0.x + I1.x) / 2.0,
      y: (I0.y + I1.y) / 2.0,
    };
    const midP = this.edgeMidpoint(P);

    return Math.max(
      0,
      1 -
        (2 * this.euclideanDistance(midP, midI)) /
          this.euclideanDistance(I0, I1),
    );
  }

  private visibilityCompatibility(P: Edge, Q: Edge): number {
    return Math.min(this.edgeVisibility(P, Q), this.edgeVisibility(Q, P));
  }

  private compatibilityScore(P: Edge, Q: Edge): number {
    return (
      this.angleCompatibility(P, Q) *
      this.scaleCompatibility(P, Q) *
      this.positionCompatibility(P, Q) *
      this.visibilityCompatibility(P, Q)
    );
  }

  private areCompatible(P: Edge, Q: Edge): boolean {
    return this.compatibilityScore(P, Q) >= this.compatibilityThreshold;
  }

  private computeCompatibilityLists(): void {
    for (let e = 0; e < this.dataEdges.length - 1; e++) {
      for (let oe = e + 1; oe < this.dataEdges.length; oe++) {
        if (this.areCompatible(this.dataEdges[e], this.dataEdges[oe])) {
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

    this.initializeEdgeSubdivisions();
    this.initializeCompatibilityLists();
    this.updateEdgeDivisions(P);
    this.computeCompatibilityLists();

    for (let cycle = 0; cycle < this.C; cycle++) {
      for (let iteration = 0; iteration < I; iteration++) {
        const forces: Point[][] = [];

        for (let edge = 0; edge < this.dataEdges.length; edge++) {
          forces[edge] = this.applyResultingForcesOnSubdivisionPoints(
            edge,
            P,
            S,
          );
        }

        for (let e = 0; e < this.dataEdges.length; e++) {
          for (let i = 0; i < P + 1; i++) {
            this.subdivisionPointsForEdge[e][i].x += forces[e][i].x;
            this.subdivisionPointsForEdge[e][i].y += forces[e][i].y;
          }
        }
      }

      S = S / 2;
      P = P * this.P_rate;
      I = this.I_rate * I;

      this.updateEdgeDivisions(P);
    }

    return this.subdivisionPointsForEdge;
  }

  public setNodes(nodes: Node[]): this {
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
