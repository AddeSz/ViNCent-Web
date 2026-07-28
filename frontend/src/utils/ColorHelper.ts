import { useInteractionStore } from "@/stores/useInteractionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

export const handleBrushSelection = (selectedIds: string[]) => {
  if (selectedIds.length === 0) return;
  selectedIds.forEach((id) => {
    useInteractionStore.getState().selectNode(id, true);
  });
};

export const highlightBoundsColor = {
  default: "black",
  selected: "orange",
  linkedToSelected: "OrangeRed",
  hovered: "var(--accent-foreground)",
  linkedToHovered: "var(--primary)",
};

export const highlightLabelColor = {
  default: "var(--foreground)",
  selected: "orange",
  linkedToSelected: "OrangeRed",
  hovered: "var(--accent-foreground)",
  linkedToHovered: "var(--primary)",
};

export const highlightLinksColor = {
  default: "#888",
  selected: "orange",
  hovered: "var(--accent-foreground)",
};

export const highlightNodeColor = {
  removed: "#9c0202",
  added: "green",
  default: "#fdcdac",
  selected: "orange",
  linkedToSelected: "OrangeRed",
  hovered: "var(--accent-foreground)",
  linkedToHovered: "var(--primary)",
};

export const getLinkStyle = (
  isRemoved: boolean,
  isSelected: boolean,
  isHovered: boolean,
  defaultOpacity: number,
  selectedOpacity: number,
) => {
  const { displaySettings } = useSettingsStore.getState();
  const { previewChanges } = displaySettings;

  let stroke: string;

  if (isRemoved) {
    stroke = previewChanges ? "red" : highlightLinksColor.default;
  } else if (isSelected) {
    stroke = highlightLinksColor.selected;
  } else if (isHovered) {
    stroke = highlightLinksColor.hovered;
  } else {
    stroke = highlightLinksColor.default;
  }

  let opacity: number;

  if (isRemoved && isSelected) {
    opacity = 0.6;
  } else if (isRemoved && isHovered) {
    opacity = 0.6;
  } else if (isRemoved) {
    opacity = previewChanges ? 0.2 : 0;
  } else if (isSelected) {
    opacity = selectedOpacity;
  } else if (isHovered) {
    opacity = selectedOpacity;
  } else {
    opacity = defaultOpacity;
  }

  return { stroke, opacity };
};
