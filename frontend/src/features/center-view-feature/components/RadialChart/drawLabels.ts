import * as d3 from "d3";
import type { Selection, ScaleBand } from "d3";
import { handleHighlight, highlightLabelColor } from "@/utils/ColorHelper";

const drawLabels = (
  svg: Selection<SVGGElement, unknown, null, undefined>,
  x: ScaleBand<string>,
  outerRadius: number,
  selectedNodes: Set<string>,
  fontSize: number,
): void => {
  const labelGroup = svg.append("g").attr("class", "labels-group");

  labelGroup
    .selectAll("g.label")
    .data(x.domain())
    .join("g")
    .attr("class", "label")
    .attr(
      "transform",
      (d) => `
        rotate(${((x(d)! + x.bandwidth() / 2) * 180) / Math.PI - 90})
        translate(${outerRadius},0)
      `,
    )
    .style("cursor", "pointer")
    .style("user-select", "none")
    .each(function (d) {
      const g = d3.select(this);
      g.append("text")
        .text(d)
        .attr("data-type", d)
        .attr("dominant-baseline", "middle")
        .attr("transform", () =>
          // (x(d)! + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI //x-axis split
          (x(d)! + x.bandwidth() / 2) % (2 * Math.PI) < Math.PI
            ? "rotate(0)translate(15,0)"
            : "rotate(180)translate(-15,2)",
        )
        .attr("text-anchor", () =>
          (x(d)! + x.bandwidth() / 2) % (2 * Math.PI) < Math.PI
            ? "start"
            : "end",
        )
        .attr("font-size", `${fontSize}px`);
    })
    .attr("fill", (d) =>
      selectedNodes.has(d)
        ? highlightLabelColor.selected
        : highlightLabelColor.default,
    )
    .on("click", (event, d) => {
      const multi = event.shiftKey || event.ctrlKey || event.metaKey;
      handleHighlight(d, multi);
    });
};

export const updateLabelHighlight = (
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
) => {
  svg
    .selectAll<SVGGElement, string>("g.labels-group g.label text")
    .attr("fill", (d) =>
      selectedNodes.has(d)
        ? highlightLabelColor.selected
        : highlightLabelColor.default,
    );
};

export default drawLabels;
