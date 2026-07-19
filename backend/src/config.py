from dataclasses import dataclass
from typing import Any, List

from .types import CentralityType, CommunityType


@dataclass(frozen=True, slots=True)
class CentralityInfo:
    name: CentralityType
    category: str
    requirement: str | None = None
    performance: str | None = None
    description: str | None = None


@dataclass(frozen=True, slots=True)
class CommunityInfo:
    name: CommunityType
    category: str
    requirement: str | None = None
    performance: str | None = None
    description: str | None = None


CENTRALITIES_META: List[CentralityInfo] = [
    CentralityInfo(
        name=CentralityType.DEGREE,
        category="node_importance_centralities",
        performance="Fast",
        description="Total number of direct connections a node has",
    ),
    CentralityInfo(
        name=CentralityType.IN_DEGREE,
        category="node_importance_centralities",
        requirement="Directed graphs only",
        performance="Fast",
        description="Number of directed edges pointing into a node",
    ),
    CentralityInfo(
        name=CentralityType.OUT_DEGREE,
        category="node_importance_centralities",
        requirement="Directed graphs only",
        performance="Fast",
        description="Number of directed edges originating from a node",
    ),
    CentralityInfo(
        name=CentralityType.BETWEENNESS,
        category="distance_flow_centralities",
        performance="Slow",
        description="Fraction of all shortest paths between node pairs that pass through this node",
    ),
    CentralityInfo(
        name=CentralityType.CLOSENESS,
        category="distance_flow_centralities",
        performance="Moderate",
        description="Inverse of average shortest path distance to all other nodes",
    ),
    CentralityInfo(
        name=CentralityType.EIGENVECTOR,
        category="node_importance_centralities",
        requirement="Connected graphs only (strongly connected if directed)",
        performance="Fast",
        description="Measures node importance by the importance of its neighbors",
    ),
    CentralityInfo(
        name=CentralityType.PAGERANK,
        category="node_importance_centralities",
        performance="Fast",
        description="Probability of reaching a node through random walks with damping",
    ),
    CentralityInfo(
        name=CentralityType.KATZ,
        category="node_importance_centralities",
        performance="Fast",
        description="Captures influence through all possible paths with exponential decay by distance",
    ),
    CentralityInfo(
        name=CentralityType.HARMONIC,
        category="distance_flow_centralities",
        performance="Moderate",
        description="Sum of inverse distances to all nodes, robust for disconnected graphs",
    ),
    CentralityInfo(
        name=CentralityType.LOAD,
        category="distance_flow_centralities",
        performance="Slow",
        description="Expected communication load on a node assuming shortest-path routing",
    ),
    CentralityInfo(
        name=CentralityType.EDGE_BETWEENNESS,
        category="edge_based_centralities",
        performance="Moderate",
        description="Fraction of shortest paths between all node pairs that traverse this edge",
    ),
    CentralityInfo(
        name=CentralityType.EDGE_LOAD,
        category="edge_based_centralities",
        performance="Slow",
        description="Expected communication traffic volume passing through an edge",
    ),
    CentralityInfo(
        name=CentralityType.CURRENT_FLOW_BETWEENNESS,
        category="network_structure_centralities",
        requirement="Connected undirected graphs only",
        performance="Slow",
        description="Models network as electrical circuit, measures current through node",
    ),
    CentralityInfo(
        name=CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
        category="edge_based_centralities",
        requirement="Connected undirected graphs only",
        performance="Slow",
        description="Electrical current through edge in resistive network model",
    ),
    CentralityInfo(
        name=CentralityType.INFORMATION_CENTRALITY,
        category="distance_flow_centralities",
        requirement="Connected undirected graphs only",
        performance="Moderate",
        description="Measures node importance in information transmission across the network",
    ),
    CentralityInfo(
        name=CentralityType.COMMUNICABILITY_BETWEENNESS,
        category="network_structure_centralities",
        requirement="Connected undirected graphs only",
        performance="Very slow",
        description="Measures node's role in facilitating communication across the entire network",
    ),
    CentralityInfo(
        name=CentralityType.SUBGRAPH,
        category="network_structure_centralities",
        requirement="Undirected graphs only",
        performance="Fast",
        description="Weighted count of closed walks of all lengths passing through the node",
    ),
    # CentralityType.SUBGRAPH_CENTRALITY_EXP: disabled
    CentralityInfo(
        name=CentralityType.LAPLACIAN,
        category="network_structure_centralities",
        performance="Very slow",
        description="Spectral centrality derived from eigenvalues of the graph Laplacian matrix",
    ),
    CentralityInfo(
        name=CentralityType.SECOND_ORDER,
        category="network_structure_centralities",
        requirement="Connected undirected graphs only",
        performance="Very slow",
        description="Considers extended neighborhood structure beyond immediate connections",
    ),
    CentralityInfo(
        name=CentralityType.PERCOLATION,
        category="node_importance_centralities",
        performance="Slow",
        description="Measures how node removal affects network connectivity and fragmentation",
    ),
    CentralityInfo(
        name=CentralityType.VOTERANK,
        category="node_importance_centralities",
        performance="Moderate",
        description="Identifies influential spreaders using iterative voting and suppression",
    ),
    CentralityInfo(
        name=CentralityType.EDGE_DISPERSION,
        category="edge_based_centralities",
        performance="Fast",
        description="Measures how well an edge connects nodes from different network regions",
    ),
    CentralityInfo(
        name=CentralityType.LOCAL_REACHING,
        category="distance_flow_centralities",
        requirement="Directed graphs only",
        performance="Fast",
        description="Proportion of nodes reachable from this node within a limited number of steps",
    ),
    # CentralityType.GLOBAL_REACHING: disabled
    CentralityInfo(
        name=CentralityType.TROPHIC_LEVEL,
        category="hierarchy_based_centralities",
        requirement="Directed acyclic graphs (DAG) only",
        performance="Fast",
        description="Node's vertical position in directed acyclic hierarchical structure",
    ),
    CentralityInfo(
        name=CentralityType.EDGE_TROPHIC_DIFFERENCES,
        category="edge_based_centralities",
        requirement="Directed acyclic graphs (DAG) only",
        performance="Fast",
        description="Difference in hierarchical levels between nodes connected by edge",
    ),
    # CentralityType.TROPHIC_INCOHERENCE: disabled
]


COMMUNITIES_META: List[CommunityInfo] = [
    CommunityInfo(
        name=CommunityType.LOUVAIN,
        category="community_detection",
        performance="Fast",
        description="Fast modularity optimization through hierarchical agglomeration and refinement passes",
    ),
    CommunityInfo(
        name=CommunityType.LEIDEN,
        category="community_detection",
        performance="Fast",
        description="Improved Louvain variant that guarantees well-connected communities and better partitions",
    ),
    CommunityInfo(
        name=CommunityType.GREEDY_MODULARITY,
        category="community_detection",
        performance="Moderate",
        description="Agglomerative hierarchical clustering that greedily maximizes modularity at each step",
    ),
    CommunityInfo(
        name=CommunityType.LABEL_PROPAGATION,
        category="community_detection",
        performance="Fast",
        description="Nodes iteratively adopt the most common community label among their neighbors",
    ),
    CommunityInfo(
        name=CommunityType.ASYN_LPABASE,
        category="community_detection",
        performance="Fast",
        description="Asynchronous label propagation with random node update ordering",
    ),
    CommunityInfo(
        name=CommunityType.GIRVAN_NEWMAN,
        category="community_detection",
        performance="Very slow",
        description="Divisive hierarchical method that iteratively removes edges with highest betweenness",
    ),
    CommunityInfo(
        name=CommunityType.KERNIGHAN_LIN,
        category="community_detection",
        performance="Moderate",
        description="Bisection algorithm that swaps vertices between two groups to minimize cut size",
    ),
    CommunityInfo(
        name=CommunityType.ASYN_FLUIDC,
        category="community_detection",
        requirement="Connected graphs only",
        performance="Fast",
        description="Fluid communities algorithm using density-based propagation to find k communities",
    ),
]

CENTRALITY_CATEGORY_ORDER: List[str] = [
    "node_importance_centralities",
    "distance_flow_centralities",
    "network_structure_centralities",
    "hierarchy_based_centralities",
    "edge_based_centralities",
]

COMMUNITY_CATEGORY_ORDER: List[str] = [
    # "modularity_based",
    # "label_propagation",
    # "hierarchical",
    # "bisection",
    # "fluid_based",
    "community_detection"
]


def _ordered_by_category(items: List[Any], order: List[str]) -> List[Any]:
    used = {item.category for item in items}
    missing = used - set(order)
    assert not missing, f"Categories present in data but missing from display order: {missing}"

    order_index = {cat: i for i, cat in enumerate(order)}
    return sorted(items, key=lambda item: order_index[item.category])

CENTRALITIES: List[CentralityType] = [c.name for c in CENTRALITIES_META]
COMMUNITIES: List[CommunityType] = [c.name for c in COMMUNITIES_META]

CENTRALITIES_META = _ordered_by_category(CENTRALITIES_META, CENTRALITY_CATEGORY_ORDER)
COMMUNITIES_META = _ordered_by_category(COMMUNITIES_META, COMMUNITY_CATEGORY_ORDER)
