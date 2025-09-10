from .models import CentralityType

DEFAULT_BASIC_CENTRALITIES = [
    CentralityType.DEGREE,
    CentralityType.BETWEENNESS,
    CentralityType.CLOSENESS,
    CentralityType.EIGENVECTOR,
    CentralityType.PAGERANK
]

ALL_CENTRALITIES = list(CentralityType)
