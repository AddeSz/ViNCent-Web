import type { NodeChange } from "@/types/network";
import * as d3 from "d3";
import type { InteractionProps } from "../../Tooltips/useTooltip";

export const drawChangeCircles = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  outerRadius: number,
  lastChange: NodeChange,
  interactionProps: InteractionProps,
  radius: number,
) => {
  const { onTooltipShow, onTooltipHide } = interactionProps;
  let circleGroup = svg.select<SVGGElement>("g.change-circles-group");
  if (circleGroup.empty()) {
    circleGroup = svg.append("g").attr("class", "change-circles-group");
  }

  const getFillColor = (d: string) => {
    const isAdded = lastChange?.added && d in lastChange.added;
    const isRemoved = lastChange?.removed && d in lastChange.removed;
    const isUpdated =
      lastChange?.updated &&
      Object.prototype.hasOwnProperty.call(lastChange.updated, d);
    if (isAdded) return "green";
    if (isRemoved) return "red";
    if (isUpdated) return "yellow";
    return "none";
  };

  const getTransform = (d: string) =>
    `rotate(${((x(d)! + x.bandwidth() / 2) * 180) / Math.PI - 90}) translate(${outerRadius + radius * 2}, 0)`;

  circleGroup
    .selectAll<SVGCircleElement, string>("circle.change-indicator")
    .data(x.domain(), (d) => d)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "change-indicator")
          .attr("r", radius)
          .attr("transform", getTransform)
          .attr("fill", getFillColor)
          .attr("opacity", 0)
          .call((enter) => enter.transition().duration(150).attr("opacity", 1)),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(150)
            .attr("transform", getTransform)
            .attr("fill", getFillColor)
            .attr("r", radius),
        ),
      (exit) =>
        exit.call((exit) =>
          exit.transition().duration(150).attr("opacity", 0).remove(),
        ),
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
