import type { DataChanges, ViewEdge, ViewNode } from "@/types";

export const diffData = (
  prevMap: Map<string, ViewNode | ViewEdge>,
  currMap: Map<string, ViewNode | ViewEdge>,
): DataChanges => {
  const added: DataChanges["added"] = {};
  const removed: DataChanges["removed"] = {};
  const updated: DataChanges["updated"] = {};

  for (const [id, currElement] of currMap.entries()) {
    const prevElement = prevMap.get(id);

    if (!prevElement) {
      added[id] = currElement;
      continue;
    }

    const elementDiff: Record<string, { before: any; after: any }> = {};

    for (const key of Object.keys(currElement.attributes)) {
      const before = prevElement.attributes[key];
      const after = currElement.attributes[key];

      if (before !== after) {
        elementDiff[key] = { before, after };
      }
    }

    if (Object.keys(elementDiff).length > 0) {
      updated[id] = elementDiff;
    }
  }

  for (const [id, prevElement] of prevMap.entries()) {
    if (!currMap.has(id)) {
      removed[id] = prevElement;
    }
  }

  return { added, removed, updated };
};
