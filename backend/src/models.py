from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# These are the ones found in NetWorkX (those that are relevant)
class CentralityType(str, Enum):
    DEGREE = "degree"
    BETWEENNESS = "betweenness"
    CLOSENESS = "closeness"
    EIGENVECTOR = "eigenvector"
    PAGERANK = "pagerank"
    KATZ = "katz"
    HARMONIC = "harmonic"

    LOAD = "load"
    EDGE_BETWEENNESS = "edge_betweenness"
    EDGE_LOAD = "edge_load"
    CURRENT_FLOW_BETWEENNESS = "current_flow_betweenness"
    EDGE_CURRENT_FLOW_BETWEENNESS = "edge_current_flow_betweenness"
    INFORMATION_CENTRALITY = "information_centrality"
    COMMUNICABILITY_BETWEENNESS = "communicability_betweenness"

    SUBGRAPH = "subgraph"
    SUBGRAPH_CENTRALITY_EXP = "subgraph_centrality_exp"
    LAPLACIAN = "laplacian"
    SECOND_ORDER = "second_order"

    PERCOLATION = "percolation"

    VOTERANK = "voterank"
    DISPERSION = "dispersion"

    IN_DEGREE = "in_degree"
    OUT_DEGREE = "out_degree"
    LOCAL_REACHING = "local_reaching"
    GLOBAL_REACHING = "global_reaching"

    TROPHIC_LEVEL = "trophic_level"
    TROPHIC_DIFFERENCES = "trophic_differences"
    TROPHIC_INCOHERENCE = "trophic_incoherence"
    
    
class Node(BaseModel):
    id: str
    label: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None

class Link(BaseModel):
    source: str
    target: str
    weight: Optional[float] = 1.0
    directed: Optional[bool] = False
    attributes: Optional[Dict[str, Any]] = None

class NetworkData(BaseModel):
    nodes: List[Node]
    links: List[Link]

class CentralityRequest(BaseModel):
    network: NetworkData
    dataset_id: Optional[str] = None
    
class CentralityTimestepRequest(BaseModel):
    timestep: int
    network: NetworkData
    dataset_id: Optional[str] = None
