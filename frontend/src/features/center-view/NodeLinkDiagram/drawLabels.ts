import type { FullData, Node } from "@/types/network";
import { highlightLabelColor } from "@/utils/ColorHelper";
import * as d3 from "d3";
import { getNodeLabel } from "./nodeLinkUtils";

const shouldShowAllLabels = (zoomLevel: number, numNodes: number): boolean => {
  if (zoomLevel <= 0.5 && numNodes >= 400) return false;
  return true;
};

const drawLabels = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  visibleNodes: Node[],
  nodeSizes: Map<string, number>,
  showLabels: boolean,
): void => {
  const svgGroup = svg.select("g.zoom-group");
  let labelGroup = svgGroup.select<SVGGElement>("g.labels-group");

  if (labelGroup.empty()) {
    labelGroup = svgGroup.append("g").attr("class", "labels-group");
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
          const label = d?.label ?? getNodeLabel(d);

          group
            .append("text")
            .attr("data-type", d.id)
            .attr("text-anchor", "middle")
            .attr("dy", -(nodeSizes.get(d.id) ?? 15) - 2)
            .attr("font-size", "14px")
            .attr("pointer-events", "none")
            .text(label);
        });

        return g.call((enter) =>
          enter.transition().duration(150).attr("opacity", getInitialOpacity()),
        );
      },
      (update) => {
        update.each(function (d) {
          const group = d3.select(this);
          const label = d?.label ?? getNodeLabel(d);

          const text = group.select<SVGTextElement>("text");
          text.text(label).attr("dy", -(nodeSizes.get(d.id) ?? 15) - 2);
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

export const updateLabelPositions = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodeSizes: Map<string, number>,
) => {
  svg
    .selectAll<SVGGElement, Node>("g.labels-group g.label")
    .attr("transform", (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`)
    .each(function (d) {
      const label = d3.select(this);
      const text = label.select("text");
      const nodeSize = nodeSizes.get(d.id) ?? 15;
      text.attr("dy", -nodeSize - 2);
    });
};

export const updateLabelVisibility = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodeData: Map<string, FullData>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  showLabels: boolean,
  zoomLevel: number,
) => {
  const showAll = showLabels && shouldShowAllLabels(zoomLevel, nodeData.size);

  const linkedNodeIds = new Set<string>();
  const node = hoveredNode ? nodeData.get(hoveredNode) : null;
  if (node?.linked) {
    node.linked.forEach((id) => linkedNodeIds.add(id));
  }

  selectedNodes.forEach((nodeId) => {
    const node = nodeData.get(nodeId);
    if (node?.linked) {
      node.linked.forEach((id) => linkedNodeIds.add(id));
    }
  });

  svg.selectAll<SVGGElement, Node>("g.labels-group g.label").each(function (d) {
    const label = d3.select(this);
    const nodeInfo = nodeData.get(d.id);

    if (!nodeInfo || nodeInfo?.stable) {
      label.attr("opacity", 0).style("display", "none");
      return;
    }

    const shouldShow =
      selectedNodes.has(d.id) ||
      hoveredNode === d.id ||
      linkedNodeIds.has(d.id) ||
      showAll;

    if (shouldShow) {
      label.style("display", "block");
      label.transition().duration(300).attr("opacity", 1);
    } else {
      label
        .transition()
        .duration(300)
        .attr("opacity", 0)
        .on("end", function () {
          d3.select(this).style("display", "none");
        });
    }
  });
};

export const updateLabelHighlight = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  nodeData: Map<string, FullData>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  showLabels: boolean,
  zoomLevel: number,
) => {
  const showAll = showLabels && shouldShowAllLabels(zoomLevel, nodeData.size);

  const linkedNodeIds = new Set<string>();
  const node = hoveredNode ? nodeData.get(hoveredNode) : null;
  if (node?.linked) {
    node.linked.forEach((id) => linkedNodeIds.add(id));
  }

  selectedNodes.forEach((nodeId) => {
    const node = nodeData.get(nodeId);
    if (node?.linked) {
      node.linked.forEach((id) => linkedNodeIds.add(id));
    }
  });

  svg.selectAll<SVGGElement, Node>("g.labels-group g.label").each(function (d) {
    const label = d3.select(this);
    const nodeInfo = nodeData.get(d.id);

    if (!nodeInfo || nodeInfo?.stable) {
      label.attr("opacity", 0).style("display", "none");
      return;
    }

    const isLinked = linkedNodeIds.has(d.id);
    const shouldShow =
      showAll || selectedNodes.has(d.id) || hoveredNode === d.id || isLinked;

    if (shouldShow) {
      label.style("display", "block");
      label.attr("opacity", 1);
    } else {
      label.attr("opacity", 0).style("display", "none");
    }

    const text = label.select("text");

    let fontWeight: string;

    if (selectedNodes.has(d.id) || hoveredNode === d.id) {
      fontWeight = "700";
    } else {
      fontWeight = "normal";
    }

    text.attr("fill", highlightLabelColor.default);
    text.attr("font-weight", fontWeight);
  });
};
