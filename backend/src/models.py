from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from enum import Enum
# These are the ones found in NetWorkX ...
class CentralityType(str, Enum):
    DEGREE = "degree"
    IN_DEGREE = "in_degree"
    OUT_DEGREE = "out_degree"
    BETWEENNESS = "betweenness"
    CLOSENESS = "closeness"
    EIGENVECTOR = "eigenvector"
    PAGERANK = "pagerank"
    KATZ = "katz"
    HARMONIC = "harmonic"
    LOAD = "load"
    SUBGRAPH = "subgraph"
    CURRENT_FLOW_CLOSENESS = "current_flow_closeness"
    CURRENT_FLOW_BETWEENNESS = "current_flow_betweenness"
    COMMUNICABILITY_BETWEENNESS = "communicability_betweenness"
    PERCOLATION = "percolation"
    SECOND_ORDER = "second_order"
    LOCAL_REACHING = "local_reaching"
    TROPHIC_LEVEL = "trophic_level"

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
    centralities: Optional[List[CentralityType]] = None
