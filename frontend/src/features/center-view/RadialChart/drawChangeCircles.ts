import type { NodeChange } from "@/types/network";
import * as d3 from "d3";

export const drawChangeCircles = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  outerRadius: number,
  lastChange: NodeChange | null,
  onTooltipShow: (tooltipData: {
    type: "change";
    nodeId: string;
    x: number;
    y: number;
    lastChange: NodeChange | null;
  }) => void,
  onTooltipHide: () => void,
) => {
  svg.selectAll("circle.change-indicator").remove();
  const circleGroup = svg.append("g").attr("class", "change-circles-group");

  circleGroup
    .selectAll("circle.change-indicator")
    .data(x.domain())
    .join((enter) =>
      enter
        .append("circle")
        .attr("class", "change-indicator")
        .attr("r", 10)
        .attr(
          "transform",
          (d) =>
            `
              rotate(${((x(d)! + x.bandwidth() / 2) * 180) / Math.PI - 90})
              translate(${outerRadius + 20}, 0)
            `,
        )
        .attr("fill", (d) => {
          const isAdded = lastChange?.added && d in lastChange.added;
          const isRemoved = lastChange?.removed && d in lastChange.removed;
          const isUpdated =
            lastChange?.updated &&
            Object.prototype.hasOwnProperty.call(lastChange.updated, d);

          if (isAdded) return "green";
          if (isRemoved) return "red";
          if (isUpdated) return "yellow";
          return "none";
        }),
    )
    .on("mouseover", function (event, d) {
      const [mouseX, mouseY] = d3.pointer(event, document.body);
      onTooltipShow({
        type: "change",
        nodeId: d,
        x: mouseX,
        y: mouseY,
        lastChange,
      });
    })
    .on("mousemove", function (event, d) {
      const [mouseX, mouseY] = d3.pointer(event, document.body);
      onTooltipShow({
        type: "change",
        nodeId: d,
        x: mouseX,
        y: mouseY,
        lastChange,
      });
    })
    .on("mouseout", onTooltipHide);
};

export const updateChangeCircles = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  lastChange: NodeChange | null,
  outerRadius: number,
) => {
  const circles = svg.selectAll<SVGCircleElement, string>(
    "g.change-circles-group circle.change-indicator",
  );

  circles
    .attr("fill", (d) => {
      const isAdded = lastChange?.added && d in lastChange.added;
      const isRemoved = lastChange?.removed && d in lastChange.removed;
      const isUpdated =
        lastChange?.updated &&
        Object.prototype.hasOwnProperty.call(lastChange.updated, d);

      if (isAdded) return "green";
      if (isRemoved) return "red";
      if (isUpdated) return "yellow";
      return "none";
    })
    .attr("transform", (_, i, nodes) => {
      const existing = d3.select(nodes[i]);
      const transform = existing.attr("transform");
      return transform.replace(
        /translate\([^)]*\)/,
        `translate(${outerRadius + 20}, 0)`,
      );
    });
};
