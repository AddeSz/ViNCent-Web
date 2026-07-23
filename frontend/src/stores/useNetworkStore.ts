import type {
  AttributeInfo,
  CentralityData,
  Edge,
  Network,
  Node,
  TimestepDelta,
} from "@/types";
import { create } from "zustand";

interface LoadDatasetParams {
  network: Network;
  graphType: string;
  baseState: Network;
  deltas: Record<number, TimestepDelta>;
  centralities: Record<number, CentralityData>;
  allMetricsInfo: Record<string, AttributeInfo>;
  communities: Record<number, Record<string, Record<string, number>>>;
  timesteps: number[];
}

interface NetworkStore {
  fullNetwork: Network;
  allNodesById: Map<string, Node>;
  allEdgesById: Map<string, Edge>;
  baseState: Network | null;
  deltas: Map<number, TimestepDelta>;
  centralities: Map<number, CentralityData>;
  communities: Map<number, Record<string, Record<string, number>>>;
  metricsInfo: Map<string, AttributeInfo>;
  timesteps: number[];
  directed: boolean | null;
  currentDataset: string | null;

  currentTimestep: number;
  currentNodes: Map<string, Node>;
  currentEdges: Map<string, Edge>;
  currentCommunities: Record<string, Record<string, number>> | null;

  loadDataset: (params: LoadDatasetParams) => void;
  setTimestep: (timestep: number) => void;
  setCurrentDataset: (dataset: string) => void;

  isNetworkEmpty: () => boolean;
  clearData: () => void;
}

function applyDelta(
  currentNodes: Map<string, Node>,
  currentEdges: Map<string, Edge>,
  delta: TimestepDelta,
) {
  delta.nodes_added.forEach((node) => {
    currentNodes.set(node.id, { ...node });
  });

  delta.nodes_removed.forEach((nodeId) => {
    currentNodes.delete(nodeId);
  });

  Object.entries(delta.nodes_attr_changed).forEach(([nodeId, attrChanges]) => {
    const node = currentNodes.get(nodeId);
    if (node) {
      node.attributes = { ...node.attributes, ...attrChanges };
      if ("label" in attrChanges) {
        node.label = attrChanges._label as string;
      }
    }
  });

  delta.edges_added.forEach((edge) => {
    currentEdges.set(edge.id, { ...edge });
  });

  delta.edges_removed.forEach((edgeId) => {
    currentEdges.delete(edgeId);
  });

  Object.entries(delta.edges_attr_changed).forEach(([edgeId, attrChanges]) => {
    const edge = currentEdges.get(edgeId);
    if (edge) {
      edge.attributes = { ...edge.attributes, ...attrChanges };
    }
  });
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  fullNetwork: { nodes: [], edges: [] },
  allNodesById: new Map(),
  allEdgesById: new Map(),
  baseState: null,
  deltas: new Map(),
  centralities: new Map(),
  communities: new Map(),
  metricsInfo: new Map(),
  timesteps: [],
  directed: null,
  currentDataset: null,

  currentTimestep: 0,
  currentNodes: new Map(),
  currentEdges: new Map(),
  currentCommunities: null,

  loadDataset: ({
    network,
    graphType,
    baseState,
    deltas,
    centralities,
    allMetricsInfo,
    communities,
    timesteps,
  }) => {
    const allNodesById = new Map<string, Node>(
      network.nodes.map((n) => [n.id, n]),
    );
    const allEdgesById = new Map<string, Edge>(
      network.edges.map((e) => [e.id, e]),
    );
    const directed = graphType !== "undirected";

    const deltasMap = new Map(
      Object.entries(deltas).map(([k, v]) => [Number(k), v]),
    );
    const centralitiesMap = new Map(
      Object.entries(centralities).map(([k, v]) => [Number(k), v]),
    );
    const communitiesMap = new Map(
      Object.entries(communities).map(([k, v]) => [Number(k), v]),
    );
    const metricsInfoMap = new Map<string, AttributeInfo>(
      Object.entries(allMetricsInfo).map(([key, info]) => [
        key,
        { ...info, values: new Set(info.values) },
      ]),
    );

    set({
      fullNetwork: network,
      allNodesById,
      allEdgesById,
      directed,
      baseState,
      deltas: deltasMap,
      centralities: centralitiesMap,
      communities: communitiesMap,
      metricsInfo: metricsInfoMap,
      timesteps,
    });

    if (timesteps.length > 0) {
      get().setTimestep(Math.min(...timesteps));
    }
  },

  setTimestep: (timestep) => {
    const { baseState, deltas, centralities, communities, metricsInfo } = get();

    if (!baseState) {
      set({ currentTimestep: timestep });
      return;
    }

    const currentNodes = new Map(
      baseState.nodes.map((node) => [node.id, { ...node }]),
    );
    const currentEdges = new Map(
      baseState.edges.map((edge) => [edge.id, { ...edge }]),
    );

    const sortedTimesteps = Array.from(deltas.keys())
      .sort((a, b) => a - b)
      .filter((t) => t <= timestep);

    for (const t of sortedTimesteps) {
      const delta = deltas.get(t)!;
      applyDelta(currentNodes, currentEdges, delta);
    }

    const allCentralityKeys = Array.from(metricsInfo.values())
      .filter((info) => info.isCentrality)
      .map((info) => info.key);

    currentNodes.forEach((node) => {
      if (node.attributes) {
        allCentralityKeys.forEach((key) => delete node.attributes![key]);
      }
    });
    currentEdges.forEach((edge) => {
      if (edge.attributes) {
        allCentralityKeys.forEach((key) => delete edge.attributes![key]);
      }
    });

    const currentCentralities = centralities.get(timestep);
    if (currentCentralities) {
      Object.entries(currentCentralities.nodes).forEach(([nodeId, cents]) => {
        const node = currentNodes.get(nodeId);
        if (node) {
          if (!node.attributes) node.attributes = {};
          Object.entries(cents).forEach(([key, value]) => {
            node.attributes![key] = value;
          });
        }
      });

      Object.entries(currentCentralities.edges).forEach(([edgeId, cents]) => {
        const edge = currentEdges.get(edgeId);
        if (edge) {
          if (!edge.attributes) edge.attributes = {};
          Object.entries(cents).forEach(([key, value]) => {
            edge.attributes![key] = value;
          });
        }
      });
    }

    const currentCommunities = communities.get(timestep) || null;
    if (currentCommunities) {
      Object.entries(currentCommunities).forEach(
        ([communityKey, nodeAssignments]) => {
          Object.entries(nodeAssignments).forEach(([nodeId, value]) => {
            const node = currentNodes.get(nodeId);
            if (node) {
              if (!node.attributes) node.attributes = {};
              node.attributes[communityKey] = value;
            }
          });
        },
      );
    }

    set({
      currentTimestep: timestep,
      currentNodes,
      currentEdges,
      currentCommunities,
    });
  },

  setCurrentDataset: (dataset) => set({ currentDataset: dataset }),

  isNetworkEmpty: () => {
    const { fullNetwork } = get();
    return fullNetwork.nodes.length === 0 && fullNetwork.edges.length === 0;
  },

  clearData: () =>
    set({
      fullNetwork: { nodes: [], edges: [] },
      allNodesById: new Map<string, Node>(),
      allEdgesById: new Map<string, Edge>(),
      baseState: null,
      deltas: new Map(),
      centralities: new Map(),
      communities: new Map(),
      metricsInfo: new Map(),
      timesteps: [],
      directed: null,
      currentDataset: null,
      currentTimestep: 0,
      currentNodes: new Map(),
      currentEdges: new Map(),
      currentCommunities: null,
    }),
}));
