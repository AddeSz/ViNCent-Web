import { useFilterStore } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, ViewEdge, ViewFlags, ViewNode } from "@/types";
import {
  buildCategoryIndex,
  computeFilterMask,
} from "@/utils/computeFilterMask";
import { diffData } from "@/utils/diffData";
import { useMemo, useRef, useState } from "react";
import { useKeys } from "./useKeys";

// ---------------------------------------------------------------------------
// This hook is the single source of truth for "what nodes/edges should the
// app currently render, and with what flags." It runs in two stages:
//
//   Stage 1 (filtering): given the graph at the current timestep, apply the
//   chart filters (brush ranges, category selections, disabled bins) and
//   figure out which nodes/edges pass. Produces `flaggedNodeData`/
//   `flaggedEdgeData`, every node/edge in the graph, each carrying flags
//   (removed / pendingRemoval / hidden) describing its filtered state, plus
//   `nodeChanges`/`edgeChanges` describing what changed since last time
//   (for the removal-preview UI).
//
//   Stage 2 (processing): resolve any removals the user has explicitly
//   confirmed, stamp the manual "hidden" flag (from right-click-hide), and
//   compute each node's `neighbors` and `links` sets. Produces the final `nodeData`/
//   `edgeData` maps that every component in the app consumes identically,
//   each component then locally filters by `.flags` for whatever subset it
//   needs to render.
//
// Stage 1 and Stage 2 are kept as separate memos deliberately: toggling
// "hide node" or confirming a removal (Stage 2 concerns) should never force
// Stage 1s filter-matching to rerun, and vice versa.
// ---------------------------------------------------------------------------

const emptyChanges: DataChanges = { added: {}, removed: {}, updated: {} };
const noFlags: ViewFlags = {
  added: false,
  removed: false,
  pendingRemoval: false,
  hidden: false,
};

export const useGraphData = (): {
  nodeData: Map<string, ViewNode>;
  edgeData: Map<string, ViewEdge>;
  nodeChanges: DataChanges;
  edgeChanges: DataChanges;
  confirmRemovals: () => void;
  canConfirm: boolean;
} => {
  const allNodesById = useNetworkStore((s) => s.allNodesById);
  const allEdgesById = useNetworkStore((s) => s.allEdgesById);
  const currentNodes = useNetworkStore((s) => s.currentNodes);
  const currentEdges = useNetworkStore((s) => s.currentEdges);
  const metricsInfo = useNetworkStore((s) => s.metricsInfo);

  const brushRanges = useFilterStore((s) => s.brushRanges);
  const selectedCategories = useFilterStore((s) => s.selectedCategories);
  const binnedDataByKey = useFilterStore((s) => s.binnedDataByKey);
  const disabledValues = useFilterStore((s) => s.disabledValues);
  const hiddenNodes = useFilterStore((s) => s.hiddenNodes);

  const { enabledEdgeKeys, enabledNodeKeys } = useKeys();

  const previewChanges = useSettingsStore(
    (s) => s.displaySettings.previewChanges,
  );
  const showForeshadowing = useSettingsStore(
    (s) => s.displaySettings.showForeshadowing,
  );

  // Reverse indices, rebuilt only when data or enabled keys change, not per filter tick
  const nodeCategoryIndex = useMemo(
    () => buildCategoryIndex(currentNodes, enabledNodeKeys, metricsInfo),
    [currentNodes, enabledNodeKeys, metricsInfo],
  );
  const edgeCategoryIndex = useMemo(
    () => buildCategoryIndex(currentEdges, enabledEdgeKeys, metricsInfo),
    [currentEdges, enabledEdgeKeys, metricsInfo],
  );
  // Id universes, used as the fallback base set for filters like disabledValues
  const allNodeIds = useMemo(
    () => new Set(currentNodes.keys()),
    [currentNodes],
  );
  const allEdgeIds = useMemo(
    () => new Set(currentEdges.keys()),
    [currentEdges],
  );

  // Caches the last passing set and diff, so unrelated re-renders dont wipe the real diff
  const prevPassingNodeDataRef = useRef<Map<string, ViewNode> | null>(null);
  const prevChangesRef = useRef<DataChanges>(emptyChanges);
  const prevPassingEdgeDataRef = useRef<Map<string, ViewEdge> | null>(null);
  const prevEdgeChangesRef = useRef<DataChanges>(emptyChanges);

  // Dataset swap invalidates the cache above entirely
  const prevAllNodesByIdRef = useRef(allNodesById);
  if (allNodesById !== prevAllNodesByIdRef.current) {
    prevAllNodesByIdRef.current = allNodesById;
    prevPassingNodeDataRef.current = null;
    prevChangesRef.current = emptyChanges;
    prevPassingEdgeDataRef.current = null;
    prevEdgeChangesRef.current = emptyChanges;
  }

  const prevAllEdgesByIdRef = useRef(allEdgesById);
  if (allEdgesById !== prevAllEdgesByIdRef.current) {
    prevAllEdgesByIdRef.current = allEdgesById;
    prevPassingNodeDataRef.current = null;
    prevChangesRef.current = emptyChanges;
    prevPassingEdgeDataRef.current = null;
    prevEdgeChangesRef.current = emptyChanges;
  }

  // Stage 1: filtering.
  const { flaggedNodeData, flaggedEdgeData, nodeChanges, edgeChanges } =
    useMemo(() => {
      // null means no active filters, everyone passes
      const nodeMask = computeFilterMask(
        enabledNodeKeys,
        allNodeIds,
        nodeCategoryIndex,
        binnedDataByKey,
        brushRanges,
        disabledValues,
        selectedCategories,
        metricsInfo,
      );

      // attributes references node.attributes directly, no per-key copy needed
      const passingNodeData = new Map<string, ViewNode>();
      currentNodes.forEach((node, id) => {
        if (nodeMask !== null && !nodeMask.has(id)) return;

        passingNodeData.set(id, {
          id: node.id,
          label: node.label,
          attributes: node.attributes,
          flags: { ...noFlags },
          neighbors: new Set(),
          links: new Set(),
        });
      });

      const edgeMask = computeFilterMask(
        enabledEdgeKeys,
        allEdgeIds,
        edgeCategoryIndex,
        binnedDataByKey,
        brushRanges,
        disabledValues,
        selectedCategories,
        metricsInfo,
      );

      // An edge only passes if both endpoints passed to
      const passingEdgeData = new Map<string, ViewEdge>();
      currentEdges.forEach((edge, edgeId) => {
        if (
          !passingNodeData.has(edge.source) ||
          !passingNodeData.has(edge.target)
        ) {
          return;
        }
        if (edgeMask !== null && !edgeMask.has(edgeId)) return;

        passingEdgeData.set(edgeId, {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          weight: edge.weight,
          attributes: edge.attributes,
          flags: { ...noFlags },
        });
      });

      // Scoped to enabledNodeKeys so disabled attributes dont spuriously register as updates
      const prevPassingNodeData = prevPassingNodeDataRef.current || new Map();
      const nodeChanges = diffData(
        prevPassingNodeData,
        passingNodeData,
        enabledNodeKeys,
      );

      const hasChanges =
        Object.keys(nodeChanges.added || {}).length > 0 ||
        Object.keys(nodeChanges.removed || {}).length > 0 ||
        Object.keys(nodeChanges.updated || {}).length > 0;

      // Only advance the cache if something actually changed this pass
      if (hasChanges) {
        prevPassingNodeDataRef.current = new Map(passingNodeData);
        prevChangesRef.current = nodeChanges;
      }

      const activeNodeChanges = hasChanges
        ? nodeChanges
        : prevChangesRef.current || emptyChanges;

      // Same caching for edges, independent of the node cache
      const prevPassingEdgeData = prevPassingEdgeDataRef.current || new Map();
      const edgeChanges = diffData(
        prevPassingEdgeData,
        passingEdgeData,
        enabledEdgeKeys,
      );

      const hasEdgeChanges =
        Object.keys(edgeChanges.added || {}).length > 0 ||
        Object.keys(edgeChanges.removed || {}).length > 0 ||
        Object.keys(edgeChanges.updated || {}).length > 0;

      if (hasEdgeChanges) {
        prevPassingEdgeDataRef.current = new Map(passingEdgeData);
        prevEdgeChangesRef.current = edgeChanges;
      }

      const activeEdgeChanges = hasEdgeChanges
        ? edgeChanges
        : prevEdgeChangesRef.current || emptyChanges;

      // Every node gets an entry here, not just the ones passing filters
      const removedNodeSet = new Set(
        Object.keys(activeNodeChanges.removed ?? {}),
      );
      const addedNodeSet = new Set(Object.keys(activeNodeChanges.added ?? {}));

      // Controls whether a gone at this timestep node still shows structurally or only via the removal preview
      // When foreshadowing is enabled, use the full graph as the structural source instead of only the current timestep
      const baseNodeSource = showForeshadowing ? allNodesById : currentNodes;
      const flaggedNodeData = new Map<string, ViewNode>();

      for (const id of allNodesById.keys()) {
        if (passingNodeData.has(id)) {
          const node = passingNodeData.get(id)!;
          flaggedNodeData.set(id, {
            ...node,
            flags: { ...node.flags, added: addedNodeSet.has(id) },
          });
        } else if (baseNodeSource.has(id)) {
          const baseNode = baseNodeSource.get(id)!;

          if (previewChanges && removedNodeSet.has(id)) {
            // Just filtered out this tick, show pendingRemoval preview
            const removedNode = activeNodeChanges.removed[id] as ViewNode;
            flaggedNodeData.set(id, {
              ...removedNode,
              flags: {
                added: false,
                removed: false,
                pendingRemoval: true,
                hidden: false,
              },
            });
          } else {
            // Already filtered out, mark fully removed
            flaggedNodeData.set(id, {
              id,
              label: baseNode.label,
              attributes: {},
              flags: {
                added: false,
                removed: true,
                pendingRemoval: false,
                hidden: false,
              },
              neighbors: new Set(),
              links: new Set(),
            });
          }
        } else if (previewChanges && removedNodeSet.has(id)) {
          // Not in baseNodeSource at all, but removed this tick, still preview it
          const removedNode = activeNodeChanges.removed[id] as ViewNode;
          flaggedNodeData.set(id, {
            ...removedNode,
            flags: {
              added: false,
              removed: false,
              pendingRemoval: true,
              hidden: false,
            },
          });
        }
      }

      // Same logic as above, for edges
      const removedEdgeSet = new Set(
        Object.keys(activeEdgeChanges.removed ?? {}),
      );
      const addedEdgeSet = new Set(Object.keys(activeEdgeChanges.added ?? {}));

      const flaggedEdgeData = new Map<string, ViewEdge>();

      for (const edgeId of currentEdges.keys()) {
        if (passingEdgeData.has(edgeId)) {
          const edge = passingEdgeData.get(edgeId)!;
          flaggedEdgeData.set(edgeId, {
            ...edge,
            flags: { ...edge.flags, added: addedEdgeSet.has(edgeId) },
          });
        } else {
          if (previewChanges && removedEdgeSet.has(edgeId)) {
            const removedEdge = activeEdgeChanges.removed[edgeId] as ViewEdge;
            flaggedEdgeData.set(edgeId, {
              ...removedEdge,
              flags: {
                added: false,
                removed: false,
                pendingRemoval: true,
                hidden: false,
              },
            });
          } else {
            const baseEdge = currentEdges.get(edgeId)!;
            flaggedEdgeData.set(edgeId, {
              id: edgeId,
              source: baseEdge.source,
              target: baseEdge.target,
              weight: baseEdge.weight,
              attributes: {},
              flags: {
                added: false,
                removed: true,
                pendingRemoval: false,
                hidden: false,
              },
            });
          }
        }
      }

      // Catches edges structurally gone from currentEdges that the loop above missed
      if (previewChanges) {
        for (const edgeId of removedEdgeSet) {
          if (!flaggedEdgeData.has(edgeId)) {
            const removedEdge = activeEdgeChanges.removed[edgeId] as ViewEdge;
            flaggedEdgeData.set(edgeId, {
              ...removedEdge,
              flags: {
                added: false,
                removed: false,
                pendingRemoval: true,
                hidden: false,
              },
            });
          }
        }
      }

      return {
        flaggedNodeData,
        flaggedEdgeData,
        nodeChanges: activeNodeChanges,
        edgeChanges: activeEdgeChanges,
      };
    }, [
      allNodesById,
      allEdgesById,
      currentNodes,
      currentEdges,
      enabledNodeKeys,
      enabledEdgeKeys,
      brushRanges,
      disabledValues,
      binnedDataByKey,
      selectedCategories,
      previewChanges,
      showForeshadowing,
      metricsInfo,
      nodeCategoryIndex,
      edgeCategoryIndex,
      allNodeIds,
      allEdgeIds,
    ]);

  // Stage 2: processing.

  // Tracks which pending removals the user has explicitly confirmed
  const [acceptedRemovals, setAcceptedRemovals] = useState<Set<string>>(
    new Set(),
  );
  const [acceptedEdgeRemovals, setAcceptedEdgeRemovals] = useState<Set<string>>(
    new Set(),
  );

  // Clears stale acceptances when the underlying diff changes
  const lastChangesRef = useRef(nodeChanges);
  const lastEdgeChangesRef = useRef(edgeChanges);

  if (nodeChanges !== lastChangesRef.current) {
    lastChangesRef.current = nodeChanges;
    if (acceptedRemovals.size > 0) setAcceptedRemovals(new Set());
  }

  if (edgeChanges !== lastEdgeChangesRef.current) {
    lastEdgeChangesRef.current = edgeChanges;
    if (acceptedEdgeRemovals.size > 0) setAcceptedEdgeRemovals(new Set());
  }

  const { nodeData, edgeData } = useMemo(() => {
    // Resolves confirmed removals and stamps the hidden flag in one pass
    const nodeData = new Map<string, ViewNode>();
    const activeNodeIds = new Set<string>();

    for (const [id, node] of flaggedNodeData) {
      const isAccepted =
        node.flags.pendingRemoval && acceptedRemovals.has(node.id);
      const hidden = hiddenNodes.has(id);

      const processedNode: ViewNode = isAccepted
        ? {
            id: node.id,
            label: node.label,
            attributes: node.attributes,
            flags: {
              added: false,
              removed: true,
              pendingRemoval: false,
              hidden,
            },
            neighbors: new Set(),
            links: new Set(),
          }
        : {
            ...node,
            flags: { ...node.flags, hidden },
            neighbors: new Set(),
            links: new Set(),
          };

      nodeData.set(id, processedNode);

      if (!processedNode.flags.removed) {
        activeNodeIds.add(processedNode.id);
      }
    }

    // Same as above for edges, plus: an edge whose endpoint is gone must itself be removed
    const edgeData = new Map<string, ViewEdge>();

    for (const [edgeId, edge] of flaggedEdgeData) {
      const isAcceptedEdge =
        edge.flags.pendingRemoval && acceptedEdgeRemovals.has(edgeId);
      const shouldRemove =
        !activeNodeIds.has(edge.source) || !activeNodeIds.has(edge.target);
      const hidden =
        hiddenNodes.has(edge.source) || hiddenNodes.has(edge.target);

      const processedEdge: ViewEdge = isAcceptedEdge
        ? {
            ...edge,
            flags: {
              added: false,
              removed: true,
              pendingRemoval: false,
              hidden,
            },
          }
        : shouldRemove || edge.flags.removed
          ? {
              ...edge,
              flags: {
                added: false,
                pendingRemoval: shouldRemove && !edge.flags.removed,
                removed: edge.flags.removed || shouldRemove,
                hidden,
              },
            }
          : { ...edge, flags: { ...edge.flags, hidden } };

      edgeData.set(edgeId, processedEdge);

      if (!processedEdge.flags.removed && !processedEdge.flags.hidden) {
        const sourceNode = nodeData.get(edge.source);
        const targetNode = nodeData.get(edge.target);
        if (sourceNode && targetNode) {
          sourceNode.neighbors.add(edge.target);
          targetNode.neighbors.add(edge.source);
          sourceNode.links.add(edgeId);
          targetNode.links.add(edgeId);
        }
      }
    }

    return { nodeData, edgeData };
  }, [
    flaggedNodeData,
    flaggedEdgeData,
    acceptedRemovals,
    acceptedEdgeRemovals,
    hiddenNodes,
  ]);

  // Moves pending removals into the accepted set on user confirmation
  const confirmRemovals = () => {
    const removedIds = Object.keys(nodeChanges?.removed ?? {});
    const removedEdgeIds = Object.keys(edgeChanges?.removed ?? {});

    if (removedIds.length > 0) {
      setAcceptedRemovals((prev) => new Set([...prev, ...removedIds]));
    }
    if (removedEdgeIds.length > 0) {
      setAcceptedEdgeRemovals((prev) => new Set([...prev, ...removedEdgeIds]));
    }
  };

  // True only if a removal is still pending and preview mode is on
  const removedIds = Object.keys(nodeChanges?.removed ?? {});
  const removedEdgeIds = Object.keys(edgeChanges?.removed ?? {});

  const unacceptedRemovals = removedIds.filter(
    (id) => !acceptedRemovals.has(id),
  );
  const unacceptedEdgeRemovals = removedEdgeIds.filter(
    (id) => !acceptedEdgeRemovals.has(id),
  );

  const canConfirm =
    (unacceptedRemovals.length > 0 || unacceptedEdgeRemovals.length > 0) &&
    previewChanges;

  return {
    nodeData,
    edgeData,
    nodeChanges,
    edgeChanges,
    confirmRemovals,
    canConfirm,
  };
};
