import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import { useMemo } from "react";

export const useKeys = () => {
  const enabledAttributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const enabledCentralityKeys = useCentralityStore(
    (s) => s.enabledCentralityKeys,
  );
  const attributeKeys = useAttributeStore((s) => s.attributeKeys);
  const centralityKeys = useCentralityStore((s) => s.centralityKeys);
  const displayMode = useChartSettings((s) => s.displaySettings.displayMode);

  const allKeys = useMemo(() => {
    const filteredAttributeKeys = enabledAttributeKeys.filter(
      (key) => key !== "linkCount",
    );

    if (displayMode === "attributes") return [...filteredAttributeKeys];
    if (displayMode === "centrality") return [...enabledCentralityKeys];
    return [...enabledCentralityKeys, ...filteredAttributeKeys];
  }, [enabledAttributeKeys, enabledCentralityKeys, displayMode]);

  return {
    allKeys,
    attributeKeys: attributeKeys.filter((k) => k !== "linkCount"),
    centralityKeys,
    enabledAttributeKeys: enabledAttributeKeys.filter((k) => k !== "linkCount"),
    enabledCentralityKeys,
  };
};
