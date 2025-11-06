from .models import CentralityType

ALL_CENTRALITIES = [
    CentralityType.DEGREE,
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
    CentralityType.SUBGRAPH_CENTRALITY_EXP,
    CentralityType.LAPLACIAN,
    CentralityType.SECOND_ORDER,

    CentralityType.PERCOLATION,

    CentralityType.VOTERANK,
    CentralityType.DISPERSION,

    CentralityType.IN_DEGREE,
    CentralityType.OUT_DEGREE,
    CentralityType.LOCAL_REACHING,
    CentralityType.GLOBAL_REACHING,

    CentralityType.TROPHIC_LEVEL,
    CentralityType.TROPHIC_DIFFERENCES,
    CentralityType.TROPHIC_INCOHERENCE,
]


CENTRALITY_CATEGORIES = {
    "basic": [
        CentralityType.DEGREE,
        CentralityType.BETWEENNESS,
        CentralityType.CLOSENESS,
        CentralityType.EIGENVECTOR,
        CentralityType.PAGERANK,
        CentralityType.KATZ,
        CentralityType.HARMONIC,
    ],
    "degree": [
        CentralityType.DEGREE,
        CentralityType.IN_DEGREE,
        CentralityType.OUT_DEGREE,
    ],
    "eigenvector": [
        CentralityType.EIGENVECTOR,
        CentralityType.KATZ,
        CentralityType.PAGERANK,
    ],
    "closeness": [
        CentralityType.CLOSENESS,
        CentralityType.HARMONIC,
        CentralityType.INFORMATION_CENTRALITY,
    ],
    "betweenness": [
        CentralityType.BETWEENNESS,
        CentralityType.CURRENT_FLOW_BETWEENNESS,
        CentralityType.EDGE_BETWEENNESS,
        CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
        CentralityType.COMMUNICABILITY_BETWEENNESS,
    ],
    "flow": [
        CentralityType.LOAD,
        CentralityType.EDGE_LOAD,
    ],
    "subgraph": [
        CentralityType.SUBGRAPH,
        CentralityType.SUBGRAPH_CENTRALITY_EXP,
        CentralityType.LAPLACIAN,
        CentralityType.SECOND_ORDER,
    ],
    "robustness": [
        CentralityType.PERCOLATION,
        CentralityType.DISPERSION,
    ],
    "ranking": [
        CentralityType.VOTERANK,
    ],
    "directed_only": [
        CentralityType.IN_DEGREE,
        CentralityType.OUT_DEGREE,
        CentralityType.LOCAL_REACHING,
        CentralityType.GLOBAL_REACHING,
    ],
    "dag_only": [
        CentralityType.TROPHIC_LEVEL,
        CentralityType.TROPHIC_DIFFERENCES,
        CentralityType.TROPHIC_INCOHERENCE,
    ],
    "fast": [
        CentralityType.DEGREE,
        CentralityType.CLOSENESS,
        CentralityType.HARMONIC,
        CentralityType.PAGERANK,
        CentralityType.LAPLACIAN,
    ],
    "slow": [
        CentralityType.BETWEENNESS,
        CentralityType.CURRENT_FLOW_BETWEENNESS,
        CentralityType.EIGENVECTOR,
        CentralityType.DISPERSION,
    ],
    "edge": [
        CentralityType.EDGE_BETWEENNESS,
        CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
        CentralityType.EDGE_LOAD,
        CentralityType.TROPHIC_DIFFERENCES,
    ],
}