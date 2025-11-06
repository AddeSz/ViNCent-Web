import type { DataChanges, FullData } from "@/types/network";

const normalizeEdgeId = (id: string) => {
  const parts = id.split("|");
  return parts.length === 2 ? parts.sort().join("|") : id;
};

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

  const normalizedPrev = new Map<string, FullData>();
  const normalizedCurr = new Map<string, FullData>();

  for (const [id, val] of prevMap.entries()) {
    normalizedPrev.set(normalizeEdgeId(id), val);
  }
  for (const [id, val] of currMap.entries()) {
    normalizedCurr.set(normalizeEdgeId(id), val);
  }

  for (const [id, currNode] of normalizedCurr.entries()) {
    const prevNode = normalizedPrev.get(id);

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

  for (const [id, prevNode] of normalizedPrev.entries()) {
    if (!normalizedCurr.has(id)) {
      removed[id] = prevNode;
    }
  }

  return { added, removed, updated };
};
