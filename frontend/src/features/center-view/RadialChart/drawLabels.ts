import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
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
  radius: number,
): void => {
  const { nodeMap } = useNetworkStore.getState();
  const { onNodeHover, onContextMenu, onTooltipShow, onTooltipHide } =
    interactionProps;

  let labelGroup = svg.select<SVGGElement>("g.labels-group");
  if (labelGroup.empty()) {
    labelGroup = svg.append("g").attr("class", "labels-group");
  }

  LONGESTLABEL = 0;

  const getTransform = (d: string) => `
    rotate(${((x(d)! + x.bandwidth() / 2) * 180) / Math.PI - 90})
    translate(${outerRadius + radius * 4},0)
  `;

  const getTextTransform = (d: string) =>
    (x(d)! + x.bandwidth() / 2) % (2 * Math.PI) < Math.PI
      ? "rotate(0)translate(0,0)"
      : "rotate(180)translate(0,0)";

  const getTextAnchor = (d: string) =>
    (x(d)! + x.bandwidth() / 2) % (2 * Math.PI) < Math.PI ? "start" : "end";

  const getFontSize = () => {
    return (fontSize / 11) * radius;
  };
  const getFillColor = (d: string) => {
    if (selectedNodes.has(d)) {
      return highlightLabelColor.selected;
    } else if (hoveredNode && hoveredNode.id === d) {
      return highlightLabelColor.hover;
    } else {
      return highlightLabelColor.default;
    }
  };

  const getFontWeight = (d: string) => {
    if (hoveredNode && hoveredNode.id === d) return "600";
    return "normal";
  };

  labelGroup
    .selectAll<SVGGElement, string>("g.label")
    .data(x.domain(), (d) => d)
    .join(
      (enter) => {
        const g = enter
          .append("g")
          .attr("class", "label")
          .attr("transform", getTransform)
          .style("cursor", "pointer")
          .style("user-select", "none")
          .attr("opacity", 0);

        g.each(function (d) {
          const group = d3.select(this);
          const node = nodeMap.get(d);
          const label = node?.label ?? d;

          const text = group
            .append("text")
            .attr("data-type", d)
            .attr("dominant-baseline", "middle")
            .attr("transform", getTextTransform(d))
            .attr("text-anchor", getTextAnchor(d))
            .attr("font-size", `${getFontSize()}px`)
            .attr("fill", getFillColor(d))
            .attr("font-weight", getFontWeight(d))
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
        });

        return g.call((enter) =>
          enter.transition().duration(150).attr("opacity", 1),
        );
      },
      (update) => {
        update.each(function (d) {
          const group = d3.select(this);
          const node = nodeMap.get(d);
          const label = node?.label ?? d;

          const text = group.select<SVGTextElement>("text");
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
        });

        update.attr("transform", getTransform);

        update
          .select("text")
          .attr("transform", getTextTransform)
          .attr("text-anchor", getTextAnchor);

        update
          .select("text")
          .transition()
          .duration(150)
          .attr("fill", getFillColor)
          .attr("font-weight", getFontWeight)
          .attr("font-size", `${getFontSize()}px`);

        return update;
      },
      (exit) =>
        exit.call((exit) =>
          exit.transition().duration(150).attr("opacity", 0).remove(),
        ),
    )
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
      onNodeHover(d);
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

export default drawLabels;

export const updateLabelHighlight = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
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
  radius: number,
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

      const getFontSize = () => {
        return (fontSize / 11) * radius;
      };

      textEl.attr("font-size", `${getFontSize()}px`);

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
