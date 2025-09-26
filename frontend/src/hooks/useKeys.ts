import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import { useMemo } from "react";

export const useKeys = () => {
  const attributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const centralityKeys = useCentralityStore((s) => s.enabledCentralityKeys);
  const displayMode = useChartSettings((s) => s.displayMode);

  const allKeys = useMemo(() => {
    if (displayMode === "attributes") return [...attributeKeys];
    if (displayMode === "centrality") return [...centralityKeys];
    return [...centralityKeys, ...attributeKeys];
  }, [attributeKeys, centralityKeys, displayMode]);

  return {
    allKeys,
    attributeKeys,
    centralityKeys,
  };
};
