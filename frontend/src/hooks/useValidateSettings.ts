import { useSettingsStore } from "@/stores/useSettingsStore";
import { useEffect } from "react";
import { useKeys } from "./useKeys";

export const useValidateSettings = () => {
  const { enabledNodeKeys, enabledNodeCommunityKeys } = useKeys();
  const { displaySettings, setDisplaySettings } = useSettingsStore();

  const validLabelKeys = [
    "label",
    ...enabledNodeKeys,
    ...enabledNodeCommunityKeys,
  ];
  const validCommunityKeys = ["none", ...enabledNodeCommunityKeys];

  useEffect(() => {
    const currentLabel = displaySettings.displayLabel || "label";
    const currentCommunity = displaySettings.selectedCommunity || "none";

    let needsUpdate = false;
    const updates: Partial<typeof displaySettings> = {};

    if (!validLabelKeys.includes(currentLabel)) {
      updates.displayLabel = "label";
      needsUpdate = true;
    }

    if (!validCommunityKeys.includes(currentCommunity)) {
      updates.selectedCommunity = "none";
      needsUpdate = true;
    }

    if (needsUpdate) {
      setDisplaySettings(updates);
    }
  }, [
    validLabelKeys.join(","),
    validCommunityKeys.join(","),
    displaySettings.displayLabel,
    displaySettings.selectedCommunity,
    setDisplaySettings,
  ]);
};
