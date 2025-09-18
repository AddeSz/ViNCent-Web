import * as d3 from "d3";
import { handleHighlight, highlightLabelColor } from "@/utils/ColorHelper";
import type { ArcData } from "./RadialChart";
import type { CombinedData, Node } from "@/types/network";
import type { LabelTooltipProps } from "@/features/center-view-feature/components/Tooltips/LabelTooltip";

const drawLabels = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  outerRadius: number,
  selectedNodes: Set<string>,
  fontSize: number,
  arcData: ArcData[],
  onNodeHover: (nodeData: CombinedData) => void,
  onTooltipShow: (tooltipData: LabelTooltipProps) => void,
  onTooltipHide: () => void,
  nodeMap: Map<string, Node>,
): void => {
  const nodeDataMap = new Map<string, CombinedData>();
  arcData.forEach((d) => {
    nodeDataMap.set(d.data.id, d.data);
  });

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
      const node = nodeMap.get(d);
      const label = node?.label ?? d;

      g.append("text")
        .text(label)
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
      const nodeData = nodeMap.get(d);

      console.log("Clicked node data:", {
        nodeId: d,
        nodeData: nodeData,
        attributes: nodeData?.attributes,
        centralityData: nodeDataMap.get(d),
        arcData: arcData,
      });

      handleHighlight(d, multi);
    })
    .on("mouseover", function (_, d) {
      const nodeData = nodeDataMap.get(d);
      if (nodeData) {
        onNodeHover(nodeData);

        const [mouseX, mouseY] = d3.pointer(_, document.body);
        onTooltipShow({
          nodeId: d,
          label: nodeMap.get(d)?.label ?? d,
          x: mouseX,
          y: mouseY,
          visible: true,
        });
      }
    })
    .on("mousemove", function (event, d) {
      const nodeData = nodeDataMap.get(d);
      if (nodeData) {
        const [mouseX, mouseY] = d3.pointer(event, document.body);
        onTooltipShow({
          nodeId: d,
          label: nodeMap.get(d)?.label ?? d,
          x: mouseX,
          y: mouseY,
          visible: true,
        });
      }
    })
    .on("mouseout", () => {
      onTooltipHide();
    });
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

export default drawLabels;
