import { useMetricsStore, type BrushRange } from "@/stores/useMetricsStore";
import { formatValue } from "@/utils/utils";
import { useMemo, useRef, useState } from "react";
import type { ChartDimensions } from "../ChartFiltering";
import type { BinnedData } from "../components/createBinnedData";
import { Tooltip } from "../components/Tooltip";
import { HistogramAxes } from "./components/HistogramAxes";
import { HistogramBars } from "./components/HistogramBars";
import { HistogramBrushOverlay } from "./components/HistogramBrushOverlay";
import { useHistogramInteraction } from "./components/useHistogramInteraction";
import { useHistogramScales } from "./components/useHistogramScales";

interface HistogramProps {
  data: BinnedData;
  dimensions: ChartDimensions;
  dataKey: string;
  getColorForKey: (key: string) => string;
  brushRange: BrushRange | null;
  onBrushChange: (range: BrushRange | null) => void;
  filteredNodeIds?: Set<string>;
}

const Histogram = ({
  data,
  dimensions,
  dataKey,
  getColorForKey,
  brushRange,
  onBrushChange,
  filteredNodeIds,
}: HistogramProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    svgWidth: width,
    svgHeight: height,
    margin,
    chartWidth,
    chartHeight,
  } = dimensions;
  const metricsData = useMetricsStore((s) => s.metricsData);
  const [disabledBins, setDisabledBins] = useState<Set<number>>(new Set());

  const color = getColorForKey(dataKey);

  const filteredBinCounts = useMemo(() => {
    if (!filteredNodeIds) return null;

    const counts = new Array(data.bins.length).fill(0);

    Array.from(metricsData.keys()).forEach((nodeId) => {
      if (!filteredNodeIds.has(nodeId)) return;
      const value = metricsData.get(nodeId)?.[dataKey];
      if (typeof value === "number") {
        const binIndex = data.valueToBinIndex.get(value);
        if (binIndex !== undefined && !disabledBins.has(binIndex)) {
          counts[binIndex]++;
        }
      }
    });

    return counts;
  }, [data, filteredNodeIds, metricsData, dataKey, disabledBins]);

  const { yScale, yTicks, xTicks, getBinPosition } = useHistogramScales(
    data,
    chartWidth,
    chartHeight,
  );

  const binIndexToValue = (binIndex: number) => {
    return {
      start: data.bins[binIndex].x0,
      end: data.bins[binIndex].x1,
    };
  };

  const {
    hoverBin,
    isDragging,
    tempBrushRange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    isBinSelected,
  } = useHistogramInteraction({
    onBrushChange,
    brushRange,
    binIndexToValue,
    binnedData: data,
  });

  const activeRange = isDragging ? tempBrushRange : brushRange;

  const getBinIndexFromEvent = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const binIndex = Math.min(
      Math.floor((x / chartWidth) * data.bins.length),
      data.bins.length - 1,
    );
    return binIndex;
  };

  return (
    <div className="relative" ref={containerRef}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          <HistogramBrushOverlay
            brushRange={activeRange}
            chartHeight={chartHeight}
            bins={data.bins}
            getBinPosition={getBinPosition}
          />

          <HistogramBars
            data={data}
            chartHeight={chartHeight}
            color={color}
            yScale={yScale}
            getBinPosition={getBinPosition}
            isBinSelected={(binIndex) => isBinSelected(binIndex, data.bins)}
            hoverBin={hoverBin}
            filteredBinCounts={filteredBinCounts}
            dataKey={dataKey}
            disabledBins={disabledBins}
          />

          {/* interaction layer, didnt need to be its own component... */}
          <rect
            x={0}
            y={0}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            onMouseDown={(e) => {
              const binIndex = getBinIndexFromEvent(e);
              if (e.button === 2) {
                e.preventDefault();

                setDisabledBins((prev) => {
                  const next = new Set(prev);
                  if (next.has(binIndex)) next.delete(binIndex);
                  else next.add(binIndex);
                  return next;
                });
                return;
              }
              if (e.button !== 0) return;
              handleMouseDown(binIndex);
            }}
            onMouseMove={(e) => handleMouseMove(getBinIndexFromEvent(e))}
            className="cursor-crosshair"
            style={{ pointerEvents: "all" }}
            onContextMenu={(e) => e.preventDefault()}
          />

          <HistogramAxes
            chartWidth={chartWidth}
            chartHeight={chartHeight}
            yTicks={yTicks}
            xTicks={xTicks}
            yScale={yScale}
          />
        </g>
      </svg>

      {hoverBin !== null && (
        <Tooltip
          isVisible={true}
          containerRef={containerRef}
          margin={margin}
          targetX={getBinPosition(hoverBin).x}
          targetWidth={getBinPosition(hoverBin).width}
        >
          <div className="font-medium">
            {formatValue(data.bins[hoverBin].x0)} –{" "}
            {formatValue(data.bins[hoverBin].x1)}
          </div>
          <div className="text-muted-foreground">
            {filteredBinCounts &&
            filteredBinCounts[hoverBin] < data.bins[hoverBin].values.length ? (
              <>
                Count: {filteredBinCounts[hoverBin]} /{" "}
                {data.bins[hoverBin].values.length}
              </>
            ) : (
              <>Count: {data.bins[hoverBin].values.length}</>
            )}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default Histogram;
