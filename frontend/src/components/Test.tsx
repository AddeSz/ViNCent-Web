import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const Test = () => {
  const [message, setMessage] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("width", 200)
      .attr("height", 200)
      .append("circle")
      .attr("cx", 100)
      .attr("cy", 100)
      .attr("r", 50)
      .attr("fill", "steelblue");

    fetch(import.meta.env.VITE_BACKEND_URL + "/")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Not Working"));
  }, []);

  return (
    <>
      <h2>Typescript Works</h2>
      <h2>Backend {message || "Loading..."}</h2>
      <h2>D3 Works</h2>
      <svg ref={svgRef} className="bg-blue-950" />
    </>
  );
};

export default Test;
