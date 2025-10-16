import type { ContextType } from "@/features/center-view/CenterView";
import type { Node } from "@/types/network";
import { handleHighlight, highlightLabelColor } from "@/utils/ColorHelper";
import { truncateText } from "@/utils/utils";
import * as d3 from "d3";

let LONGESTLABEL = 0;
const MAX_LABEL_WIDTH = 200;

const drawLabels = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  outerRadius: number,
  selectedNodes: Set<string>,
  fontSize: number,
  onNodeHover: (nodeId: string) => void,
  onTooltipShow: (tooltipData: {
    type: "label";
    nodeId: string;
    x: number;
    y: number;
  }) => void,
  onTooltipHide: () => void,
  nodeMap: Map<string, Node>,
  setMaxLabelWidth: (width: number) => void,
  onContextMenuTarget: (target: ContextType, data?: any) => void,
): void => {
  svg.selectAll("g.labels-group").remove();

  const labelGroup = svg.append("g").attr("class", "labels-group");

  LONGESTLABEL = 0;

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
      const node = nodeMap.get(d);
      const label = node?.label ?? d;

      const text = g
        .append("text")
        .attr("data-type", d)
        .attr("dominant-baseline", "middle")
        .attr("transform", () =>
          (x(d)! + x.bandwidth() / 2) % (2 * Math.PI) < Math.PI
            ? "rotate(0)translate(15,0)"
            : "rotate(180)translate(-15,2)",
        )
        .attr("text-anchor", () =>
          (x(d)! + x.bandwidth() / 2) % (2 * Math.PI) < Math.PI
            ? "start"
            : "end",
        )
        .attr("font-size", `${fontSize}px`)
        .text(label);

      const textNode = text.node();
      if (textNode) {
        const truncated = truncateText(textNode, label, MAX_LABEL_WIDTH);
        text.text(truncated);

        const w = textNode.getBBox().width;
        if (w > LONGESTLABEL) {
          LONGESTLABEL = w;
        }
      }
    })
    .attr("fill", (d) =>
      selectedNodes.has(d)
        ? highlightLabelColor.selected
        : highlightLabelColor.default,
    )
    .on("click", (event, d) => {
      const multi = event.shiftKey || event.ctrlKey || event.metaKey;
      handleHighlight(d, multi);
    })
    .on("contextmenu", (event, d) => {
      event._handledByChild = true;
      onContextMenuTarget("label", d);
    })
    .on("mouseover", function (_, d) {
      const [mouseX, mouseY] = d3.pointer(_, document.body);
      onTooltipShow({ type: "label", nodeId: d, x: mouseX, y: mouseY });
      onNodeHover(d);
    })
    .on("mousemove", function (event, d) {
      const [mouseX, mouseY] = d3.pointer(event, document.body);
      onTooltipShow({ type: "label", nodeId: d, x: mouseX, y: mouseY });
    })
    .on("mouseout", () => {
      onTooltipHide();
    });
  setMaxLabelWidth(LONGESTLABEL);
};

export const updateLabelHighlight = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
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

export const updateLabelFontSize = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  fontSize: number,
  nodeMap: Map<string, Node>,
  setMaxLabelWidth: (width: number) => void,
) => {
  LONGESTLABEL = 0;

  svg
    .selectAll<SVGGElement, string>("g.labels-group g.label")
    .each(function () {
      const g = d3.select(this);
      const textEl = g.select<SVGTextElement>("text");
      const textNode = textEl.node();
      if (!textNode) return;

      const id = (textEl.attr("data-type") as string) ?? "";
      const label = nodeMap.get(id)?.label;
      textEl.attr("font-size", `${fontSize}px`);

      const truncated = truncateText(textNode, label ?? id, MAX_LABEL_WIDTH);
      textEl.text(truncated);

      const textWidth = textNode.getBBox().width;
      if (textWidth > LONGESTLABEL) LONGESTLABEL = textWidth;
    });
  setMaxLabelWidth(LONGESTLABEL);
};
export default drawLabels;
