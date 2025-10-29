import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type { FullData } from "@/types/network";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import { useMemo } from "react";

interface LegendProps {
  dataMap: Map<string, FullData>;
}

const Legend = ({ dataMap }: LegendProps) => {
  const hoveredNode = useNetworkStore((s) => s.hoveredNode);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);
  const { allKeys } = useKeys();

  const nodeMetrics = useMemo(() => {
    if (!hoveredNode) return [];

    const nodeData = dataMap.get(hoveredNode.id);
    const isStable = nodeData?.stable ?? false;
    return allKeys.map((key) => {
      const info = metricsInfo.get(key);
      const value = nodeData?.[key];

      let proportion = 0;
      let percentage = "";
      let formattedValue = formatValue(value);

      if (info?.isNumeric && info.range && typeof value === "number") {
        const { min, max } = info.range;
        proportion = Math.max(0, Math.min((value - min) / (max - min || 1), 1));
        percentage = (proportion * 100).toFixed(2);
        if (+percentage === 100) percentage = "100";
        if (+percentage === 0) percentage = "0.0";
      }

      const color = getColorForKey(key, value);

      return {
        key,
        proportion: isStable ? 0 : proportion,
        percentage: isStable ? "" : percentage,
        color,
        isNumeric: info?.isNumeric,
        formattedValue: isStable ? "N/A" : formattedValue,
      };
    });
  }, [hoveredNode, allKeys, dataMap, metricsInfo]);

  if (!hoveredNode) {
    return (
      <div className="h-[calc(100%-4px)]">
        <p className="p-2 text-center text-muted-foreground">
          Hover over chart elements to see details
        </p>
      </div>
    );
  }

  return (
    <div className="h-auto space-y-1">
      <div className="border-b pb-1">
        <div className="text-sm font-semibold text-foreground">
          Node Details:
          <span className="mt-1 text-sm text-muted-foreground">
            {" "}
            {hoveredNode.label || hoveredNode.id}
          </span>{" "}
          {dataMap.get(hoveredNode.id)?.stable && (
            <span className="text-xs text-muted-foreground italic">
              (Stable Node)
            </span>
          )}
          {dataMap.get(hoveredNode.id)?.removed && (
            <span className="text-xs text-muted-foreground italic">
              (Removed Node)
            </span>
          )}
        </div>
      </div>
      <div className="space-y-0.5">
        {nodeMetrics.map(
          ({
            key,
            color,
            percentage,
            proportion,
            isNumeric,
            formattedValue,
          }) => (
            <div key={key} className="flex items-center gap-1 py-1">
              <div
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                title="N/A"
              />
              <p
                className="w-24 truncate text-xs font-medium capitalize"
                title={formatKeyLabel(key)}
              >
                {formatKeyLabel(key)}
              </p>

              {isNumeric ? (
                <>
                  <span className="w-14 min-w-12 font-mono text-xs text-muted-foreground tabular-nums">
                    {percentage ? `${percentage}%` : "N/A"}
                  </span>
                  <span className="w-12 min-w-10 font-mono text-xs text-muted-foreground tabular-nums">
                    {formattedValue}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: color,
                          width: `${(proportion || 0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="w-fit min-w-24 font-mono text-xs text-muted-foreground tabular-nums">
                  {formattedValue}
                </p>
              )}
            </div>
          ),
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Last updated: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
};

export default Legend;
