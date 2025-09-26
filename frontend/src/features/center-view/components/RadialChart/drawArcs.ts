import type { AttributeInfo } from "@/types/network";
import * as d3 from "d3";
import type { ContextType } from "../../CenterView";
import type { ArcData } from "./RadialChart";

const drawArcs = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  arcData: ArcData[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
  getColorForKey: (key: string, value: string | number) => string,
  centralityRanges: Record<string, { min: number; max: number }>,
  onNodeHover: (nodeId: string) => void,
  onTooltipShow: (tooltipData: {
    type: "arc";
    nodeId: string;
    x: number;
    y: number;
    arcKey: string;
  }) => void,
  onTooltipHide: () => void,
  attributeInfo: Map<string, AttributeInfo>,
  getKeyIndex: (key: string) => number,
  onContextMenuTarget: (target: ContextType, data?: any) => void,
): void => {
  const g = svg.append("g").attr("class", "arcs-group");

  const processedArcData = arcData.map((d) => {
    const startAngle = x(d.data.id) ?? 0;
    const endAngle = startAngle + x.bandwidth();
    const innerRadius = y(getKeyIndex(d.key));
    const fullOuterRadius = y(getKeyIndex(d.key) + 1);

    const backgroundArcGenerator = d3
      .arc<ArcData>()
      .innerRadius(innerRadius)
      .outerRadius(fullOuterRadius)
      .startAngle(startAngle)
      .endAngle(endAngle);

    let foregroundOuterRadius = fullOuterRadius;
    const attribute = attributeInfo.get(d.key);

    if (typeof d.value === "number") {
      let min = 0;
      let max = 1;

      if (attribute?.isNumeric && attribute.range) {
        ({ min, max } = attribute.range);
      } else if (centralityRanges[d.key]) {
        ({ min, max } = centralityRanges[d.key]);
      }

      const proportion = Math.max(
        0,
        Math.min((d.value - min) / (max - min || 1), 1),
      );
      foregroundOuterRadius =
        innerRadius + (fullOuterRadius - innerRadius) * proportion;
    }

    const foregroundArcGenerator = d3
      .arc<ArcData>()
      .innerRadius(innerRadius)
      .outerRadius(foregroundOuterRadius)
      .startAngle(startAngle)
      .endAngle(endAngle);

    return {
      ...d,
      backgroundPath: backgroundArcGenerator(d),
      foregroundPath: foregroundArcGenerator(d),
      fillColor:
        d.value === undefined
          ? "hsl(var(--muted-foreground))"
          : getColorForKey(d.key, d.value),
    };
  });

  const arcGroups = g
    .selectAll("g.arc-group")
    .data(processedArcData)
    .join("g")
    .attr("class", "arc-group");

  arcGroups
    .append("path")
    .attr("class", "arc-background")
    .attr("d", (d) => d.backgroundPath)
    .attr("fill", "var(--background)")
    .attr("opacity", 0.5)
    .attr("stroke", "none")
    .style("cursor", "pointer");

  arcGroups
    .append("path")
    .attr("class", "arc-foreground")
    .attr("d", (d) => d.foregroundPath)
    .attr("fill", (d) => d.fillColor)
    .attr("stroke", "none")
    .attr("opacity", 1)
    .style("pointer-events", "none");

  arcGroups
    .on("mousemove", function (event, d) {
      d3.select(this)
        .select(".arc-background")
        .transition()
        .duration(100)
        .attr("opacity", 0.7);
      d3.select(this)
        .select(".arc-foreground")
        .transition()
        .duration(100)
        .attr("opacity", 0.85);

      onTooltipShow({
        type: "arc",
        nodeId: d.data.id,
        x: event.clientX,
        y: event.clientY,
        arcKey: d.key,
      });
      onNodeHover(d.data.id);
    })
    .on("mouseout", function () {
      d3.select(this)
        .select(".arc-background")
        .transition()
        .duration(100)
        .attr("opacity", 0.5);
      d3.select(this)
        .select(".arc-foreground")
        .transition()
        .duration(100)
        .attr("opacity", 1);
      onTooltipHide();
    })
    .on("click", (_, d) => {
      console.log(d.value);
    })
    .on("contextmenu", (event, d) => {
      event._handledByChild = true;
      onContextMenuTarget("arc", d);
    });
};

export default drawArcs;
