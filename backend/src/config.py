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
    "edge_based_centralites": [
        CentralityType.EDGE_BETWEENNESS,
        CentralityType.EDGE_LOAD,
        CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
        CentralityType.EDGE_DISPERSION,
        CentralityType.EDGE_TROPHIC_DIFFERENCES,
    ],
    "hierarchy_based_centralites": [
        CentralityType.TROPHIC_LEVEL,
        CentralityType.EDGE_TROPHIC_DIFFERENCES,
        # CentralityType.TROPHIC_INCOHERENCE,
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
    CentralityType.DEGREE: "Number of direct connections a node has",
    CentralityType.IN_DEGREE: "Number of incoming edges to a node",
    CentralityType.OUT_DEGREE: "Number of outgoing edges from a node",
    CentralityType.EIGENVECTOR: "Importance based on connections to other important nodes",
    CentralityType.KATZ: "Influence considering all paths with diminishing weights",
    CentralityType.PAGERANK: "Probability of reaching a node via random walk",
    CentralityType.PERCOLATION: "Resilience measure for node removal impact",
    CentralityType.VOTERANK: "Identifies influential spreaders through voting algorithm",
    
    CentralityType.CLOSENESS: "Average distance to all other nodes (reachability)",
    CentralityType.HARMONIC: "Sum of reciprocal distances (works on disconnected graphs)",
    CentralityType.BETWEENNESS: "Frequency of appearing on shortest paths between nodes",
    CentralityType.LOAD: "Expected load on node assuming shortest-path routing",
    CentralityType.INFORMATION_CENTRALITY: "Importance based on information flow efficiency",
    CentralityType.LOCAL_REACHING: "Reachability within limited distance",
    
    CentralityType.SUBGRAPH: "Number of subgraphs a node participates in",
    CentralityType.COMMUNICABILITY_BETWEENNESS: "Node importance in network communication paths",
    CentralityType.CURRENT_FLOW_BETWEENNESS: "Betweenness using electrical current flow model",
    CentralityType.LAPLACIAN: "Importance based on graph Laplacian eigenvalues",
    CentralityType.SECOND_ORDER: "Centrality using second-order neighborhood structure",
    
    CentralityType.EDGE_BETWEENNESS: "Frequency of edge appearing on shortest paths",
    CentralityType.EDGE_LOAD: "Expected traffic load on an edge",
    CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS: "Edge betweenness using current flow model",
    CentralityType.EDGE_DISPERSION: "Measures how well an edge connects different communities",
    CentralityType.EDGE_TROPHIC_DIFFERENCES: "Height difference in trophic levels across edge",
    
    CentralityType.TROPHIC_LEVEL: "Position in food chain or hierarchy (height in DAG)",
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
    CommunityType.LOUVAIN: "Fast algorithm that finds groups by maximizing connections within communities",
    CommunityType.LEIDEN: "Improved version of Louvain with better quality guarantees and well-connected communities",
    CommunityType.LABEL_PROPAGATION: "Nodes join communities based on their neighbors' memberships",
    CommunityType.GREEDY_MODULARITY: "Quickly merges nodes into communities with strong internal connections",
    CommunityType.GIRVAN_NEWMAN: "Hierarchical algorithm that progressively splits networks into nested community structures",
    CommunityType.KERNIGHAN_LIN: "Splits network into two balanced communities with minimal cross-edges",
    CommunityType.ASYN_LPABASE: "Label propagation variant with asynchronous updates",
    CommunityType.ASYN_FLUIDC: "Fluid communities algorithm for finding a fixed number of groups",
}