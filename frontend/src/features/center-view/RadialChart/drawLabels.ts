import { useSettingsStore } from "@/stores/useChartSettingsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";
import { handleHighlight, highlightLabelColor } from "@/utils/ColorHelper";
import { truncateText } from "@/utils/utils";
import * as d3 from "d3";
import type { InteractionProps } from "../Tooltips/useTooltip";

let LONGESTLABEL = 0;

const drawLabels = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  outerRadius: number,
  selectedNodes: Set<string>,
  fontSize: number,
  labelWidth: number,
  truncateLabels: boolean,
  interactionProps: InteractionProps,
  hoveredNode: FullData | null,
): void => {
  const { nodeMap } = useNetworkStore.getState();
  const { onHover, onContextMenu, onTooltipShow, onTooltipHide } =
    interactionProps;
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
        const displayText = truncateLabels
          ? truncateText(textNode, label, labelWidth)
          : label;

        text.text(displayText);

        const w = textNode.getBBox().width;
        if (w > LONGESTLABEL) {
          LONGESTLABEL = w;
        }
      }
    })
    .attr("fill", (d) => {
      if (selectedNodes.has(d)) {
        return highlightLabelColor.selected;
      } else if (hoveredNode && hoveredNode.id === d) {
        return highlightLabelColor.hover;
      } else {
        return highlightLabelColor.default;
      }
    })
    .on("click", (event, d) => {
      const multi = event.shiftKey || event.ctrlKey;
      handleHighlight(d, multi);
    })
    .on("contextmenu", (event, d) => {
      event._handledByChild = true;
      onContextMenu("label", d);
    })
    .on("mouseover", function (_, d) {
      const [mouseX, mouseY] = d3.pointer(_, document.body);
      onTooltipShow({ type: "label", nodeId: d, x: mouseX, y: mouseY });
      onHover(d);
    })
    .on("mousemove", function (event, d) {
      const [mouseX, mouseY] = d3.pointer(event, document.body);
      onTooltipShow({ type: "label", nodeId: d, x: mouseX, y: mouseY });
    })
    .on("mouseout", () => {
      onTooltipHide();
    });
  useSettingsStore.getState().setRadialSettings({
    labelWidth: truncateLabels ? labelWidth : Math.ceil(LONGESTLABEL / 10) * 10,
  });
};

export const updateLabelHighlight = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  hoveredNode: FullData | null,
) => {
  svg
    .selectAll<SVGGElement, string>("g.labels-group g.label text")
    .attr("fill", (d) => {
      if (selectedNodes.has(d)) {
        return highlightLabelColor.selected;
      } else if (hoveredNode && hoveredNode.id === d) {
        return highlightLabelColor.hover;
      } else {
        return highlightLabelColor.default;
      }
    })
    .attr("font-weight", (d) => {
      if (hoveredNode && hoveredNode.id === d) return "600";
      return "normal";
    });
};

export const updateLabels = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  fontSize: number,
  labelWidth: number,
  truncateLabels: boolean,
) => {
  const { nodeMap } = useNetworkStore.getState();
  LONGESTLABEL = 0;

  svg
    .selectAll<SVGGElement, string>("g.labels-group g.label")
    .each(function () {
      const g = d3.select(this);
      const textEl = g.select<SVGTextElement>("text");
      const textNode = textEl.node();
      if (!textNode) return;

      const id = (textEl.attr("data-type") as string) ?? "";
      const label = nodeMap.get(id)?.label ?? id;

      textEl.attr("font-size", `${fontSize}px`);

      const displayText = truncateLabels
        ? truncateText(textNode, label, labelWidth)
        : label;
      textEl.text(displayText);

      const textWidth = textNode.getBBox().width;
      if (textWidth > LONGESTLABEL) LONGESTLABEL = textWidth;
    });

  useSettingsStore.getState().setRadialSettings({
    labelWidth: truncateLabels ? labelWidth : Math.ceil(LONGESTLABEL / 10) * 10,
  });
};

export default drawLabels;
