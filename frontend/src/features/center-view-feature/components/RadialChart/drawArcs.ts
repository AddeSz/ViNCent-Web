import * as d3 from "d3";
import type { Selection, Series, ScaleBand, ScaleLinear } from "d3";
import type { Centrality } from "@/types/network";

type ArcData = {
  key: string;
  0: number;
  1: number;
  data: Centrality;
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
  arcPadding: number,
): void => {
  const arc = d3
    .arc<ArcData>()
    .innerRadius((d) => y(d[0]))
    .outerRadius((d) => y(d[1]) - arcPadding)
    .startAngle((d) => x(d.data.id) ?? 0)
    .endAngle((d) => (x(d.data.id) ?? 0) + x.bandwidth());
  // .padAngle(groupPadding)
  // .padRadius((d) => y(d[0]) + y(d[1]));
  // .padAngle(0)
  // .padRadius(10);

  const colorScale = d3
    .scaleSequential<string>()
    .domain([0, series.length - 1])
    .interpolator(d3.interpolateSpectral);

  const keyIndexMap = new Map(series.map((d, i) => [d.key, i]));

  function getColorForKey(key: string): string {
    return colorScale(keyIndexMap.get(key) ?? 0);
  }

  svg
    .append("g")
    .selectAll()
    .data(series)
    .join("g")
    .selectAll("path")
    .data((layer) =>
      layer.map((d, _) => ({
        ...d,
        key: layer.key,
        value: d.data[layer.key as keyof Centrality],
      })),
    )
    .join("path")
    .attr("d", arc)
    .attr("opacity", 1)
    .attr("fill", (d) =>
      d.value === undefined ? "gray" : getColorForKey(d.key),
    )
    .attr("stroke", "black")
    .attr("stroke-width", 1)
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
};

export default drawArcs;
