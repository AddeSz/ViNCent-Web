import { useCurrentMetricsInfo } from "@/hooks/useCurrentMetricsInfo";
import { useGetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useKeys } from "@/hooks/useKeys";
import { useInteractionStore } from "@/stores/useInteractionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { ViewNode } from "@/types";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import { useEffect, useMemo, useState } from "react";

interface LegendProps {
  nodeData: Map<string, ViewNode>;
}

const Legend = ({ nodeData }: LegendProps) => {
  const hoveredNode = useInteractionStore((s) => s.hoveredNode);
  const getColorForMetric = useGetColorForMetric();
  const metricsInfo = useCurrentMetricsInfo();
  const {
    enabledNodeCentralityKeys,
    enabledNodeAttributeKeys,
    enabledNodeCommunityKeys,
  } = useKeys();
  const communitiesInArcs = useSettingsStore(
    (s) => s.radialSettings.communitiesInArcs,
  );
  const selectedCommunity = useSettingsStore(
    (s) => s.displaySettings.selectedCommunity,
  );
  const [lastHoveredNode, setLastHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (hoveredNode) {
      setLastHoveredNode(hoveredNode);
    }
  }, [hoveredNode]);

  const displayNode = hoveredNode || lastHoveredNode;
  const data = displayNode ? nodeData.get(displayNode) : null;

  const communityKeysToUse = useMemo(() => {
    if (!enabledNodeCommunityKeys.length) return [];

    if (communitiesInArcs) {
      return enabledNodeCommunityKeys;
    }

    if (selectedCommunity !== "none") {
      return enabledNodeCommunityKeys.filter(
        (key) => key === selectedCommunity,
      );
    }

    return [];
  }, [enabledNodeCommunityKeys, communitiesInArcs, selectedCommunity]);

  const nodeMetrics = useMemo(() => {
    if (!displayNode) return [];

    const isRemoved = data?.flags.removed ?? false;
    return [
      ...enabledNodeCentralityKeys,
      ...enabledNodeAttributeKeys,
      ...communityKeysToUse,
    ].map((key) => {
      const info = metricsInfo.get(key);
      const value = data?.attributes[key];

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
        proportion: isRemoved ? 0 : proportion,
        percentage: isRemoved ? "" : percentage,
        color,
        isNumeric: info?.isNumeric,
        formattedValue: isRemoved ? "N/A" : formattedValue,
      };
    });
  }, [
    displayNode,
    enabledNodeAttributeKeys,
    enabledNodeCentralityKeys,
    communityKeysToUse,
    nodeData,
    metricsInfo,
  ]);

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
    <div className="h-auto space-y-0.5 px-2 pt-0.5 pb-2">
      <div className="border-b">
        <div className="text-sm font-semibold text-foreground">
          Node Details:{" "}
          <span className="mt-1 text-sm text-muted-foreground">
            {data?.label || data?.id}
          </span>
          {data?.flags.removed && (
            <span className="text-xs text-muted-foreground italic">
              (Removed Node)
            </span>
          )}
          {data?.flags.pendingRemoval && (
            <span className="text-xs text-muted-foreground italic">
              (Pending Removal)
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        {nodeMetrics.map(
          ({
            key,
            color,
            percentage,
            proportion,
            isNumeric,
            formattedValue,
          }) => (
            <div key={key} className="flex items-center gap-1">
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
    </div>
  );
};

export default Legend;
