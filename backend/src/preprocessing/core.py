import logging
import math
from typing import Dict, List, Optional, Set

from ..config import ALL_CENTRALITIES
from ..types import (CentralityType, CommunityType, Edge, EdgesDict,
                     NetworkData, Node, NodesDict, ProcessedNetworkResult,
                     ProgressCallback, TimestepDelta)
from .attributes import collect_attribute_data
from .centrality import calculate_selected_centralities
from .community import calculate_selected_communities
from .graph import create_networkx_graph
from .static import preprocess_static_network
from .temporal import preprocess_temporal_network
from .temporal_normalizer import convert_flat_to_history_format

logger = logging.getLogger(__name__)

# Main preprocessing pipeline:
# 1. Detect format and normalize
# 2. Preprocess into deltas (temporal) or static
# 3. Calculate centralities and use as snapshots instead of deltas since all their values change on every node/edge change in the network
# 4. Build metrics_info for all attributes (cents + attrs)
def process_network(
    data: NetworkData,
    centralities: List[CentralityType] | None = None,
    community_algorithms: List[CommunityType] | None = None,
    progress_callback: Optional[ProgressCallback] = None,
) -> ProcessedNetworkResult:

    if centralities is None:
        centralities = ALL_CENTRALITIES
    
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    directed = data.get("directed", False)
    
    is_temporal = any(
        "timestep" in node for node in nodes
    ) or any(
        "timestep" in edge for edge in edges
    )
        
    if is_temporal:
        flat_data = {"nodes": nodes, "edges": edges}
        history_data = convert_flat_to_history_format(flat_data, directed)
        normalized_nodes = history_data["nodes"]
        normalized_edges = history_data["edges"]
        result = preprocess_temporal_network(normalized_nodes, normalized_edges, directed)
    else:
        result = preprocess_static_network(nodes, edges, directed)
    
    has_attributes = _check_for_attributes(nodes, edges)
    
    if not centralities and not has_attributes:
        logger.info("No centralities selected and no attributes found. Computing degree centrality as fallback.")
        centralities = [CentralityType.DEGREE]
    
    result, node_centrality_keys, edge_centrality_keys = calculate_centralities(
        result, directed, centralities, progress_callback=progress_callback
    )
    
    if community_algorithms:
        result = calculate_communities(
            result, directed, community_algorithms, progress_callback=progress_callback
        )
    
    centralities_data = result.get("centralities", {})
    communities_data = result.get("communities", {})
    
    result["metrics_info"] = collect_attribute_data(
        result["base_state"],
        result["deltas"],
        centralities_data,
        communities_data,
        node_centrality_keys,
        edge_centrality_keys
    )
    
    result["graph_type"] = "directed" if directed else "undirected"
    
    return result


def _check_for_attributes(nodes: List[Node], edges: List[Edge]) -> bool:
    for node in nodes:
        if "attributes" in node and node["attributes"]:
            return True
    
    for edge in edges:
        if "attributes" in edge and edge["attributes"]:
            return True
        if "weight" in edge:
            return True
    
    return False


# Builds entire snapshots of centrality values
def calculate_centralities(
    result: ProcessedNetworkResult,
    directed: bool,
    selected_centralities: List[CentralityType],
    progress_callback: Optional[ProgressCallback] = None,
) -> tuple[ProcessedNetworkResult, Set[str], Set[str]]:
    base_state = result["base_state"]
    deltas = result["deltas"]
    timesteps = result["timesteps"]
    
    all_node_centrality_keys = set()
    all_edge_centrality_keys = set()
    
    centralities: Dict[int | float, Dict[str, Dict[str, Dict[str, float]]]] = {}
    
    current_nodes: NodesDict = {node["id"]: node for node in base_state["nodes"]}
    current_edges: EdgesDict = {edge["id"]: edge for edge in base_state["edges"]}
    
    sorted_timesteps = sorted(timesteps)
    timestep_total = len(sorted_timesteps)
    
    logger.info(f"Calculating {len(selected_centralities)} centrality types across {timestep_total} timesteps")
    
    for timestep_index, timestep in enumerate(sorted_timesteps, start=1):
        delta = deltas[timestep]
        
        _apply_delta_to_state(current_nodes, current_edges, delta)
        
        network = _build_network_from_state(current_nodes, current_edges, directed)
        
        if not network["nodes"]:
            centralities[timestep] = {"nodes": {}, "edges": {}}
            continue
            
        G = create_networkx_graph(network, directed)
        node_results, edge_results = calculate_selected_centralities(
            G,
            selected_centralities,
            progress_callback=progress_callback,
            timestep_index=timestep_index,
            timestep_total=timestep_total,
        )
        
        all_node_centrality_keys.update(
            cent_name 
            for node_cents in node_results.values() 
            for cent_name in node_cents.keys()
        )
        all_edge_centrality_keys.update(
            cent_name 
            for edge_cents in edge_results.values() 
            for cent_name in edge_cents.keys()
        )
        
        cleaned_node_results : Dict[str, Dict[str, float]] = {}
        for node_id, node_cents in node_results.items():
            cleaned_cents = {}
            for cent_name, val in node_cents.items():
                if isinstance(val, float) and not math.isfinite(val):
                    val = 0.0
                cleaned_cents[cent_name] = val
            cleaned_node_results[node_id] = cleaned_cents
        
        cleaned_edge_results : Dict[str, Dict[str, float]] = {}
        for edge_id, edge_cents in edge_results.items():
            cleaned_cents = {}
            for cent_name, val in edge_cents.items():
                if isinstance(val, float) and not math.isfinite(val):
                    val = 0.0
                cleaned_cents[cent_name] = val
            cleaned_edge_results[edge_id] = cleaned_cents
        
        centralities[timestep] = {
            "nodes": cleaned_node_results,
            "edges": cleaned_edge_results
        }
        
    result["centralities"] = centralities
    
    return result, all_node_centrality_keys, all_edge_centrality_keys


# Builds entire snapshots of communities
def calculate_communities(
    result: ProcessedNetworkResult,
    directed: bool,
    selected_algorithms: List[CommunityType],
    progress_callback: Optional[ProgressCallback] = None,
) -> ProcessedNetworkResult:
    base_state = result["base_state"]
    deltas = result["deltas"]
    timesteps = result["timesteps"]
    
    communities: Dict[int | float, Dict[str, Dict[str, int]]] = {}
    
    current_nodes: NodesDict = {node["id"]: node for node in base_state["nodes"]}
    current_edges: EdgesDict = {edge["id"]: edge for edge in base_state["edges"]}
    
    sorted_timesteps = sorted(timesteps)
    timestep_total = len(sorted_timesteps)
    
    logger.info(f"Detecting communities using {len(selected_algorithms)} algorithms across {timestep_total} timesteps")
    
    for timestep_index, timestep in enumerate(sorted_timesteps, start=1):
        delta = deltas[timestep]
        
        _apply_delta_to_state(current_nodes, current_edges, delta)
        
        network = _build_network_from_state(current_nodes, current_edges, directed)
        
        if not network["nodes"]:
            communities[timestep] = {}
            continue
            
        G = create_networkx_graph(network, directed)
        
        community_results = calculate_selected_communities(
            G,
            selected_algorithms,
            progress_callback=progress_callback,
            timestep_index=timestep_index,
            timestep_total=timestep_total,
        )
        
        communities[timestep] = community_results
    
    result["communities"] = communities
    
    return result


# Allows us to traverse the changes in the network for each timestep 
def _apply_delta_to_state(
    current_nodes: NodesDict,
    current_edges: EdgesDict,
    delta: TimestepDelta
):
    for node in delta.get("nodes_added", []):
        node_copy: Node = {"id": node["id"]}
        if "label" in node:
            node_copy["label"] = node["label"]
        if "attributes" in node:
            node_copy["attributes"] = dict(node["attributes"])
        current_nodes[node["id"]] = node_copy
    
    for node_id in delta.get("nodes_removed", []):
        current_nodes.pop(node_id, None)
    
    for node_id, attr_changes in delta.get("nodes_attr_changed", {}).items():
        if node_id in current_nodes:
            node = current_nodes[node_id]
            
            if "attributes" not in node:
                node["attributes"] = {}
            
            node["attributes"].update(attr_changes)
            
            if "label" in attr_changes:
                label_val = attr_changes["label"]
                if isinstance(label_val, str):
                    node["label"] = label_val

    
    for edge in delta.get("edges_added", []):
        edge_copy: Edge = {
            "id": edge["id"],
            "source": edge["source"],
            "target": edge["target"]
        }
        if "weight" in edge:
            edge_copy["weight"] = edge["weight"]
        if "attributes" in edge:
            edge_copy["attributes"] = dict(edge["attributes"])
        current_edges[edge["id"]] = edge_copy
    
    for edge_id in delta.get("edges_removed", []):
        current_edges.pop(edge_id, None)
    
    for edge_id, attr_changes in delta.get("edges_attr_changed", {}).items():
        if edge_id in current_edges:
            edge = current_edges[edge_id]
            
            if "attributes" not in edge:
                edge["attributes"] = {}
            
            edge["attributes"].update(attr_changes)
            
            if "weight" in attr_changes:
                weight_val = attr_changes["weight"]
                if isinstance(weight_val, (int, float)):
                    edge["weight"] = weight_val


def _build_network_from_state(
    current_nodes: NodesDict,
    current_edges: EdgesDict,
    directed: bool
) -> NetworkData:

    nodes: List[Node] = [{"id": n["id"]} for n in current_nodes.values()]

    edges: List[Edge] = []
    for e in current_edges.values():
        edge: Edge = {
            "id": e["id"],
            "source": e["source"],
            "target": e["target"],
        }
        if "weight" in e:
            edge["weight"] = e["weight"]
        edges.append(edge)

    return {"nodes": nodes, "edges": edges, "directed": directed}