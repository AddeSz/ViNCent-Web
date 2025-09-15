import { useNetworkStore } from "@/hooks/useNetworkStore";

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
