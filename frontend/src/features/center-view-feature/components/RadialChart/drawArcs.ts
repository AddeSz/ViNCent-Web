import * as d3 from "d3";
import { getColorForKey } from "@/utils/ColorHelper";
import type { Selection, Series, ScaleBand, ScaleLinear } from "d3";
import type { Centrality } from "@/types/network";

type ArcData = {
  key: string;
  0: number;
  1: number;
  data: Centrality;
  value: number;
};

export const formatValue = (x: any): string => {
  if (x === undefined || x === null) return "N/A";
  if (typeof x === "number") return isNaN(x) ? "N/A" : x.toLocaleString("en");
  if (typeof x === "string") {
    return x
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }
  return String(x);
};

const drawArcs = (
  svg: Selection<SVGGElement, unknown, null, undefined>,
  series: Series<Centrality, string>[],
  x: ScaleBand<string>,
  y: ScaleLinear<number, number>,
): void => {

  const maxValues: Record<string, number> = {};
  series.forEach((layer) => {
    const max = d3.max(layer, (d) => d.data[layer.key as keyof Centrality] as number);
    if (max !== undefined) maxValues[layer.key] = max;
  });

  const arcData = series.flatMap((layer) =>
    layer.map((d) => ({
      ...d,
      key: layer.key,
      value: d.data[layer.key as keyof Centrality] as number,
    }))
  );

  const g = svg.append("g").attr("class", "arcs-group");

  g.selectAll("path.fill")
    .data(arcData)
    .join("path")
    .attr("class", "fill")
    .attr("d", (d) => {
      const startAngle = x(d.data.id) ?? 0;
      const endAngle = startAngle + x.bandwidth();

      const innerRadius = y(d[0]);
      const fullOuterRadius = y(d[1]);

      const max = maxValues[d.key] || 1;
      const proportion = Math.min((d.value ?? 0) / max, 1);
      const outerRadius = innerRadius + (fullOuterRadius - innerRadius) * proportion;

      const arc = d3.arc<ArcData>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle);

      return arc(d);
    })
    .attr("fill", (d) =>
      d.value === undefined ? "gray" : getColorForKey(d.key),
    )
    .attr("stroke", "none")
    .attr("opacity", 1)
    .on("mouseover", function () {
      d3.select(this).transition().duration(100).attr("opacity", 0.8);
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(100).attr("opacity", 1);
    })
    .on("click", function (_, d) {
      console.log(formatValue(d.value));
    })
    .append("title")
    .text((d) => `${d.data.id} : ${d.key}\n${formatValue(d.value)}`);

  g.selectAll("path.arcBackground")
    .data(arcData)
    .join("path")
    .attr("class", "arcBackground")
    .attr("d", (d) => {
      const startAngle = x(d.data.id) ?? 0;
      const endAngle = startAngle + x.bandwidth();
      const innerRadius = y(d[0]);
      const outerRadius = y(d[1]);

      const arc = d3.arc<ArcData>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle);

      return arc(d);
    })
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1);
};

export default drawArcs;
