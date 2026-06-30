import type { FullData, Node } from "@/types";
import { highlightLabelColor } from "@/utils/ColorHelper";
import { formatValue, truncateText } from "@/utils/utils";
import * as d3 from "d3";
import { getNodeLabel } from "./nodeLinkUtils";

const getDisplayText = (
  node: Node,
  nodeData: Map<string, FullData>,
  displayLabel: string,
): string => {
  if (displayLabel === "label" || !displayLabel) {
    return node?.label ?? getNodeLabel(node);
  }

  const fullData = nodeData.get(node.id);
  if (fullData) {
    const value = fullData[displayLabel as keyof FullData];
    if (value !== undefined && value !== null) {
      return String(formatValue(value));
    }
  }

  return "N/A";
};

const shouldShowAllLabels = (zoomLevel: number, numNodes: number): boolean => {
  if (zoomLevel <= 0.5 && numNodes >= 1000) return false;
  return true;
};

const getVisibleLabelSet = (
  nodeData: Map<string, FullData>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  showLabels: boolean,
  zoomLevel: number,
): Set<string> => {
  const visible = new Set<string>();
  const showAll = showLabels && shouldShowAllLabels(zoomLevel, nodeData.size);

  const linkedNodeIds = new Set<string>();

  if (hoveredNode) {
    const node = nodeData.get(hoveredNode);
    if (node?.linked) {
      node.linked.forEach((id) => linkedNodeIds.add(id));
    }
  }

  selectedNodes.forEach((nodeId) => {
    const node = nodeData.get(nodeId);
    if (node?.linked) {
      node.linked.forEach((id) => linkedNodeIds.add(id));
    }
  });

  nodeData.forEach((data, nodeId) => {
    if (data.removed) return;

    const isSelected = selectedNodes.has(nodeId);
    const isHovered = hoveredNode === nodeId;
    const isLinked = linkedNodeIds.has(nodeId);

    if (showAll || isSelected || isHovered || isLinked) {
      visible.add(nodeId);
    }
  });

  return visible;
};

const getLabelColor = (
  nodeId: string,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  linkedNodeIds: Set<string>,
  nodeData: Map<string, FullData>,
): string => {
  const isSelected = selectedNodes.has(nodeId);
  const isHovered = hoveredNode === nodeId;
  const isLinked = linkedNodeIds.has(nodeId);

  if (isSelected) {
    return highlightLabelColor.selected;
  }

  if (isHovered) {
    return highlightLabelColor.hovered;
  }

  if (isLinked) {
    const isLinkedToSelected = Array.from(selectedNodes).some((selectedId) => {
      const selectedNodeData = nodeData.get(selectedId);
      return selectedNodeData?.linked?.has(nodeId);
    });

    const isLinkedToHovered =
      hoveredNode && nodeData.get(hoveredNode)?.linked?.has(nodeId);

    if (isLinkedToSelected) {
      return highlightLabelColor.linkedToSelected;
    }
    if (isLinkedToHovered) {
      return highlightLabelColor.linkedToHovered;
    }
  }

  return highlightLabelColor.default;
};

const drawLabels = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  visibleNodes: Node[],
  showLabels: boolean,
  labelFontSize: number,
  nodeData: Map<string, FullData>,
  displayLabel: string,
  truncateLabels: boolean,
  labelWidth: number,
): void => {
  const svgGroup = svg.select("g.zoom-group");
  let labelGroup = svgGroup.select<SVGGElement>("g.labels-group");

  if (labelGroup.empty()) {
    labelGroup = svgGroup
      .append("g")
      .attr("class", "labels-group")
      .attr("pointer-events", "none");
  }

  const getInitialOpacity = () => (showLabels ? 1 : 0);
  const getInitialDisplay = () => (showLabels ? "block" : "none");

  labelGroup
    .selectAll<SVGGElement, Node>("g.label")
    .data(visibleNodes, (d) => d.id)
    .join(
      (enter) => {
        const g = enter
          .append("g")
          .attr("class", "label")
          .style("user-select", "none")
          .attr("opacity", 0)
          .style("display", getInitialDisplay());

        g.each(function (d) {
          const group = d3.select(this);
          const label = getDisplayText(d, nodeData, displayLabel);

          group
            .append("rect")
            .attr("class", "label-background")
            .attr("fill", "var(--background)")
            .attr("fill-opacity", 0.9)
            .attr("stroke", "var(--border)")
            .attr("stroke-width", 0.5)
            .attr("rx", 2)
            .attr("ry", 2);

          const text = group
            .append("text")
            .attr("data-type", d.id)
            .attr("text-anchor", "middle")
            .attr("dy", "0.34em")
            .attr("font-size", `${labelFontSize}px`)
            .attr("pointer-events", "none")
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
          const label = getDisplayText(d, nodeData, displayLabel);

          const text = group.select<SVGTextElement>("text");
          text.attr("font-size", `${labelFontSize}px`);

          const textNode = text.node();
          if (textNode) {
            const displayText = truncateLabels
              ? truncateText(textNode, label, labelWidth)
              : label;
            text.text(displayText);
          }
        });

        return update;
      },
      (exit) =>
        exit.call((exit) =>
          exit.transition().duration(150).attr("opacity", 0).remove(),
        ),
    );
};

export default drawLabels;

const updateLabelBackgroundAndPosition = (
  label: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodeSize: number,
) => {
  const text = label.select<SVGTextElement>("text");
  const bbox = text.node()?.getBBox();

  if (bbox) {
    const padding = 2;
    const background = label.select("rect.label-background");

    const textCenterY = -nodeSize - bbox.height / 2 - 1;

    text.attr("y", textCenterY);

    background
      .attr("x", bbox.x - padding)
      .attr("y", textCenterY - bbox.height / 2)
      .attr("width", bbox.width + padding * 2)
      .attr("height", bbox.height);
  }
};

export const updateLabelPositions = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodeSizes: Map<string, number>,
) => {
  svg
    .selectAll<SVGGElement, Node>("g.labels-group g.label")
    .attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`)
    .each(function (d) {
      const label = d3.select(this);
      const nodeSize = nodeSizes.get(d.id) ?? 15;
      updateLabelBackgroundAndPosition(label, nodeSize);
    });
};

export const updateLabels = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  labelFontSize: number,
  nodeSizes: Map<string, number>,
  nodeData: Map<string, FullData>,
  displayLabel: string,
  truncateLabels: boolean,
  labelWidth: number,
) => {
  const updates: Array<() => void> = [];

  svg.selectAll<SVGGElement, Node>("g.labels-group g.label").each(function (d) {
    const label = d3.select(this);
    const text = label.select<SVGTextElement>("text");

    text.attr("font-size", `${labelFontSize}px`);

    const labelText = getDisplayText(d, nodeData, displayLabel);

    const textNode = text.node();
    if (textNode) {
      const displayText = truncateLabels
        ? truncateText(textNode, labelText, labelWidth)
        : labelText;
      text.text(displayText);
    }

    const nodeSize = nodeSizes.get(d.id) ?? 15;
    updates.push(() => {
      updateLabelBackgroundAndPosition(label, nodeSize);
    });
  });

  if (updates.length > 0) {
    requestAnimationFrame(() => {
      updates.forEach((fn) => fn());
    });
  }

  updateLabelPositions(svg, nodeSizes);
};

export const updateLabelStyles = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodeData: Map<string, FullData>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  showLabels: boolean,
  zoomLevel: number,
  nodeSizes: Map<string, number>,
  animate: boolean = false,
) => {
  const visibleSet = getVisibleLabelSet(
    nodeData,
    selectedNodes,
    hoveredNode,
    showLabels,
    zoomLevel,
  );

  const linkedNodeIds = new Set<string>();
  if (hoveredNode) {
    const node = nodeData.get(hoveredNode);
    if (node?.linked) {
      node.linked.forEach((id) => linkedNodeIds.add(id));
    }
  }
  selectedNodes.forEach((nodeId) => {
    const node = nodeData.get(nodeId);
    if (node?.linked) {
      node.linked.forEach((id) => linkedNodeIds.add(id));
    }
  });

  if (hoveredNode) {
    svg
      .selectAll<SVGGElement, Node>("g.labels-group g.label")
      .each(function (d) {
        if (d.id === hoveredNode) {
          this.parentNode?.appendChild(this);
        }
      });
  }

  const hasActiveSelectedNodes = Array.from(selectedNodes).some((id) => {
    const data = nodeData.get(id);
    return data && !data.removed;
  });

  const backgroundUpdates: Array<() => void> = [];

  svg.selectAll<SVGGElement, Node>("g.labels-group g.label").each(function (d) {
    const label = d3.select(this);
    const shouldShow = visibleSet.has(d.id);
    const wasHidden = label.style("display") === "none";

    const isSelected = selectedNodes.has(d.id);
    const isHovered = hoveredNode === d.id;
    const isLinked = linkedNodeIds.has(d.id);
    const isConnected = isSelected || isHovered || isLinked;

    let labelOpacity = 1;
    if (hasActiveSelectedNodes && !isConnected) {
      labelOpacity = 0.2;
    }

    if (shouldShow) {
      label.style("display", "block");

      if (wasHidden && nodeSizes) {
        const nodeSize = nodeSizes.get(d.id) ?? 15;
        backgroundUpdates.push(() => {
          updateLabelBackgroundAndPosition(label, nodeSize);
        });
      }

      if (animate) {
        label.transition().duration(300).attr("opacity", labelOpacity);
      } else {
        label.attr("opacity", labelOpacity);
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

    const text = label.select("text");
    const background = label.select("rect.label-background");
    const textColor = getLabelColor(
      d.id,
      selectedNodes,
      hoveredNode,
      linkedNodeIds,
      nodeData,
    );

    const fontWeight = isSelected && isHovered ? "700" : "normal";

    text.attr("fill", textColor).attr("font-weight", fontWeight);
    background.attr("fill-opacity", labelOpacity * 0.9);
  });

  if (backgroundUpdates.length > 0) {
    requestAnimationFrame(() => {
      backgroundUpdates.forEach((fn) => fn());
    });
  }
};
