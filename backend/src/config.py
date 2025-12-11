from .types import CentralityType

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
    "node_importance": [
        CentralityType.DEGREE,
        CentralityType.IN_DEGREE,
        CentralityType.OUT_DEGREE,
        CentralityType.EIGENVECTOR,
        CentralityType.KATZ,
        CentralityType.PAGERANK,
        CentralityType.PERCOLATION,
        CentralityType.VOTERANK,
    ],
    "distance_flow": [
        CentralityType.CLOSENESS,
        CentralityType.HARMONIC,
        CentralityType.BETWEENNESS,
        CentralityType.LOAD,
        CentralityType.INFORMATION_CENTRALITY,
        CentralityType.LOCAL_REACHING,
        # CentralityType.GLOBAL_REACHING,
    ],
    "network_structure": [
        CentralityType.SUBGRAPH,
        # CentralityType.SUBGRAPH_CENTRALITY_EXP,
        CentralityType.COMMUNICABILITY_BETWEENNESS,
        CentralityType.CURRENT_FLOW_BETWEENNESS,
        CentralityType.LAPLACIAN,
        CentralityType.SECOND_ORDER,
    ],
    "edge_metrics": [
        CentralityType.EDGE_BETWEENNESS,
        CentralityType.EDGE_LOAD,
        CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
        CentralityType.EDGE_DISPERSION,
        CentralityType.EDGE_TROPHIC_DIFFERENCES,
    ],
    "hierarchy": [
        CentralityType.TROPHIC_LEVEL,
        CentralityType.EDGE_TROPHIC_DIFFERENCES,
        # CentralityType.TROPHIC_INCOHERENCE,
    ],
}

CENTRALITY_REQUIREMENTS = {
    CentralityType.IN_DEGREE: "Directed graphs only",
    CentralityType.OUT_DEGREE: "Directed graphs only",
    CentralityType.LOCAL_REACHING: "Directed graphs only",
    # CentralityType.GLOBAL_REACHING: "Directed graphs only",
    
    CentralityType.SUBGRAPH: "Undirected graphs only",
    # CentralityType.SUBGRAPH_CENTRALITY_EXP: "Undirected graphs only",
    CentralityType.SECOND_ORDER: "Connected undirected graphs only",
    CentralityType.INFORMATION_CENTRALITY: "Connected undirected graphs only",
    CentralityType.CURRENT_FLOW_BETWEENNESS: "Connected undirected graphs only",
    CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS: "Connected undirected graphs only",
    CentralityType.COMMUNICABILITY_BETWEENNESS: "Connected undirected graphs only",
    
    CentralityType.TROPHIC_LEVEL: "Directed acyclic graphs (DAG) only",
    CentralityType.EDGE_TROPHIC_DIFFERENCES: "Directed acyclic graphs (DAG) only",
    # CentralityType.TROPHIC_INCOHERENCE: "Directed acyclic graphs (DAG) only",
    
    CentralityType.EIGENVECTOR: "Connected graphs only (strongly connected if directed)",
}

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