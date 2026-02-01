from enum import Enum
from typing import Any, Dict, List, NotRequired, Optional, TypedDict, Union


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
    EDGE_DISPERSION = "edge_dispersion"

    IN_DEGREE = "in_degree"
    OUT_DEGREE = "out_degree"
    LOCAL_REACHING = "local_reaching"
    GLOBAL_REACHING = "global_reaching"

    TROPHIC_LEVEL = "trophic_level"
    EDGE_TROPHIC_DIFFERENCES = "edge_trophic_differences"
    TROPHIC_INCOHERENCE = "trophic_incoherence"
    
class CommunityType(str, Enum):
    LOUVAIN = "louvain"
    LEIDEN = "leiden"
    GREEDY_MODULARITY = "greedy_modularity"
    LABEL_PROPAGATION = "label_propagation"
    ASYN_LPABASE = "asyn_lpabase"
    ASYN_FLUIDC = "asyn_fluidc"
    GIRVAN_NEWMAN = "girvan_newman"
    KERNIGHAN_LIN = "kernighan_lin"
    
AttributeValue = Union[str, int, float, bool]
AttributesDict = Dict[str, AttributeValue]

class Node(TypedDict):
    id: str
    label: NotRequired[str]
    attributes: NotRequired[AttributesDict]
    history: NotRequired[Any]
    timestep: NotRequired[float | int]

class Edge(TypedDict):
    id: str
    source: str
    target: str
    weight: NotRequired[float | int]
    attributes: NotRequired[AttributesDict]
    history: NotRequired[Any]
    timestep: NotRequired[float | int]
    
NodesDict = Dict[str, Node]
EdgesDict = Dict[str, Edge]

class NetworkData(TypedDict):
    nodes: List[Node]
    edges: List[Edge]
    directed: NotRequired[bool]

class TimestepDelta(TypedDict):
    nodes_added: List[Node]
    nodes_removed: List[str]
    nodes_attr_changed: Dict[str, AttributesDict]

    edges_added: List[Edge]
    edges_removed: List[str]
    edges_attr_changed: Dict[str, AttributesDict]

class AttributeRange(TypedDict):
    min: float
    max: float
    
class AttributeMetadata(TypedDict, total=False):
    key: str
    values: List[AttributeValue]
    isCentrality: bool
    isCommunity: bool
    isNumeric: bool
    isCategory: bool
    isBoolean: bool
    type: str
    range: Optional[AttributeRange]
    
class NodeChangeEntry(TypedDict, total=False):
    added: bool
    removed: bool
    attributes: AttributesDict
    label: str

class EdgeChangeEntry(TypedDict, total=False):
    added: bool
    removed: bool
    attributes: AttributesDict
    weight: float | int

class MetricsInfo(TypedDict):
    nodes: Dict[str, AttributeMetadata]
    edges: Dict[str, AttributeMetadata]
    
class ProcessedNetworkResult(TypedDict):
    network: NetworkData
    timesteps: List[int | float]
    base_state: NetworkData
    deltas: Dict[int | float, TimestepDelta]
    metrics_info: NotRequired[MetricsInfo]
    centralities: NotRequired[Dict[int | float, Dict[str, Dict[str, Dict[str, float]]]]]
    graph_type: NotRequired[str]
    communities:  NotRequired[Dict[int | float, Dict[str, Dict[str, int]]]]