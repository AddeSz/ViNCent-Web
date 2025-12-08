import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import { useEffect, useMemo, useState } from "react";

interface LegendProps {
  nodeData: Map<string, FullData>;
}

const Legend = ({ nodeData }: LegendProps) => {
  const hoveredNode = useNetworkStore((s) => s.hoveredNode);
  const getColorForMetric = useMetricsStore((s) => s.getColorForMetric);
  const metricsInfo = useMetricsStore((s) => s.metricsInfoCurrent);
  const { enabledNodeKeys } = useKeys();

  const [lastHoveredNode, setLastHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (hoveredNode) {
      setLastHoveredNode(hoveredNode);
    }
  }, [hoveredNode]);

  const displayNode = hoveredNode || lastHoveredNode;
  const data = displayNode ? nodeData.get(displayNode) : null;

  const nodeMetrics = useMemo(() => {
    if (!displayNode) return [];

    const isStable = data?.stable ?? false;
    return enabledNodeKeys.map((key) => {
      const info = metricsInfo.get(key);
      const value = data?.[key];

      let proportion = 0;
      let percentage = "";
      let formattedValue = formatValue(value);

      if (info?.isNumeric && info.range && typeof value === "number") {
        const { min, max } = info.range;
        let diff = max - min;

        if (Math.abs(diff) < 1e-9) {
          proportion = 1;
        } else {
          proportion = Math.max(0, Math.min((value - min) / diff, 1));
        }
        percentage = (proportion * 100).toFixed(2);
        if (+percentage === 100) percentage = "100";
        if (+percentage === 0) percentage = "0.0";
      }

      const color = getColorForMetric(key, value);

      return {
        key,
        proportion: isStable ? 0 : proportion,
        percentage: isStable ? "" : percentage,
        color,
        isNumeric: info?.isNumeric,
        formattedValue: isStable ? "N/A" : formattedValue,
      };
    });
  }, [displayNode, enabledNodeKeys, nodeData, metricsInfo]);

  if (!displayNode) {
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
            {data?.label || data?.id}
          </span>{" "}
          {data?.stable && (
            <span className="text-xs text-muted-foreground italic">
              (Stable Node)
            </span>
          )}
          {data?.removed && (
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
