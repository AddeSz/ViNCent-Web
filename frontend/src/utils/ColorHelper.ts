import { useNetworkStore } from "@/stores/useNetworkStore";

export const handleHighlight = (id: string, multi: boolean) => {
  if (multi) {
    useNetworkStore.getState().toggleNodeSelection(id);
  } else {
    useNetworkStore.getState().selectNode(id, false);
  }
};

export const highlightBoundsColor = {
  default: "black",
  selected: "orange",
};

export const highlightLinksColor = {
  default: "#999",
  selected: "orange",
};

export const highlightLabelColor = {
  default: "var(--foreground)",
  selected: "orange",
};

export const getLinkStyle = (
  isRemoved: boolean,
  isSelected: boolean,
  defaultValue: number,
  selectedValue: number,
) => {
  const stroke = isRemoved
    ? "red"
    : isSelected
      ? highlightLinksColor.selected
      : highlightLinksColor.default;

  const opacity =
    isRemoved && isSelected
      ? 0.6
      : isRemoved
        ? 0.2
        : isSelected
          ? selectedValue
          : defaultValue;

  return { stroke, opacity };
};
