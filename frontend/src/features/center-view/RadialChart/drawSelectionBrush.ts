import { handleBrushSelection } from "@/utils/ColorHelper";
import * as d3 from "d3";

const drawSelectionBrush = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  outerRadius: number,
  maxLabelWidth: number,
  x: d3.ScaleBand<string>,
  isViewActive: boolean,
) => {
  const innerRadius = outerRadius;
  const outerRadiusBrush = outerRadius + maxLabelWidth + 40;

  const mouseToAngle = (x: number, y: number): number => {
    return Math.atan2(x, -y);
  };

  const normalizeAngle = (angle: number): number => {
    const normalized = angle % (2 * Math.PI);
    return normalized < 0 ? normalized + 2 * Math.PI : normalized;
  };

  const getSelectedIds = (startAngle: number, endAngle: number): string[] => {
    const selectedIds: string[] = [];
    const domain = x.domain();

    for (const id of domain) {
      const bandStart = x(id);
      const bandCenter = bandStart! + x.bandwidth() / 2;

      if (isAngleInRange(bandCenter, startAngle, endAngle)) {
        selectedIds.push(id);
      }
    }

    return selectedIds;
  };

  const isAngleInRange = (
    angle: number,
    start: number,
    end: number,
  ): boolean => {
    const normalizedAngle = normalizeAngle(angle);
    const normalizedStart = normalizeAngle(start);
    const normalizedEnd = normalizeAngle(end);

    if (normalizedEnd < normalizedStart) {
      return (
        normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd
      );
    }

    return (
      normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd
    );
  };

  let brushGroup = svg.select<SVGGElement>("g.brush-group");
  if (brushGroup.empty()) {
    brushGroup = svg.insert("g").attr("class", "brush-group");
  }

  let backgroundRing = brushGroup.select<SVGPathElement>(
    "path.brush-background",
  );
  if (backgroundRing.empty()) {
    backgroundRing = brushGroup
      .append("path")
      .attr("class", "brush-background")
      .attr("fill", "#ddd")
      .attr("fill-opacity", 0)
      .style("pointer-events", "none");
  }

  let brushArcPath = brushGroup.select<SVGPathElement>("path.brush-selection");
  if (brushArcPath.empty()) {
    brushArcPath = brushGroup
      .append("path")
      .attr("class", "brush-selection")
      .attr("fill", "steelblue")
      .attr("opacity", 0.5)
      .style("pointer-events", "none");
  }

  let currentAngle = 0;
  let previousAngle = 0;
  let startAngle = 0;
  let totalRotation = 0;
  let isShiftPressed = false;

  const updateBrushSelection = () => {
    const start = normalizeAngle(startAngle);
    const clampedRotation = Math.max(
      -2 * Math.PI,
      Math.min(2 * Math.PI, totalRotation),
    );

    brushArcPath.attr(
      "d",
      d3.arc()({
        innerRadius,
        outerRadius: outerRadiusBrush,
        startAngle: start,
        endAngle: start + clampedRotation,
      }),
    );
  };

  const clearBrushSelection = () => {
    brushArcPath
      .transition()
      .duration(200)
      .attr("opacity", 0)
      .on("end", () => {
        brushArcPath.attr("d", null).attr("opacity", 0.5);
      });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Shift" && isViewActive) {
      isShiftPressed = true;

      svg
        .selectAll(".labels-group, .change-circles-group")
        .style("pointer-events", "none");

      svg
        .select("foreignObject.arc-canvas-container")
        .select("canvas.arc-canvas")
        .style("pointer-events", "none");

      backgroundRing
        .style("cursor", "crosshair")
        .style("pointer-events", "all")
        .transition()
        .duration(150)
        .attr("fill-opacity", 0.05);
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Shift" && isViewActive) {
      isShiftPressed = false;

      svg
        .selectAll(".labels-group, .change-circles-group")
        .style("pointer-events", "all");

      svg
        .select("foreignObject.arc-canvas-container")
        .select("canvas.arc-canvas")
        .style("pointer-events", "all");

      backgroundRing
        .style("cursor", "default")
        .transition()
        .duration(150)
        .attr("fill-opacity", 0)
        .on("end", () => {
          backgroundRing.style("pointer-events", "none");
        });

      clearBrushSelection();
    }
  };

  backgroundRing.on(".drag", null);
  d3.select(window)
    .on("keydown.radialBrush", null)
    .on("keyup.radialBrush", null);

  if (!isViewActive) {
    startAngle = 0;
    totalRotation = 0;
    currentAngle = 0;
    previousAngle = 0;
    isShiftPressed = false;
    backgroundRing
      .style("pointer-events", "none")
      .style("cursor", "default")
      .attr("fill-opacity", 0);

    brushArcPath.attr("d", null);
    return;
  }

  d3.select(window)
    .on("keydown.radialBrush", handleKeyDown)
    .on("keyup.radialBrush", handleKeyUp);

  backgroundRing.attr(
    "d",
    d3.arc()({
      innerRadius,
      outerRadius: outerRadiusBrush,
      startAngle: 0,
      endAngle: 2 * Math.PI,
    }),
  );

  const drag = d3
    .drag<SVGPathElement, unknown>()
    .on("start", (event) => {
      if (!isShiftPressed) return;

      const [x, y] = d3.pointer(event, svg.node());
      const r = Math.sqrt(x * x + y * y);

      if (r >= innerRadius && r <= outerRadiusBrush) {
        startAngle = mouseToAngle(x, y);
        currentAngle = startAngle;
        previousAngle = startAngle;
        totalRotation = 0;
        updateBrushSelection();
      }
    })
    .on("drag", (event) => {
      if (!isShiftPressed) return;

      const [x, y] = d3.pointer(event, svg.node());
      const r = Math.sqrt(x * x + y * y);

      if (r >= innerRadius && r <= outerRadiusBrush) {
        currentAngle = mouseToAngle(x, y);

        let delta = currentAngle - previousAngle;

        if (delta > Math.PI) {
          delta -= 2 * Math.PI;
        } else if (delta < -Math.PI) {
          delta += 2 * Math.PI;
        }

        totalRotation += delta;
        totalRotation = Math.max(
          -2 * Math.PI,
          Math.min(2 * Math.PI, totalRotation),
        );

        previousAngle = currentAngle;
        updateBrushSelection();
      }
    })
    .on("end", () => {
      if (!isShiftPressed || totalRotation === 0) {
        setTimeout(clearBrushSelection, 50);
        return;
      }

      let start = normalizeAngle(startAngle);
      let end = normalizeAngle(startAngle + totalRotation);

      if (totalRotation < 0) {
        [start, end] = [end, start];
      }
      const selectedIds = getSelectedIds(start, end);
      handleBrushSelection(selectedIds);

      setTimeout(clearBrushSelection, 50);
    });

  backgroundRing.call(drag);

  return () => {
    backgroundRing.on(".drag", null);
    d3.select(window)
      .on("keydown.radialBrush", null)
      .on("keyup.radialBrush", null);

    currentAngle = 0;
    previousAngle = 0;
    startAngle = 0;
    totalRotation = 0;
    isShiftPressed = false;
  };
};

export default drawSelectionBrush;
