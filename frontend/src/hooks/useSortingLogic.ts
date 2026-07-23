import { useInteractionStore } from "@/stores/useInteractionStore";
import type { ViewNode } from "@/types";
import type { SortingState } from "@tanstack/react-table";
import { useMemo } from "react";

function getValueById(obj: any, id: string) {
  if (id === "label") return obj.label ?? obj.id;
  if (obj.attributes && id in obj.attributes) return obj.attributes[id];
  return id.split(".").reduce((acc, key) => acc?.[key], obj.attributes ?? obj);
}

function applySorting<T extends object>(
  data: Map<string, T>,
  sorting: SortingState,
): T[] {
  const values = Array.from(data.values());
  if (!sorting.length) return values;

  const sortEntries = [...sorting].reverse();

  return values.sort((a, b) => {
    for (const { id, desc } of sortEntries) {
      const va = getValueById(a, id);
      const vb = getValueById(b, id);
      const aUndef = va === undefined || va === null;
      const bUndef = vb === undefined || vb === null;

      if (aUndef && bUndef) continue;
      if (aUndef) return 1;
      if (bUndef) return -1;
      if (va === vb) continue;

      if (typeof va === "number" && typeof vb === "number") {
        return desc ? vb - va : va - vb;
      }

      if (va instanceof Date && vb instanceof Date) {
        return desc ? vb.getTime() - va.getTime() : va.getTime() - vb.getTime();
      }

      return desc
        ? String(vb).localeCompare(String(va))
        : String(va).localeCompare(String(vb));
    }
    return 0;
  });
}

export const useSortingLogic = (data?: Map<string, ViewNode>) => {
  const setSortKey = useInteractionStore((s) => s.setSortKey);
  const sortingState = useInteractionStore((s) => s.sortingState);
  const setSorting = useInteractionStore((s) => s.setSortingState);

  const handleSortingChange = (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const newSorting =
      typeof updater === "function" ? updater(sortingState) : updater;
    if (newSorting.length === 0) {
      setSorting([]);
      setSortKey("none");
    } else {
      const { id, desc } = newSorting[0];
      setSorting([{ id, desc }]);
      setSortKey(id);
    }
  };

  const handleSortKeyChange = (key: string, preserveDirection = true) => {
    if (key === "none") {
      setSorting([]);
      setSortKey("none");
    } else {
      const direction = preserveDirection
        ? (sortingState[0]?.desc ?? true)
        : true;
      setSorting([{ id: key, desc: direction }]);
      setSortKey(key);
    }
  };

  const handleContextMenuSort = (key: string) => {
    if (key === "none") {
      setSorting([]);
      setSortKey("none");
      return;
    }

    const current = sortingState.find((s) => s.id === key);
    if (!current) {
      setSorting([{ id: key, desc: true }]);
      setSortKey(key);
    } else if (current.desc) {
      setSorting([{ id: key, desc: false }]);
      setSortKey(key);
    } else {
      setSorting([]);
      setSortKey("none");
    }
  };

  const sortedData = useMemo(
    () => applySorting(data ?? new Map<string, ViewNode>(), sortingState),
    [data, sortingState],
  );

  return {
    sortingState,
    setSorting,
    handleSortingChange,
    handleSortKeyChange,
    handleContextMenuSort,
    sortedData,
  };
};
