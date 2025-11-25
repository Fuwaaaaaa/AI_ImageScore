import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ScoreGaugeProps {
  score: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous renders

    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius - 20;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Background Arc
    const bgArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    g.append("path")
      .attr("d", bgArc as any)
      .attr("fill", "#27272a"); // Zinc-800

    // Foreground Arc (Score)
    const scoreScale = d3.scaleLinear().domain([0, 100]).range([0, 2 * Math.PI]);
    
    const fgArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(0)
      .cornerRadius(10);

    const path = g.append("path")
      .datum({ endAngle: 0 })
      .attr("d", fgArc as any)
      .attr("fill", score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444"); // Emerald, Amber, Red

    // Animation
    path.transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attrTween("d", function(d: any) {
        const interpolate = d3.interpolate(d.endAngle, scoreScale(score));
        return function(t: any) {
          d.endAngle = interpolate(t);
          return fgArc(d) as string;
        };
      });

    // Text Score
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("fill", "#ffffff")
      .style("font-size", "48px")
      .style("font-weight", "bold")
      .text(0)
      .transition()
      .duration(1500)
      .tween("text", function() {
        const i = d3.interpolateNumber(0, score);
        return function(t) {
            d3.select(this).text(Math.round(i(t)));
        };
      });
      
    // Label
    g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.5em")
        .attr("fill", "#a1a1aa")
        .style("font-size", "14px")
        .style("font-weight", "500")
        .text("TOTAL SCORE");

  }, [score]);

  return <svg ref={svgRef}></svg>;
};

export default ScoreGauge;