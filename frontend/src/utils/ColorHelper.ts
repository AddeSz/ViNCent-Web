import { useInteractionStore } from "@/stores/useInteractionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

export const handleBrushSelection = (selectedIds: string[]) => {
  if (selectedIds.length === 0) return;
  selectedIds.forEach((id) => {
    useInteractionStore.getState().selectNode(id, true);
  });
};

//orange, teal
// selected: "#FF5A36",
// selectedNeighbor: "#FFB703",
// hovered: "#FF8C69",
// hoveredNeighbor: "#FFD3C7",

//Orange, blue
// selected: "#FF5A36",
// selectedNeighbor: "#FFB703",
// hovered: "#3B82F6",
// hoveredNeighbor: "#93C5FD",

export const highlightColor = {
  selected: "#FF5A36",
  selectedNeighbor: "#FFB703",
  hovered: "#FF5A36",
  hoveredNeighbor: "#FFB703",
  removed: "#B91C1C",
  added: "#16A34A",
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

// Simulates transparency without an alpha channel.
// Returns an opaque color by blending `hex` toward `background` using `alpha`.
// alpha: 1 = `hex`, 0 = `background`.
export const colorBlend = (
  hex: string,
  background: string,
  alpha: number,
): string => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [br, bg, bb] = [1, 3, 5].map((i) =>
    parseInt(background.slice(i, i + 2), 16),
  );

  const mix = (fg: number, bgChan: number) =>
    Math.round(fg * alpha + bgChan * (1 - alpha));

  const toHex = (n: number) => n.toString(16).padStart(2, "0");

  return `#${toHex(mix(r, br))}${toHex(mix(g, bg))}${toHex(mix(b, bb))}`;
};
