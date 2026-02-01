import { type BrushRange } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";
import { formatValue } from "@/utils/utils";
import { useMemo, useRef } from "react";
import type { ChartDimensions } from "../ChartFiltering";
import type { BinnedData } from "../components/createBinnedData";
import { Tooltip } from "../components/Tooltip";
import { HistogramAxes } from "./components/HistogramAxes";
import { HistogramBars } from "./components/HistogramBars";
import { HistogramBrushOverlay } from "./components/HistogramBrushOverlay";
import { useHistogramInteraction } from "./components/useHistogramInteraction";
import { useHistogramScales } from "./components/useHistogramScales";

interface HistogramProps {
  binnedData: BinnedData;
  filteredData: Map<string, FullData>;
  dimensions: ChartDimensions;
  dataKey: string;
  getColorForMetric: (key: string) => string;
  brushRange: BrushRange | null;
  onBrushChange: (range: BrushRange | null) => void;
  disabledValues: Set<number | string>;
  onDisabledValuesChange: (values: Set<number | string>) => void;
}

const MIN_BAR_WIDTH = 5;

const Histogram = ({
  binnedData,
  filteredData,
  dimensions,
  dataKey,
  getColorForMetric,
  brushRange,
  onBrushChange,
  disabledValues,
  onDisabledValuesChange,
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

  const color = getColorForMetric(dataKey);
  const setBarHoveredNodes = useNetworkStore((s) => s.setBarHoveredNodes);

  const barWidth = chartWidth / binnedData.bins.length;
  const canRenderBars = barWidth >= MIN_BAR_WIDTH;

  const { filteredBinCounts, nodeIdsInBin } = useMemo(() => {
    if (!filteredData) {
      return {
        filteredBinCounts: null,
        nodeIdsInBin: new Map<number, Set<string>>(),
      };
    }

    const counts = new Array<number>(binnedData.bins.length).fill(0);
    const binToNodeIds = new Map<number, Set<string>>();

    for (const [nodeId, data] of filteredData.entries()) {
      const value = data[dataKey];

      if (typeof value !== "number") continue;

      const binIndex = binnedData.valueToBinIndex.get(value);
      if (binIndex === undefined || disabledValues.has(binIndex)) continue;

      counts[binIndex]++;

      let set = binToNodeIds.get(binIndex);
      if (!set) {
        set = new Set();
        binToNodeIds.set(binIndex, set);
      }
      set.add(nodeId);
    }

    return {
      filteredBinCounts: counts,
      nodeIdsInBin: binToNodeIds,
    };
  }, [binnedData, filteredData, disabledValues]);

  const { yScale, yTicks, xTicks, getBinPosition } = useHistogramScales(
    binnedData,
    chartWidth,
    chartHeight,
  );

  const binIndexToValue = (binIndex: number) => {
    return {
      start: binnedData.bins[binIndex].x0,
      end: binnedData.bins[binIndex].x1,
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
    binnedData: binnedData,
  });

  const activeRange = isDragging ? tempBrushRange : brushRange;

  const getBinIndexFromEvent = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const binIndex = Math.min(
      Math.floor((x / chartWidth) * binnedData.bins.length),
      binnedData.bins.length - 1,
    );
    return binIndex;
  };

  const handleBinHover = (binIndex: number | null) => {
    if (binIndex === null) {
      setBarHoveredNodes(new Set());
    } else {
      const nodeIds = nodeIdsInBin.get(binIndex) || new Set();
      setBarHoveredNodes(nodeIds);
    }
  };

  if (!canRenderBars) {
    return (
      <div className="flex h-full w-full items-center justify-center p-1">
        <div className="text-center">
          <div className="text-sm font-medium text-muted-foreground">
            Too many bins to display ({binnedData.bins.length})
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Increasing window size may help
          </div>
        </div>
      </div>
    );
  }

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
            bins={binnedData.bins}
            getBinPosition={getBinPosition}
          />

          <HistogramBars
            binnedData={binnedData}
            chartHeight={chartHeight}
            color={color}
            yScale={yScale}
            getBinPosition={getBinPosition}
            isBinSelected={(binIndex) =>
              isBinSelected(binIndex, binnedData.bins)
            }
            hoverBin={hoverBin}
            filteredBinCounts={filteredBinCounts}
            dataKey={dataKey}
            disabledValues={disabledValues}
            filteredData={filteredData}
            onBinHover={handleBinHover}
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

                const current = disabledValues;
                const next = new Set(current);
                if (next.has(binIndex)) next.delete(binIndex);
                else next.add(binIndex);
                onDisabledValuesChange(next);
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
            {formatValue(binnedData.bins[hoverBin].x0)} –{" "}
            {formatValue(binnedData.bins[hoverBin].x1)}
          </div>
          <div className="text-muted-foreground">
            {filteredBinCounts &&
            filteredBinCounts[hoverBin] <
              binnedData.bins[hoverBin].values.length ? (
              <>
                Count: {filteredBinCounts[hoverBin]} /{" "}
                {binnedData.bins[hoverBin].values.length}
              </>
            ) : (
              <>Count: {binnedData.bins[hoverBin].values.length}</>
            )}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default Histogram;
