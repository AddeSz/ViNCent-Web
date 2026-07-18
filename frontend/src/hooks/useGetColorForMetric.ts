import { useColorStore } from "@/stores/useColorStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { AttributeValue } from "@/types";
import { useCallback } from "react";

export type GetColorForMetric = (
  key: string,
  value?: AttributeValue | null,
) => string;

export const useGetColorForMetric = (): GetColorForMetric => {
  const metricsInfo = useNetworkStore((s) => s.metricsInfo);

  return useCallback(
    (key: string, value?: AttributeValue | null) => {
      const info = metricsInfo.get(key);
      if (!info) return "var(--foreground)";

      const colorStore = useColorStore.getState();

      if (info.isBoolean && value !== undefined && value !== null) {
        return value === true || value === "true" ? "#1AFF1A" : "#D35FB7";
      }
      if (info.isCommunity && value !== undefined && value !== null) {
        return colorStore.getOrAssignCommunityColor(key, value);
      }
      if (info.isCentrality) {
        return colorStore.getOrAssignCentralityColor(key);
      }
      if (info.isCategory && value !== undefined && value !== null) {
        return colorStore.getOrAssignCategoryColor(key, value);
      }
      if (info.isCategory) {
        return "var(--foreground)";
      }
      return colorStore.getOrAssignAttributeColor(key);
    },
    [metricsInfo],
  );
};
