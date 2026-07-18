import { type GetColorForMetric } from "@/hooks/useGetColorForMetric";
import type { FullData } from "@/types";
import { handleHighlight, highlightLabelColor } from "@/utils/ColorHelper";
import { formatValue, truncateText } from "@/utils/utils";
import * as d3 from "d3";
import type { InteractionProps } from "../Tooltips/useTooltip";

const shouldShowAllLabels = (zoomLevel: number, radius: number): boolean => {
  if (zoomLevel <= 0.5 && radius <= 8) return false;
  if (zoomLevel <= 1 && radius <= 4) return false;
  return true;
};

const getDisplayText = (
  node: FullData | undefined,
  nodeId: string,
  displayLabel: string,
): string => {
  if (displayLabel === "label" || !displayLabel) {
    return node?.label ?? nodeId;
  }

  const value = node?.[displayLabel as keyof FullData];

  if (value !== undefined && value !== null) {
    return String(formatValue(value));
  }

  return "N/A";
};

const drawLabels = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodeMap: Map<string, FullData>,
  x: d3.ScaleBand<string>,
  outerRadius: number,
  fontSize: number,
  labelWidth: number,
  truncateLabels: boolean,
  interactionProps: InteractionProps,
  outerArcsWidth: number,
  showLabels: boolean,
  displayLabel: string,
  hasCommunitySegments: boolean = false,
): void => {
  const { onNodeHover, onContextMenu, onTooltipShow, onTooltipHide } =
    interactionProps;
  let labelGroup = svg.select<SVGGElement>("g.labels-group");
  if (labelGroup.empty()) {
    labelGroup = svg.append("g").attr("class", "labels-group");
  }

  const getTransform = (d: string) => {
    const angle = ((x(d)! + x.bandwidth() / 2) * 180) / Math.PI - 90;
    const angleRad = (angle * Math.PI) / 180;

    const segmentWidth = 25;
    const distance = hasCommunitySegments
      ? outerRadius + segmentWidth + outerArcsWidth * 4 + 2
      : outerRadius + outerArcsWidth * 3 + 2;

    const yOffset = Math.cos(angleRad);
    return `
    rotate(${angle})
    translate(${distance}, ${yOffset})
  `;
  };

  const getTextTransform = (d: string) =>
    (x(d)! + x.bandwidth() / 2) % (2 * Math.PI) < Math.PI
      ? "rotate(0)"
      : `rotate(180)`;

  const getTextAnchor = (d: string) =>
    (x(d)! + x.bandwidth() / 2) % (2 * Math.PI) < Math.PI ? "start" : "end";

  const getFontSize = () => {
    return (fontSize / 11) * outerArcsWidth;
  };

  const getInitialOpacity = () => (showLabels ? 1 : 0);
  const getInitialDisplay = () => (showLabels ? "block" : "none");

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
          .attr("dominant-baseline", "middle")
          .attr("opacity", 0)
          .style("display", getInitialDisplay());
        g.each(function (d) {
          const group = d3.select(this);
          const node = nodeMap.get(d);
          const label = getDisplayText(node, d, displayLabel);

          const text = group
            .append("text")
            .attr("data-type", d)
            .attr("dominant-baseline", "middle")
            .attr("transform", getTextTransform(d))
            .attr("text-anchor", getTextAnchor(d))
            .attr("font-size", `${getFontSize()}px`)
            .text(label);

          const textNode = text.node();
          if (textNode && truncateLabels) {
            const displayText = truncateText(textNode, label, labelWidth);
            text.text(displayText);
          }
        });

        return g.call((enter) =>
          enter.transition().duration(150).attr("opacity", getInitialOpacity()),
        );
      },
      (update) => {
        update.each(function (d) {
          const group = d3.select(this);
          const node = nodeMap.get(d);
          const label = getDisplayText(node, d, displayLabel);

          const text = group.select<SVGTextElement>("text");
          const textNode = text.node();
          if (textNode) {
            const displayText = truncateLabels
              ? truncateText(textNode, label, labelWidth)
              : label;
            text.text(displayText);
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
      onNodeHover(null);
    });
};

export default drawLabels;

export const updateLabels = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodeMap: Map<string, FullData>,
  fontSize: number,
  labelWidth: number,
  truncateLabels: boolean,
  outerArcsWidth: number,
  displayLabel: string,
) => {
  svg
    .selectAll<SVGGElement, string>("g.labels-group g.label")
    .each(function () {
      const g = d3.select(this);
      const textEl = g.select<SVGTextElement>("text");
      const textNode = textEl.node();
      if (!textNode) return;

      const id = (textEl.attr("data-type") as string) ?? "";
      const node = nodeMap.get(id);
      const label = getDisplayText(node, id, displayLabel);

      const getFontSize = () => {
        return (fontSize / 11) * outerArcsWidth;
      };

      textEl.attr("font-size", `${getFontSize()}px`);

      const displayText = truncateLabels
        ? truncateText(textNode, label, labelWidth)
        : label;
      textEl.text(displayText);
    });
};

export const updateLabelStyles = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodeData: Map<string, FullData>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  zoomLevel: number,
  outerArcsWidth: number,
  showLabels: boolean,
  hoveredCommunity: { key: string; id: number } | null,
  getColorForMetric: GetColorForMetric,
  animate: boolean = false,
) => {
  const showAll = showLabels && shouldShowAllLabels(zoomLevel, outerArcsWidth);

  const linkedToHoveredIds = hoveredNode
    ? nodeData.get(hoveredNode)?.linked
    : null;

  const linkedToSelectedIds = new Set<string>();
  selectedNodes.forEach((nodeId) => {
    const node = nodeData.get(nodeId);
    if (node?.linked && !node?.removed && !node?.hidden) {
      node.linked.forEach((id) => linkedToSelectedIds.add(id));
    }
  });

  svg
    .selectAll<SVGGElement, string>("g.labels-group g.label")
    .each(function (d) {
      const label = d3.select(this);
      const text = label.select("text");

      let isInHoveredCommunity = false;
      if (hoveredCommunity) {
        const node = nodeData.get(d);
        const communityId = node?.[hoveredCommunity.key];
        isInHoveredCommunity = communityId === hoveredCommunity.id;
      }

      const isLinked = linkedToHoveredIds?.has(d) || linkedToSelectedIds.has(d);
      const shouldShow =
        showAll ||
        selectedNodes.has(d) ||
        hoveredNode === d ||
        isLinked ||
        isInHoveredCommunity;

      if (shouldShow) {
        label.style("display", "block");
        if (animate) {
          label.transition().duration(300).attr("opacity", 1);
        } else {
          label.attr("opacity", 1);
        }
      } else {
        if (animate) {
          label
            .transition()
            .duration(300)
            .attr("opacity", 0)
            .on("end", function () {
              d3.select(this).style("display", "none");
            });
        } else {
          label.attr("opacity", 0).style("display", "none");
        }
      }

      let fillColor: string;
      let fontWeight: string;

      if (hoveredCommunity) {
        const node = nodeData.get(d);
        const communityId = node?.[hoveredCommunity.key];
        if (communityId === hoveredCommunity.id) {
          fillColor = getColorForMetric(hoveredCommunity.key, communityId);
          fontWeight = "700";
          text.attr("fill", fillColor);
          text.attr("font-weight", fontWeight);
          return;
        }
      }

      if (selectedNodes.has(d)) {
        fillColor = highlightLabelColor.selected;
        fontWeight = "700";
      } else if (hoveredNode === d) {
        fillColor = highlightLabelColor.hovered;
        fontWeight = "700";
      } else if (linkedToSelectedIds.has(d)) {
        fillColor = highlightLabelColor.linkedToSelected;
        fontWeight = "normal";
      } else if (linkedToHoveredIds?.has(d)) {
        fillColor = highlightLabelColor.linkedToHovered;
        fontWeight = "normal";
      } else {
        fillColor = highlightLabelColor.default;
        fontWeight = "normal";
      }

      text.attr("fill", fillColor);
      text.attr("font-weight", fontWeight);
    });
};
