import { useKeys } from "@/hooks/useKeys";
import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { formatKeyLabel, formatValue } from "@/utils/utils";
import { useMemo } from "react";

const Legend = () => {
  const hoveredNode = useNetworkStore((s) => s.hoveredNode);
  const attributeData = useAttributeStore((s) => s.attributeData);
  const attributeInfo = useAttributeStore((s) => s.attributeInfo);
  const centralityRanges = useCentralityStore((s) => s.centralityRanges);
  const getColorForKey = useVisualizationStore((s) => s.getColorForKey);

  const { allKeys, enabledAttributeKeys, enabledCentralityKeys } = useKeys();

  const nodeMetrics = useMemo(() => {
    if (!hoveredNode) return [];

    return allKeys.map((key) => {
      const isAttribute = enabledAttributeKeys.includes(key);
      const isCentrality = enabledCentralityKeys.includes(key);

      let value: any;
      let proportion = 1;
      let percentage = "";

      if (isCentrality) {
        const rawValue = hoveredNode[key as keyof typeof hoveredNode];
        value = typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;

        const { min, max } = centralityRanges[key] || { min: 0, max: 1 };
        proportion = Math.max(0, Math.min((value - min) / (max - min || 1), 1));

        percentage = (proportion * 100).toFixed(2);
        if (+percentage === 100) percentage = "100";
        if (+percentage === 0) percentage = "0.0";
      } else if (isAttribute) {
        value = attributeData.get(hoveredNode.id)?.[key];
        const info = attributeInfo.get(key);

        if (info?.isNumeric && typeof value === "number" && info.range) {
          const { min, max } = info.range;
          proportion = Math.max(
            0,
            Math.min((value - min) / (max - min || 1), 1),
          );
          percentage = (proportion * 100).toFixed(2);
          if (+percentage === 100) percentage = "100";
          if (+percentage === 0) percentage = "0.0";
        }
      }

      const color = getColorForKey(
        key,
        value !== undefined ? value : undefined,
      );

      return {
        key,
        value,
        proportion,
        percentage,
        color,
        isAttribute,
        isNumeric: isCentrality || attributeInfo.get(key)?.isNumeric,
      };
    });
  }, [hoveredNode, allKeys, enabledAttributeKeys, enabledCentralityKeys]);

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
          </span>
        </div>
      </div>
      <div className="space-y-0.5">
        {nodeMetrics.map(
          ({
            key,
            value,
            color,
            percentage,
            proportion,
            isAttribute,
            isNumeric,
          }) => (
            <div key={key} className="flex items-center gap-1 py-1">
              <div
                className="h-4 w-4 flex-shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                title={formatKeyLabel(key)}
              />
              <p
                className="w-full max-w-24 truncate text-xs font-medium capitalize"
                title={formatKeyLabel(key)}
              >
                {formatKeyLabel(key)}
              </p>

              {!isAttribute || isNumeric ? (
                <>
                  <span className="w-14 min-w-12 font-mono text-xs text-muted-foreground tabular-nums">
                    {percentage}%
                  </span>
                  <span className="w-12 min-w-10 font-mono text-xs text-muted-foreground tabular-nums">
                    {formatValue(value)}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: color,
                          width: `${(proportion || 1) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="w-fit min-w-24 font-mono text-xs text-muted-foreground tabular-nums">
                  {formatValue(value)}
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
