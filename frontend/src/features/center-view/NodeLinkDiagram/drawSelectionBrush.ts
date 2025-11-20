import type { Node } from "@/types/network";
import { handleBrushSelection } from "@/utils/ColorHelper";
import * as d3 from "d3";

const drawSelectionBrush = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodes: Node[],
  isViewActive: boolean,
) => {
  const isPointInPolygon = (
    point: [number, number],
    polygon: [number, number][],
  ): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect =
        yi > point[1] !== yj > point[1] &&
        point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const getSelectedIds = (lassoPoints: [number, number][]): string[] => {
    if (lassoPoints.length < 3) return [];

    const selectedIds: string[] = [];

    for (const node of nodes) {
      if (node.x === undefined || node.y === undefined) continue;

      const point: [number, number] = [node.x, node.y];
      if (isPointInPolygon(point, lassoPoints)) {
        selectedIds.push(node.id);
      }
    }

    return selectedIds;
  };

  let brushGroup = svg.select<SVGGElement>("g.lasso-group");
  if (brushGroup.empty()) {
    brushGroup = svg.insert("g", ":first-child").attr("class", "lasso-group");
  }

  let backgroundOverlay =
    brushGroup.select<SVGRectElement>("rect.lasso-overlay");
  if (backgroundOverlay.empty()) {
    backgroundOverlay = brushGroup
      .append("rect")
      .attr("class", "lasso-overlay")
      .attr("x", -10000)
      .attr("y", -10000)
      .attr("width", 20000)
      .attr("height", 20000)
      .attr("fill-opacity", 0)
      .attr("fill", "#ddd")
      .style("pointer-events", "none");
  }

  let lassoPath = brushGroup.select<SVGPathElement>("path.lasso-selection");
  if (lassoPath.empty()) {
    lassoPath = brushGroup
      .append("path")
      .attr("class", "lasso-selection")
      .attr("fill", "steelblue")
      .attr("fill-opacity", 0.2)
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .style("pointer-events", "none");
  }

  let lassoPoints: [number, number][] = [];
  let isShiftPressed = false;
  let isDragging = false;

  const updateLassoPath = () => {
    if (lassoPoints.length < 2) {
      lassoPath.attr("d", null);
      return;
    }

    const lineGenerator = d3.line().curve(d3.curveLinearClosed);
    lassoPath.attr("d", lineGenerator(lassoPoints));
  };

  const clearLassoSelection = () => {
    lassoPath
      .transition()
      .duration(200)
      .attr("opacity", 0)
      .on("end", () => {
        lassoPath.attr("d", null).attr("opacity", 1);
        lassoPoints = [];
      });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Shift" && !isShiftPressed && isViewActive) {
      isShiftPressed = true;

      svg
        .selectAll(".links-group, .nodes-group")
        .style("pointer-events", "none");

      backgroundOverlay
        .style("cursor", "crosshair")
        .style("pointer-events", "all")
        .transition()
        .duration(150)
        .attr("fill-opacity", 0.02);
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Shift" && isViewActive) {
      isShiftPressed = false;
      isDragging = false;
      lassoPoints = [];

      svg.selectAll(".links-group, .nodes-group").style("pointer-events", null);

      backgroundOverlay
        .style("cursor", "default")
        .transition()
        .duration(150)
        .attr("fill-opacity", 0)
        .on("end", () => {
          backgroundOverlay.style("pointer-events", "none");
        });

      clearLassoSelection();
    }
  };

  backgroundOverlay.on(".drag", null);
  d3.select(window)
    .on("keydown.nodeLinkLasso", null)
    .on("keyup.nodeLinkLasso", null);

  if (!isViewActive) {
    isShiftPressed = false;
    isDragging = false;
    lassoPoints = [];

    svg.selectAll(".links-group, .nodes-group").style("pointer-events", null);

    backgroundOverlay
      .style("pointer-events", "none")
      .style("cursor", "default")
      .attr("fill-opacity", 0);

    lassoPath.attr("d", null);
    return;
  }

  d3.select(window)
    .on("keydown.nodeLinkLasso", handleKeyDown)
    .on("keyup.nodeLinkLasso", handleKeyUp);

  const drag = d3
    .drag<SVGRectElement, unknown>()
    .on("start", (event) => {
      if (!isShiftPressed) return;

      isDragging = true;
      const [x, y] = d3.pointer(event, svg.node());
      lassoPoints = [[x, y]];
      updateLassoPath();
    })
    .on("drag", (event) => {
      if (!isShiftPressed || !isDragging) return;
      if (!lassoPoints || lassoPoints.length === 0) return;
      const [x, y] = d3.pointer(event, svg.node());

      const lastPoint = lassoPoints[lassoPoints.length - 1];
      const distance = Math.sqrt(
        Math.pow(x - lastPoint[0], 2) + Math.pow(y - lastPoint[1], 2),
      );

      if (distance > 5) {
        lassoPoints.push([x, y]);
        updateLassoPath();
      }
    })
    .on("end", () => {
      if (!isShiftPressed || !isDragging || lassoPoints.length < 3) {
        isDragging = false;
        lassoPoints = [];
        setTimeout(clearLassoSelection, 50);
        return;
      }

      isDragging = false;
      const selectedIds = getSelectedIds(lassoPoints);

      if (selectedIds.length > 0) {
        handleBrushSelection(selectedIds);
      }

      setTimeout(clearLassoSelection, 50);
    });

  backgroundOverlay.call(drag);

  return () => {
    backgroundOverlay.on(".drag", null);
    d3.select(window)
      .on("keydown.nodeLinkLasso", null)
      .on("keyup.nodeLinkLasso", null);

    isShiftPressed = false;
    isDragging = false;
    lassoPoints = [];
  };
};

export default drawSelectionBrush;
