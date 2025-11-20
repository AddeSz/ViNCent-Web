import { useSettingsStore } from "@/stores/useSettingsStore";
import type {
  DataChanges,
  FullData,
  Link,
  Network,
  Node,
} from "@/types/network";
import {
  getLinkStyle,
  handleHighlight,
  highlightNodeColor,
} from "@/utils/ColorHelper";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";
import { updateLabelPositions } from "./drawLabels";
import { createDrag } from "./setupSimulation";

const OPACITY_VALUE = 0.6;

const getNodeStyle = (
  node: Node,
  selectedNodes: Set<string>,
  nodeChanges: DataChanges,
  hoveredNode: string | null,
  nodeData: Map<string, FullData>,
) => {
  const { displaySettings } = useSettingsStore.getState();
  const removed = nodeChanges.removed[node.id] ? true : false;
  const added = nodeChanges.added[node.id] ? true : false;

  let fill = highlightNodeColor.default;
  if (removed && !displaySettings.keepPreviewNodes) {
    fill = highlightNodeColor.removed;
  }

  const isSelected = selectedNodes.has(node.id);
  const isHovered = hoveredNode === node.id;

  const isSecondarySelected = Array.from(selectedNodes).some((selectedId) => {
    const selectedNodeData = nodeData.get(selectedId);
    return selectedNodeData?.linked?.has(node.id);
  });

  const isSecondaryHovered =
    hoveredNode && nodeData.get(hoveredNode)?.linked?.has(node.id);

  let stroke = "none";
  let strokeWidth = 0;

  if (added) {
    stroke = highlightNodeColor.added;
    strokeWidth = 3;
  } else if (removed && displaySettings.keepPreviewNodes) {
    stroke = highlightNodeColor.removed;
    strokeWidth = 3;
  }

  if (isSecondarySelected) {
    fill = highlightNodeColor.linkedToSelected;
    strokeWidth = 3;
  } else if (isSecondaryHovered) {
    fill = highlightNodeColor.linkedToHovered;
    strokeWidth = 3;
  }

  if (isSelected) {
    fill = highlightNodeColor.selected;
    strokeWidth = 3;
  } else if (isHovered) {
    fill = highlightNodeColor.hovered;
    strokeWidth = 3;
  }

  return {
    fill,
    stroke,
    strokeWidth,
  };
};

const getLinkStyleForNode = (
  link: Link,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  edgeChanges: DataChanges,
) => {
  const sourceId = getNodeId(link.source);
  const targetId = getNodeId(link.target);
  const edgeId = `${sourceId}|${targetId}`;
  const isRemoved = edgeChanges.removed[edgeId] ? true : false;
  const isSelected = selectedNodes.has(sourceId) || selectedNodes.has(targetId);
  const isHovered = !!(
    hoveredNode &&
    sourceId &&
    targetId &&
    (sourceId === hoveredNode || targetId === hoveredNode)
  );
  const style = getLinkStyle(
    isRemoved,
    isSelected,
    isHovered,
    OPACITY_VALUE,
    0.8,
  );

  return {
    stroke: style.stroke,
    strokeOpacity: style.opacity,
  };
};

const handleNodeClick = (event: MouseEvent, d: Node) => {
  const multi = event.shiftKey || event.ctrlKey || event.metaKey;
  handleHighlight(d.id, multi);
};

const updateNodes = (
  nodeGroup: d3.Selection<d3.BaseType, unknown, null, undefined>,
  visibleNodes: Node[],
  simulation: d3.Simulation<Node, Link>,
  selectedNodes: Set<string>,
  nodeSizes: Map<string, number>,
  nodeChanges: DataChanges,
  hoveredNode: string | null,
  nodeData: Map<string, FullData>,
) => {
  const nodes = nodeGroup
    .selectAll<SVGCircleElement, Node>("circle.node")
    .data(visibleNodes, (d) => d.id);
  nodes
    .exit()
    .transition()
    .duration(250)
    .attr("r", 0)
    .style("opacity", 0)
    .remove();

  const nodesEnter = nodes
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", 0)
    .style("cursor", "pointer")
    .style("opacity", 0)
    .on("click", handleNodeClick)
    .attr("cx", (d) => d.x ?? 0)
    .attr("cy", (d) => d.y ?? 0);

  nodesEnter
    .transition()
    .duration(250)
    .attr("r", (d) => nodeSizes.get(d.id)!)
    .style("opacity", 1);

  const nodesUpdate = nodesEnter.merge(nodes);

  nodesUpdate.each(function (d) {
    const style = getNodeStyle(
      d,
      selectedNodes,
      nodeChanges,
      hoveredNode,
      nodeData,
    );
    const size = nodeSizes.get(d.id)!;
    d3.select(this)
      .on("click", (event) => handleNodeClick(event, d))
      .attr("fill", style.fill)
      .attr("stroke-width", style.strokeWidth)
      .style("stroke", style.stroke)
      .transition()
      .duration(150)
      .attr("r", size)
      .style("opacity", 1);
  });
  nodesUpdate.call(createDrag(simulation));

  return nodesUpdate;
};

const updateLinks = (
  linkGroup: d3.Selection<d3.BaseType, unknown, null, undefined>,
  renderLinks: Link[],
  selectedNodes: Set<string>,
  linkWeights: Map<string, number>,
  hoveredNode: string | null,
  edgeChanges: DataChanges,
) => {
  const links = linkGroup
    .selectAll<SVGLineElement, Link>("line.link")
    .data(
      renderLinks,
      (d) => `${(d.source as Node).id}-${(d.target as Node).id}`,
    );

  links.exit().transition().duration(250).style("opacity", 0).remove();

  const linksEnter = links
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("x1", (d) => (d.source as Node).x ?? 0)
    .attr("y1", (d) => (d.source as Node).y ?? 0)
    .attr("x2", (d) => (d.source as Node).x ?? 0)
    .attr("y2", (d) => (d.source as Node).y ?? 0)
    .style("stroke-opacity", 0);

  const linksUpdate = linksEnter.merge(links);

  linksUpdate
    .attr("x1", (d) => (d.source as Node).x ?? 0)
    .attr("y1", (d) => (d.source as Node).y ?? 0)
    .attr("x2", (d) => (d.target as Node).x ?? 0)
    .attr("y2", (d) => (d.target as Node).y ?? 0)
    .attr("stroke-width", (d) => {
      const sourceId = getNodeId(d.source);
      const targetId = getNodeId(d.target);
      const linkId = `${sourceId}-${targetId}`;
      const thickness = linkWeights.get(linkId) || 1.5;
      const isSelected =
        selectedNodes.has(sourceId) || selectedNodes.has(targetId);
      return isSelected ? thickness * 1.5 : thickness;
    });

  linksUpdate
    .transition()
    .duration(300)
    .ease(d3.easeCubicOut)
    .style("stroke-opacity", (d) => {
      const style = getLinkStyleForNode(
        d,
        selectedNodes,
        hoveredNode,
        edgeChanges,
      );
      return style.strokeOpacity;
    })
    .style("stroke", (d) => {
      const style = getLinkStyleForNode(
        d,
        selectedNodes,
        hoveredNode,
        edgeChanges,
      );
      return style.stroke;
    });

  return linksUpdate;
};

export const updateStyle = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  nodeSizes: Map<string, number>,
  linkWeights: Map<string, number>,
  nodeChanges: DataChanges,
  edgeChanges: DataChanges,
  hoveredNode: string | null,
  nodeData: Map<string, FullData>,
) => {
  svg.selectAll<SVGCircleElement, Node>("circle.node").each(function (d) {
    const style = getNodeStyle(
      d,
      selectedNodes,
      nodeChanges,
      hoveredNode,
      nodeData,
    );
    const size = nodeSizes.get(d.id)!;
    d3.select(this)
      .attr("r", size)
      .attr("fill", style.fill)
      .style("stroke", style.stroke)
      .attr("stroke-width", style.strokeWidth);
  });

  svg.selectAll<SVGLineElement, Link>("line.link").each(function (d) {
    const style = getLinkStyleForNode(
      d,
      selectedNodes,
      hoveredNode,
      edgeChanges,
    );
    const sourceId = getNodeId(d.source);
    const targetId = getNodeId(d.target);
    const linkId = `${sourceId}-${targetId}`;
    const thickness = linkWeights.get(linkId) || 1.5;
    const isSelected =
      selectedNodes.has(sourceId) || selectedNodes.has(targetId);

    d3.select(this)
      .style("stroke", style.stroke)
      .style("stroke-opacity", style.strokeOpacity)
      .attr("stroke-width", isSelected ? thickness * 1.5 : thickness);
  });
};

const updateGraph = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  simulation: d3.Simulation<Node, Link>,
  network: Network,
  selectedNodes: Set<string>,
  nodeChanges: DataChanges,
  edgeChanges: DataChanges,
  nodeSizes: Map<string, number>,
  linkWeights: Map<string, number>,
  hoveredNode: string | null,
  nodeData: Map<string, FullData>,
) => {
  const svgGroup = svg.select("g.zoom-group");
  const linkGroup = svgGroup.select("g.links-group");
  const nodeGroup = svgGroup.select("g.nodes-group");
  const allLinks = updateLinks(
    linkGroup,
    network.links,
    selectedNodes,
    linkWeights,
    hoveredNode,
    edgeChanges,
  );
  const allNodes = updateNodes(
    nodeGroup,
    network.nodes,
    simulation,
    selectedNodes,
    nodeSizes,
    nodeChanges,
    hoveredNode,
    nodeData,
  );

  simulation.on("tick", () => {
    allLinks
      .attr("x1", (d) => (d.source as Node).x ?? 0)
      .attr("y1", (d) => (d.source as Node).y ?? 0)
      .attr("x2", (d) => (d.target as Node).x ?? 0)
      .attr("y2", (d) => (d.target as Node).y ?? 0);

    allNodes.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

    updateLabelPositions(svg, nodeSizes);
  });
};

export default updateGraph;
