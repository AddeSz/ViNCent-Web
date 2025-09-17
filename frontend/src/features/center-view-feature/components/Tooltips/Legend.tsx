import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import { useVisualizationStore } from "@/hooks/useVisualizationStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { formatValue } from "@/utils/utils";

const Legend = () => {
  const hoveredNode = useNetworkStore((state) => state.hoveredNode);
  const centralityKeys = useCentralityStore(
    (state) => state.enabledCentralityKeys,
  );
  const centralityRanges = useCentralityStore(
    (state) => state.centralityRanges,
  );
  const attributeKeys = useAttributeStore(
    (state) => state.enabledAttributeKeys,
  );
  const nodeAttributes = useAttributeStore((state) => state.nodeAttributes);
  const attributeInfo = useAttributeStore((state) => state.attributeInfo);
  const getColorForKey = useVisualizationStore((state) => state.getColorForKey);
  const { radialSettings } = useChartSettings();

  if (!hoveredNode) {
    return (
      <div className="h-[calc(100%-4px)]">
        <p className="p-2 text-center text-muted-foreground">
          Hover over chart elements to see details
        </p>
      </div>
    );
  }

  const displayMode = radialSettings.displayMode;
  const keysToShow =
    displayMode === "attributes"
      ? attributeKeys
      : displayMode === "centrality"
        ? centralityKeys
        : [...centralityKeys, ...attributeKeys];

  const centralityMetrics =
    displayMode !== "attributes"
      ? centralityKeys
          .filter((key) => keysToShow.includes(key))
          .map((key) => {
            const rawValue = hoveredNode[key as keyof typeof hoveredNode];
            const value =
              typeof rawValue === "number" ? rawValue : Number(rawValue) || 0;
            const { min, max } = centralityRanges[key] || { min: 0, max: 1 };
            const proportion = Math.max(
              0,
              Math.min((value - min) / (max - min || 1), 1),
            );

            let percentage = (proportion * 100).toFixed(2);
            if (Number(percentage) === 100) percentage = "100";
            if (Number(percentage) === 0) percentage = "0.0";

            return {
              key,
              value,
              color: getColorForKey(key),
              percentage,
              proportion,
              isAttribute: false,
            };
          })
      : [];

  const attributeMetrics =
    displayMode !== "centrality"
      ? attributeKeys
          .filter((key) => keysToShow.includes(key))
          .map((key) => {
            const value = nodeAttributes[hoveredNode.id]?.[key];
            const info = attributeInfo[key];
            const color = info?.isCategorical
              ? getColorForKey(
                  key,
                  value !== undefined ? String(value) : undefined,
                )
              : getColorForKey(key);

            return {
              key,
              value,
              color,
              proportion: 1,
              percentage: "",
              isAttribute: true,
            };
          })
      : [];

  const nodeMetrics = [...centralityMetrics, ...attributeMetrics];

  return (
    <div className="h-auto space-y-1">
      <div className="border-b pb-1">
        <div className="text-sm font-semibold text-foreground">
          Node Details:
          <span className="mt-1 text-sm text-muted-foreground">
            {" "}
            {hoveredNode.label ? hoveredNode.label : hoveredNode.id}
          </span>
        </div>
      </div>
      <div className="space-y-0.5">
        {nodeMetrics.map(
          ({ key, value, color, percentage, proportion, isAttribute }) => (
            <div key={key} className="flex items-center gap-1 py-1">
              <div
                className="h-4 w-4 flex-shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="w-full max-w-24 truncate text-xs font-medium capitalize">
                {key.replace(/_/g, " ")}
              </div>

              {!isAttribute ? (
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
                <div className="w-fit min-w-24 font-mono text-xs text-muted-foreground tabular-nums">
                  {formatValue(value)}
                </div>
              )}
            </div>
          ),
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default Legend;
