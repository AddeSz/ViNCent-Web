import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

export const handleHighlight = (id: string, multi: boolean) => {
  if (multi) {
    useNetworkStore.getState().toggleNodeSelection(id);
  } else {
    useNetworkStore.getState().selectNode(id, false);
  }
};

export const handleBrushSelection = (selectedIds: string[]) => {
  if (selectedIds.length === 0) return;

  selectedIds.forEach((id) => {
    handleHighlight(id, true);
  });
};

export const highlightBoundsColor = {
  default: "black",
  selected: "orange",
  hover: "var(--accent-foreground)",
};

export const highlightLabelColor = {
  default: "var(--foreground)",
  selected: "orange",
  hover: "var(--accent-foreground)",
};

export const highlightLinksColor = {
  default: "#888",
  selected: "orange",
  hover: "var(--accent-foreground)",
};

export const highlightNodeColor = {
  removed: "#9c0202",
  added: "green",
  default: "steelblue",
  selectedOutline: "orange",
  hoveredOutline: "var(--accent-foreground)",
};

export const getLinkStyle = (
  isRemoved: boolean,
  isSelected: boolean,
  isHovered: boolean,
  defaultOpacity: number,
  selectedOpacity: number,
) => {
  const { displaySettings } = useSettingsStore.getState();
  const { keepPreviewNodes } = displaySettings;

  let stroke: string;

  if (isRemoved) {
    stroke = keepPreviewNodes ? "red" : highlightLinksColor.default;
  } else if (isSelected) {
    stroke = highlightLinksColor.selected;
  } else if (isHovered) {
    stroke = highlightLinksColor.hover;
  } else {
    stroke = highlightLinksColor.default;
  }

  let opacity: number;

  if (isRemoved && isSelected) {
    opacity = 0.6;
  } else if (isRemoved && isHovered) {
    opacity = defaultOpacity;
  } else if (isRemoved) {
    opacity = keepPreviewNodes ? 0.2 : 0;
  } else if (isSelected) {
    opacity = selectedOpacity;
  } else if (isHovered) {
    opacity = selectedOpacity;
  } else {
    opacity = defaultOpacity;
  }

  return { stroke, opacity };
};
