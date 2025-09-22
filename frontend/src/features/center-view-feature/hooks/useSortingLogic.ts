import { useNetworkStore } from "@/hooks/useNetworkStore";
import type { SortingState } from "@tanstack/react-table";
import { useState } from "react";

export const useSortingLogic = () => {
  const sortKey = useNetworkStore((s) => s.sortKey);
  const setSortKey = useNetworkStore((s) => s.setSortKey);

  const [sorting, setSorting] = useState<SortingState>(
    sortKey !== "none" ? [{ id: sortKey, desc: false }] : [],
  );

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

  const handleContextMenuSort = (val: string) => {
    if (val === "none") {
      setSorting([]);
      setSortKey("none");
      return;
    }

    const current = sorting.find((s) => s.id === val);

    if (!current) {
      setSorting([{ id: val, desc: true }]);
      setSortKey(val);
    } else if (current.desc) {
      setSorting([{ id: val, desc: false }]);
      setSortKey(val);
    } else {
      setSorting([]);
      setSortKey("none");
    }
  };

  return {
    sorting,
    setSorting,
    handleSortingChange,
    handleContextMenuSort,
  };
};
