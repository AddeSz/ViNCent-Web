import { useDataStore } from "@/hooks/useDataStore";

export const handleHighlight = (id: string, multi: boolean) => {
  if (multi) {
    useDataStore.getState().toggleNodeSelection(id);
  } else {
    useDataStore.getState().selectNode(id, false);
  }
};

export const highlightBoundsColor = {
  default: "black",
  selected: "orange",
};

export const highlightLinksColor = {
  default: "black",
  selected: "orange",
};
