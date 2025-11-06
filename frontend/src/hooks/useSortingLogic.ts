import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";
import type { SortingState } from "@tanstack/react-table";
import { useMemo } from "react";

function getValueById(obj: any, id: string) {
  if (obj.hasOwnProperty(id)) return obj[id];
  return id.split(".").reduce((acc, key) => acc?.[key], obj);
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

interface SortingOptions {
  defaultDirection?: boolean;
}

export const useSortingLogic = (
  data?: Map<string, FullData>,
  options?: SortingOptions,
) => {
  const setSortKey = useNetworkStore((s) => s.setSortKey);
  const sorting = useNetworkStore((s) => s.sortingState);
  const setSorting = useNetworkStore((s) => s.setSortingState);
  const defaultDirection = options?.defaultDirection ?? true;

  const handleSortingChange = (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const newSorting =
      typeof updater === "function" ? updater(sorting) : updater;
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
        ? (sorting[0]?.desc ?? defaultDirection)
        : defaultDirection;
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

    const current = sorting.find((s) => s.id === key);
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
    () => applySorting(data ?? new Map(), sorting),
    [data, sorting],
  );

  return {
    sorting,
    setSorting,
    handleSortingChange,
    handleSortKeyChange,
    handleContextMenuSort,
    sortedData,
  };
};
