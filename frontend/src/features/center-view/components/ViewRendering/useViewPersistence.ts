import type { ViewType } from "@/features/center-view/CenterView";
import { useEffect, useState } from "react";

export const useViewPersistence = (
  storageKey: string,
  defaultView: ViewType = "radial",
) => {
  const [view, setView] = useState<ViewType>(defaultView);
  const [isViewLoaded, setIsViewLoaded] = useState(false);

  useEffect(() => {
    const savedView = localStorage.getItem(storageKey);
    if (
      savedView === "radial" ||
      savedView === "node-link" ||
      savedView === "data-table"
    ) {
      setView(savedView);
    }
    setIsViewLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (isViewLoaded) {
      localStorage.setItem(storageKey, view);
    }
  }, [view, isViewLoaded, storageKey]);

  return { view, setView, isViewLoaded };
};
