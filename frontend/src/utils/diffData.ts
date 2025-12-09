import type { DataChanges, FullData } from "@/types/network";

export const diffData = (
  prevMap: Map<string, FullData>,
  currMap: Map<string, FullData>,
): DataChanges => {
  const added: Record<string, FullData> = {};
  const removed: Record<string, FullData> = {};
  const updated: Record<
    string,
    Record<string, { before: FullData; after: FullData }>
  > = {};

  for (const [id, currNode] of currMap.entries()) {
    const prevNode = prevMap.get(id);

    if (!prevNode) {
      added[id] = currNode;
      continue;
    }

    const nodeDiff: Record<string, { before: FullData; after: FullData }> = {};
    for (const key of Object.keys(currNode)) {
      if (key === "removed" || key === "stable" || key === "fx" || key === "fy")
        continue;

      const before = prevNode[key];
      const after = currNode[key];

      if (before !== after) {
        nodeDiff[key] = { before, after };
      }
    }

    if (Object.keys(nodeDiff).length > 0) {
      updated[id] = nodeDiff;
    }
  }

  for (const [id, prevNode] of prevMap.entries()) {
    if (!currMap.has(id)) {
      removed[id] = prevNode;
    }
  }

  return { added, removed, updated };
};
