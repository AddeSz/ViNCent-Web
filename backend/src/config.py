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
    "degree_based": [
        CentralityType.DEGREE,
        CentralityType.IN_DEGREE,
        CentralityType.OUT_DEGREE,
    ],

    "eigenvector_based": [
        CentralityType.EIGENVECTOR,
        CentralityType.KATZ,
        CentralityType.PAGERANK,
        CentralityType.SUBGRAPH,
        CentralityType.LAPLACIAN,
        CentralityType.SECOND_ORDER,
    ],

    "distance_based": [
        CentralityType.CLOSENESS,
        CentralityType.HARMONIC,
        CentralityType.INFORMATION_CENTRALITY,
    ],

    "flow_based": [
        CentralityType.BETWEENNESS,
        CentralityType.CURRENT_FLOW_BETWEENNESS,
        CentralityType.COMMUNICABILITY_BETWEENNESS,
        CentralityType.LOAD,
        CentralityType.EDGE_LOAD,
    ],

    "edge_specific": [
        CentralityType.EDGE_BETWEENNESS,
        CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
        CentralityType.EDGE_LOAD,
        CentralityType.EDGE_DISPERSION,
        CentralityType.EDGE_TROPHIC_DIFFERENCES,
    ],

    "directed_only": [
        CentralityType.IN_DEGREE,
        CentralityType.OUT_DEGREE,
        CentralityType.LOCAL_REACHING,
    ],

    "dag_only": [
        CentralityType.TROPHIC_LEVEL,
        CentralityType.EDGE_TROPHIC_DIFFERENCES,
    ],
}
