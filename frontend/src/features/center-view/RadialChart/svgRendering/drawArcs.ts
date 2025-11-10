import { useMetricsStore } from "@/stores/useMetricsStore";
import type { AttributeInfo } from "@/types/network";
import { handleHighlight } from "@/utils/ColorHelper";
import * as d3 from "d3";
import type { InteractionProps } from "../../Tooltips/useTooltip";
import type { ArcData } from "../RadialChart";

const drawArcs = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  arcData: ArcData[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
  attributeInfo: Map<string, AttributeInfo>,
  interactionProps: InteractionProps,
  getKeyIndex: (key: string) => number,
): void => {
  const { getColorForMetric } = useMetricsStore.getState();
  const { onNodeHover, onContextMenu, onTooltipShow, onTooltipHide } =
    interactionProps;
  const g = svg
    .selectAll<SVGGElement, unknown>("g.arcs-group")
    .data([null])
    .join("g")
    .attr("class", "arcs-group");

  const processedArcData = arcData.map((d) => {
    const startAngle = x(d.id) ?? 0;
    const endAngle = startAngle + x.bandwidth();
    const innerRadius = y(getKeyIndex(d.key));
    const fullOuterRadius = y(getKeyIndex(d.key) + 1);

    const backgroundArc = d3
      .arc<ArcData>()
      .innerRadius(innerRadius)
      .outerRadius(fullOuterRadius)
      .startAngle(startAngle)
      .endAngle(endAngle);

    let foregroundOuterRadius = fullOuterRadius;
    const attribute = attributeInfo.get(d.key);
    const isRemoved = d.removed === true;

    if (typeof d.value === "number") {
      let min = 0;
      let max = 1;
      if (attribute?.isNumeric && attribute.range)
        ({ min, max } = attribute.range);
      const proportion = Math.max(
        0,
        Math.min((d.value - min) / (max - min || 1), 1),
      );
      foregroundOuterRadius =
        innerRadius + (fullOuterRadius - innerRadius) * proportion;
    }

    const foregroundArc = d3
      .arc<ArcData>()
      .innerRadius(innerRadius)
      .outerRadius(foregroundOuterRadius)
      .startAngle(startAngle)
      .endAngle(endAngle);

    const fillColor = isRemoved ? "red" : getColorForMetric(d.key, d.value);
    const arcOpacity = isRemoved ? 0.4 : 1;

    return {
      ...d,
      backgroundPath: backgroundArc(d),
      foregroundPath: !d.stable ? foregroundArc(d) : null,
      fillColor,
      arcOpacity,
    };
  });

  const arcGroups = g
    .selectAll<SVGGElement, (typeof processedArcData)[number]>("g.arc-group")
    .data(processedArcData, (d: any) => `${d.data.id}-${d.key}`);

  arcGroups.exit().transition().duration(300).style("opacity", 0).remove();

  const arcGroupsEnter = arcGroups
    .enter()
    .append("g")
    .attr("class", "arc-group")
    .style("opacity", 0);

  arcGroupsEnter
    .append("path")
    .attr("class", "arc-background")
    .attr("fill", "var(--background)")
    .attr("opacity", 0.5)
    .attr("stroke", "none")
    .style("cursor", "pointer");

  arcGroupsEnter
    .append("path")
    .attr("class", "arc-foreground")
    .attr("stroke", "none")
    .style("pointer-events", "none");

  const arcGroupsMerged = arcGroupsEnter.merge(arcGroups as any);

  arcGroupsMerged.transition().duration(300).style("opacity", 1);

  arcGroupsMerged
    .select<SVGPathElement>(".arc-background")
    .attr("d", (d) => d.backgroundPath)
    .attr("opacity", 0.5);

  arcGroupsMerged
    .select<SVGPathElement>(".arc-foreground")
    .attr("d", (d) => d.foregroundPath)
    .attr("fill", (d) => d.fillColor)
    .attr("opacity", (d) => d.arcOpacity);

  arcGroupsMerged
    .on("mousemove", function (event, d) {
      d3.select(this).select(".arc-background").attr("opacity", 0.7);
      d3.select(this)
        .select(".arc-foreground")
        .attr("opacity", d.data.removed ? 0.3 : 0.85);

      onTooltipShow({
        type: "arc",
        nodeId: d.data.id,
        x: event.clientX,
        y: event.clientY,
        arcKey: d.key,
      });
      onNodeHover(d.data.id);
    })
    .on("mouseout", function (_, d) {
      d3.select(this).select(".arc-background").attr("opacity", 0.5);
      d3.select(this)
        .select(".arc-foreground")
        .attr("opacity", d.data.removed ? 0.4 : 1);
      onTooltipHide();
    })
    .on("contextmenu", (event, d) => {
      event._handledByChild = true;
      onContextMenu("arc", d);
    })
    .on("click", (event, d) => {
      const multi = event.shiftKey || event.ctrlKey;
      handleHighlight(d.id, multi);
    });
};

export default drawArcs;
