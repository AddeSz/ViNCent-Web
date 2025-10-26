import { type ScaleLinear } from "d3";

interface HistogramAxesProps {
  chartWidth: number;
  chartHeight: number;
  yTicks: number[];
  xTicks: Array<{ x: number; value: number }>;
  yScale: ScaleLinear<number, number>;
}

export const HistogramAxes = ({
  chartWidth,
  chartHeight,
  yTicks,
  xTicks,
  yScale,
}: HistogramAxesProps) => {
  const formatAxisValues = (x: number) => {
    if (Math.abs(x) < 1) {
      return Intl.NumberFormat("en", {
        maximumFractionDigits: 3,
      }).format(x);
    }
    return Intl.NumberFormat("en", {
      maximumFractionDigits: 0,
    }).format(x);
  };

  return (
    <>
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={chartHeight}
        stroke="currentColor"
        strokeOpacity={1}
      />

      {yTicks.map((t, i) => {
        const y = Math.round(yScale(t));
        return (
          <g key={`y-${t}-${i}`}>
            {t !== 0 && (
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="white"
                strokeOpacity={0.3}
                strokeDasharray="4,8"
                className="pointer-events-none"
              />
            )}
            <line x1={-4} y1={y} x2={0} y2={y} stroke="currentColor" />
            <text
              x={-6}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="currentColor"
            >
              {t}
            </text>
          </g>
        );
      })}

      <line
        x1={0}
        y1={chartHeight}
        x2={chartWidth}
        y2={chartHeight}
        stroke="currentColor"
      />

      {xTicks.map(({ x, value }, idx) => {
        return (
          <g key={`x-${idx}`}>
            <line
              x1={x}
              y1={chartHeight}
              x2={x}
              y2={chartHeight + 4}
              stroke="currentColor"
            />
            <text
              x={x}
              y={chartHeight + 16}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
            >
              {formatAxisValues(value)}
            </text>
          </g>
        );
      })}
    </>
  );
};
