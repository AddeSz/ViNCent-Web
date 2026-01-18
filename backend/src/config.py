from .types import CentralityType, CommunityType

ALL_CENTRALITIES = [
    CentralityType.DEGREE,
    CentralityType.IN_DEGREE,
    CentralityType.OUT_DEGREE,
    CentralityType.BETWEENNESS,
    CentralityType.CLOSENESS,
    CentralityType.EIGENVECTOR,
    CentralityType.PAGERANK,
    CentralityType.KATZ,
    CentralityType.HARMONIC,

    CentralityType.LOAD,
    CentralityType.EDGE_BETWEENNESS,
    CentralityType.EDGE_LOAD,
    CentralityType.CURRENT_FLOW_BETWEENNESS,
    CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
    CentralityType.INFORMATION_CENTRALITY,
    CentralityType.COMMUNICABILITY_BETWEENNESS,

    CentralityType.SUBGRAPH,
    # CentralityType.SUBGRAPH_CENTRALITY_EXP,
    CentralityType.LAPLACIAN,
    CentralityType.SECOND_ORDER,

    CentralityType.PERCOLATION,

    CentralityType.VOTERANK,
    CentralityType.EDGE_DISPERSION,

    CentralityType.LOCAL_REACHING,
    # CentralityType.GLOBAL_REACHING,

    CentralityType.TROPHIC_LEVEL,
    CentralityType.EDGE_TROPHIC_DIFFERENCES,
    # CentralityType.TROPHIC_INCOHERENCE,
]


CENTRALITY_CATEGORIES = {
    "node_importance_centralites": [
        CentralityType.DEGREE,
        CentralityType.IN_DEGREE,
        CentralityType.OUT_DEGREE,
        CentralityType.EIGENVECTOR,
        CentralityType.KATZ,
        CentralityType.PAGERANK,
        CentralityType.PERCOLATION,
        CentralityType.VOTERANK,
    ],
    "distance_flow_centralites": [
        CentralityType.CLOSENESS,
        CentralityType.HARMONIC,
        CentralityType.BETWEENNESS,
        CentralityType.LOAD,
        CentralityType.INFORMATION_CENTRALITY,
        CentralityType.LOCAL_REACHING,
        # CentralityType.GLOBAL_REACHING,
    ],
    "network_structure_centralites": [
        CentralityType.SUBGRAPH,
        # CentralityType.SUBGRAPH_CENTRALITY_EXP,
        CentralityType.COMMUNICABILITY_BETWEENNESS,
        CentralityType.CURRENT_FLOW_BETWEENNESS,
        CentralityType.LAPLACIAN,
        CentralityType.SECOND_ORDER,
    ],
        "hierarchy_based_centralites": [
        CentralityType.TROPHIC_LEVEL,
        # CentralityType.TROPHIC_INCOHERENCE,
    ],
    "edge_based_centralites": [
        CentralityType.EDGE_BETWEENNESS,
        CentralityType.EDGE_LOAD,
        CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
        CentralityType.EDGE_DISPERSION,
        CentralityType.EDGE_TROPHIC_DIFFERENCES,
    ],
}

CENTRALITY_REQUIREMENTS = {
    CentralityType.IN_DEGREE: "Directed graphs only",
    CentralityType.OUT_DEGREE: "Directed graphs only",
    CentralityType.LOCAL_REACHING: "Directed graphs only",
    
    CentralityType.SUBGRAPH: "Undirected graphs only",
    CentralityType.SECOND_ORDER: "Connected undirected graphs only",
    CentralityType.INFORMATION_CENTRALITY: "Connected undirected graphs only",
    CentralityType.CURRENT_FLOW_BETWEENNESS: "Connected undirected graphs only",
    CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS: "Connected undirected graphs only",
    CentralityType.COMMUNICABILITY_BETWEENNESS: "Connected undirected graphs only",
    
    CentralityType.TROPHIC_LEVEL: "Directed acyclic graphs (DAG) only",
    CentralityType.EDGE_TROPHIC_DIFFERENCES: "Directed acyclic graphs (DAG) only",
    
    CentralityType.EIGENVECTOR: "Connected graphs only (strongly connected if directed)",
}
    # CentralityType.GLOBAL_REACHING: "Directed graphs only",
    # CentralityType.SUBGRAPH_CENTRALITY_EXP: "Undirected graphs only",
    # CentralityType.TROPHIC_INCOHERENCE: "Directed acyclic graphs (DAG) only",

CENTRALITY_PERFORMANCE = {
    CentralityType.LAPLACIAN: "Very slow",
    CentralityType.SECOND_ORDER: "Very slow",
    CentralityType.COMMUNICABILITY_BETWEENNESS: "Very slow",
    

    CentralityType.CURRENT_FLOW_BETWEENNESS: "Slow",
    CentralityType.PERCOLATION: "Slow", 
    CentralityType.BETWEENNESS: "Slow", 
    CentralityType.EDGE_LOAD: "Slow", 
    CentralityType.LOAD: "Slow",
    CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS: "Slow",
    
    CentralityType.EDGE_BETWEENNESS: "Moderate",
    CentralityType.INFORMATION_CENTRALITY: "Moderate",
    CentralityType.VOTERANK: "Moderate",
    CentralityType.HARMONIC: "Moderate",
    CentralityType.CLOSENESS: "Moderate",
    
    CentralityType.SUBGRAPH: "Fast",
    CentralityType.KATZ: "Fast",
    CentralityType.EIGENVECTOR: "Fast",
    CentralityType.PAGERANK: "Fast",
    CentralityType.EDGE_DISPERSION: "Fast",
    CentralityType.DEGREE: "Fast",
    CentralityType.IN_DEGREE: "Fast",
    CentralityType.OUT_DEGREE: "Fast",
    CentralityType.LOCAL_REACHING: "Fast",
    CentralityType.TROPHIC_LEVEL: "Fast",
    CentralityType.EDGE_TROPHIC_DIFFERENCES: "Fast",
}
    # CentralityType.SUBGRAPH_CENTRALITY_EXP: "Fast",
    # CentralityType.TROPHIC_INCOHERENCE: "Fast",
    # CentralityType.GLOBAL_REACHING: "Fast",
  
CENTRALITY_DESCRIPTIONS = {
    CentralityType.DEGREE: "Total number of direct connections a node has",
    CentralityType.IN_DEGREE: "Number of directed edges pointing into a node",
    CentralityType.OUT_DEGREE: "Number of directed edges originating from a node",
    CentralityType.EIGENVECTOR: "Measures node importance by the importance of its neighbors",
    CentralityType.KATZ: "Captures influence through all possible paths with exponential decay by distance",
    CentralityType.PAGERANK: "Probability of reaching a node through random walks with damping",
    CentralityType.PERCOLATION: "Measures how node removal affects network connectivity and fragmentation",
    CentralityType.VOTERANK: "Identifies influential spreaders using iterative voting and suppression",
    
    CentralityType.CLOSENESS: "Inverse of average shortest path distance to all other nodes",
    CentralityType.HARMONIC: "Sum of inverse distances to all nodes, robust for disconnected graphs",
    CentralityType.BETWEENNESS: "Fraction of all shortest paths between node pairs that pass through this node",
    CentralityType.LOAD: "Expected communication load on a node assuming shortest-path routing",
    CentralityType.INFORMATION_CENTRALITY: "Measures node importance in information transmission across the network",
    CentralityType.LOCAL_REACHING: "Proportion of nodes reachable from this node within a limited number of steps",
    
    CentralityType.SUBGRAPH: "Weighted count of closed walks of all lengths passing through the node",
    CentralityType.COMMUNICABILITY_BETWEENNESS: "Measures node's role in facilitating communication across the entire network",
    CentralityType.CURRENT_FLOW_BETWEENNESS: "Models network as electrical circuit, measures current through node",
    CentralityType.LAPLACIAN: "Spectral centrality derived from eigenvalues of the graph Laplacian matrix",
    CentralityType.SECOND_ORDER: "Considers extended neighborhood structure beyond immediate connections",
    
    CentralityType.EDGE_BETWEENNESS: "Fraction of shortest paths between all node pairs that traverse this edge",
    CentralityType.EDGE_LOAD: "Expected communication traffic volume passing through an edge",
    CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS: "Electrical current through edge in resistive network model",
    CentralityType.EDGE_DISPERSION: "Measures how well an edge connects nodes from different network regions",
    CentralityType.EDGE_TROPHIC_DIFFERENCES: "Difference in hierarchical levels between nodes connected by edge",
    
    CentralityType.TROPHIC_LEVEL: "Node's vertical position in directed acyclic hierarchical structure",
    # CentralityType.TROPHIC_INCOHERENCE: "Measure of hierarchy disorder",
    # CentralityType.GLOBAL_REACHING: "Global reachability measure for directed graphs",
    # CentralityType.SUBGRAPH_CENTRALITY_EXP: "Subgraph centrality using matrix exponential",
}  
    
ALL_COMMUNITY_ALGORITHMS = [
    CommunityType.LOUVAIN,
    CommunityType.LEIDEN,
    CommunityType.GREEDY_MODULARITY,
    CommunityType.LABEL_PROPAGATION,
    CommunityType.ASYN_LPABASE,
    CommunityType.GIRVAN_NEWMAN,
    CommunityType.KERNIGHAN_LIN,
    CommunityType.ASYN_FLUIDC,
]

COMMUNITY_CATEGORIES = {
    "modularity_based": [
        CommunityType.LOUVAIN,
        CommunityType.LEIDEN,
        CommunityType.GREEDY_MODULARITY,
    ],
    "label_propagation": [
        CommunityType.LABEL_PROPAGATION,
        CommunityType.ASYN_LPABASE,
    ],
    "hierarchical": [
        CommunityType.GIRVAN_NEWMAN,
    ],
    "fluid_based": [
        CommunityType.ASYN_FLUIDC,
    ],
    "bisection": [
        CommunityType.KERNIGHAN_LIN,
    ],
}

COMMUNITY_REQUIREMENTS = {
    CommunityType.ASYN_FLUIDC: "Connected graphs only",
}

COMMUNITY_PERFORMANCE = {
    CommunityType.GIRVAN_NEWMAN: "Very slow",
    
    CommunityType.KERNIGHAN_LIN: "Moderate",
    CommunityType.GREEDY_MODULARITY: "Moderate",
    
    CommunityType.LOUVAIN: "Fast",
    CommunityType.LEIDEN: "Fast",
    CommunityType.LABEL_PROPAGATION: "Fast",
    CommunityType.ASYN_LPABASE: "Fast",
    CommunityType.ASYN_FLUIDC: "Fast",
}

COMMUNITY_DESCRIPTIONS = {
    CommunityType.LOUVAIN: "Fast modularity optimization through hierarchical agglomeration and refinement passes",
    CommunityType.LEIDEN: "Improved Louvain variant that guarantees well-connected communities and better partitions",
    CommunityType.LABEL_PROPAGATION: "Nodes iteratively adopt the most common community label among their neighbors",
    CommunityType.GREEDY_MODULARITY: "Agglomerative hierarchical clustering that greedily maximizes modularity at each step",
    CommunityType.GIRVAN_NEWMAN: "Divisive hierarchical method that iteratively removes edges with highest betweenness",
    CommunityType.KERNIGHAN_LIN: "Bisection algorithm that swaps vertices between two groups to minimize cut size",
    CommunityType.ASYN_LPABASE: "Asynchronous label propagation with random node update ordering",
    CommunityType.ASYN_FLUIDC: "Fluid communities algorithm using density-based propagation to find k communities",
}