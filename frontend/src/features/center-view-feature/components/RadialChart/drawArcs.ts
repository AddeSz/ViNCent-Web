import * as d3 from "d3";
import { formatValue } from "@/utils/utils";
import type { ArcData } from "./RadialChart";
import type { ArcTooltipProps } from "@/features/center-view-feature/components/Tooltips/ArcTooltip";
import type { CombinedNodeData } from "@/types/network";

const drawArcs = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  arcData: ArcData[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
  getColorForKey: (key: string, value: string | number) => string,
  centralityRanges: Record<string, { min: number; max: number }>,
  onNodeHover: (nodeData: CombinedNodeData) => void,
  onTooltipShow: (tooltipData: ArcTooltipProps) => void,
  onTooltipHide: () => void,
): void => {
  const g = svg.append("g").attr("class", "arcs-group");

  g.selectAll("path.arc-background")
    .data(arcData)
    .join("path")
    .attr("class", "arc-background")
    .attr("d", (d) => {
      const startAngle = x(d.data.id) ?? 0;
      const endAngle = startAngle + x.bandwidth();
      const innerRadius = y(d[0]);
      const outerRadius = y(d[1]);
      const arc = d3
        .arc<ArcData>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle);
      return arc(d);
    })
    .attr("fill", "hsl(var(--muted-foreground))")
    .attr("fill-opacity", 0.1)
    .attr("stroke", "none");

  g.selectAll("path.arc-foreground")
    .data(arcData)
    .join("path")
    .attr("class", "arc-foreground")
    .attr("d", (d) => {
      const startAngle = x(d.data.id) ?? 0;
      const endAngle = startAngle + x.bandwidth();
      const innerRadius = y(d[0]);
      const fullOuterRadius = y(d[1]);

      let outerRadius = fullOuterRadius;

      if (typeof d.value === "number") {
        const { min, max } = centralityRanges[d.key] || { min: 0, max: 1 };
        const proportion = Math.max(
          0,
          Math.min((d.value - min) / (max - min || 1), 1),
        );
        outerRadius =
          innerRadius + (fullOuterRadius - innerRadius) * proportion;
      }

      const arc = d3
        .arc<ArcData>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle);

      return arc(d);
    })
    .attr("fill", (d) =>
      d.value === undefined
        ? "hsl(var(--muted-foreground))"
        : getColorForKey(d.key, d.value),
    )
    .attr("stroke", "none")
    .attr("opacity", 1);

  g.selectAll("path.overlay")
    .data(arcData)
    .join("path")
    .attr("class", "overlay")
    .attr("d", (d) => {
      const startAngle = x(d.data.id) ?? 0;
      const endAngle = startAngle + x.bandwidth();
      const innerRadius = y(d[0]);
      const outerRadius = y(d[1]);
      const arc = d3
        .arc<ArcData>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle);
      return arc(d);
    })
    .attr("fill", "transparent")
    .attr("stroke", "none")
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      g.selectAll("path.arc-foreground")
        .filter(
          (fd) =>
            (fd as ArcData).data.id === d.data.id &&
            (fd as ArcData).key === d.key,
        )
        .transition()
        .duration(100)
        .attr("opacity", 0.8);

      g.selectAll("path.arc-background")
        .filter(
          (fd) =>
            (fd as ArcData).data.id === d.data.id &&
            (fd as ArcData).key === d.key,
        )
        .transition()
        .duration(100)
        .attr("fill-opacity", 0.2);

      onTooltipShow({
        nodeId: d.data.id,
        centralityKey: d.key,
        value: d.value,
        x: event.clientX,
        y: event.clientY,
        visible: true,
      });

      onNodeHover(d.data);
    })
    .on("mousemove", function (event, d) {
      onTooltipShow({
        nodeId: d.data.id,
        centralityKey: d.key,
        value: d.value,
        x: event.clientX,
        y: event.clientY,
        visible: true,
      });
    })
    .on("mouseout", function (_, d) {
      g.selectAll("path.arc-foreground")
        .filter(
          (fd) =>
            (fd as ArcData).data.id === d.data.id &&
            (fd as ArcData).key === d.key,
        )
        .transition()
        .duration(100)
        .attr("opacity", 1);

      g.selectAll("path.arc-background")
        .filter(
          (fd) =>
            (fd as ArcData).data.id === d.data.id &&
            (fd as ArcData).key === d.key,
        )
        .transition()
        .duration(100)
        .attr("fill-opacity", 0.1);

      onTooltipHide();
    })
    .on("click", function (_, d) {
      console.log(formatValue(d.value));
    });
};

export default drawArcs;
