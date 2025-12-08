# Preprocesses static (non-temporal) networks into a delta based format for consistent handling
# supports Node-link format with nodes/edges, attributes, weights, labels 

# Input format:
# {
#     "nodes": [{"id": "A", "label": "Node A", "attributes": {"color": "red"}}],
#     "edges": [{"source": "A", "target": "B", "weight": 5, "attributes": {"type": "friend"}}]
# }

# Output format:
# {
#     "network": {"nodes": [...], "edges": [...]},  # Full network at timestep 0
#     "timesteps": [0],
#     "base_state": {"nodes": [], "edges": []},  # Empty base state
#     "deltas": {
#         0: {
#             "nodes_added": [...],  # All nodes added at t=0
#             "edges_added": [...],  # All edges added at t=0
#             "nodes_removed": [], "edges_removed": [],
#             "nodes_attr_changed": {}, "edges_attr_changed": {}
#         }
#     }
# }

# Steps:
# 1. Nodes: normalize IDs to strings, flatten attributes, collect attribute keys
# 2. Edges: validate source/target exist, generate edge IDs, flatten attributes, collect weights and attribute keys
# 3. Add weight to edge attributes if weights vary
# 4. Detect and resolve attribute key conflicts between nodes and edges by prefixing edges with: edge_
# 5. Create delta for timestep 0 with all nodes/edges marked as "added"
# 6. Return result with empty base_state and single timestep delta

import logging
from typing import List, Set

from fastapi import HTTPException

from ..types import (Edge, EdgesDict, NetworkData, Node, NodesDict,
                     ProcessedNetworkResult, TimestepDelta)
from .attributes import flatten_attributes, make_edge_id

logger = logging.getLogger(__name__)


def preprocess_static_network(nodes: List[Node], edges: List[Edge], directed: bool) -> ProcessedNetworkResult:
    nodes_dict: NodesDict = {}
    edges_dict: EdgesDict = {}

    all_node_attr_keys: Set[str] = set()
    all_edge_attr_keys: Set[str] = set()

    # 1. Nodes: normalize IDs to strings, flatten attributes, collect attribute keys
    for node in nodes:
        node_id = node.get("id")
        if node_id is None:
            raise HTTPException(status_code=422, detail="All nodes must have an 'id' field")
        node_id_str = str(node_id)

        processed_node: Node = {"id": node_id_str}
        if "label" in node:
            processed_node["label"] = node["label"]

        if "attributes" in node and isinstance(node["attributes"], dict) and node["attributes"]:
            flattened = flatten_attributes(node["attributes"], context="Node attributes")
            processed_node["attributes"] = flattened
            all_node_attr_keys.update(flattened.keys())

        nodes_dict[node_id_str] = processed_node

    valid_node_ids: Set[str] = set(nodes_dict.keys())

    weights_list: List[float | int] = []
    invalid_edges: List[dict] = []

    # 2. Edges: validate source/target exist, generate edge IDs, flatten attributes, collect weights and attribute keys
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source is None or target is None:
            continue
        
        source_s = str(source)
        target_s = str(target)
        
        if source_s not in valid_node_ids:
            invalid_edges.append({"source": source_s, "target": target_s, "reason": f"source node '{source_s}' not found"})
            continue
        
        if target_s not in valid_node_ids:
            invalid_edges.append({"source": source_s, "target": target_s, "reason": f"target node '{target_s}' not found"})
            continue
        
        edge_id = make_edge_id(source_s, target_s, directed)

        processed_edge: Edge = {
            "id": edge_id,
            "source": source_s,
            "target": target_s,
        }

        if "weight" in edge:
            processed_edge["weight"] = edge["weight"]
            weights_list.append(edge["weight"])

        if "attributes" in edge and isinstance(edge["attributes"], dict) and edge["attributes"]:
            flattened = flatten_attributes(edge["attributes"], context="Edge attributes")
            processed_edge["attributes"] = flattened
            all_edge_attr_keys.update(flattened.keys())
        else:
            processed_edge["attributes"] = {}

        edges_dict[edge_id] = processed_edge

    if invalid_edges:
        logger.warning(
            f"Skipped {len(invalid_edges)} invalid edge(s) with non-existent nodes: "
            f"{invalid_edges[:5]}{'...' if len(invalid_edges) > 5 else ''}"
        )

    is_weight_meaningful = len(set(weights_list)) > 1

    # 3. Add weight to edge attributes if weights vary
    if is_weight_meaningful:
        for edge in edges_dict.values():
            if "weight" in edge:
                if "attributes" not in edge or edge["attributes"] is None:
                    edge["attributes"] = {}
                edge["attributes"]["weight"] = edge["weight"]

    # 4. Detect and resolve attribute key conflicts between nodes and edges by prefixing edges with: edge_
    duplicate_keys = all_node_attr_keys & all_edge_attr_keys
    if duplicate_keys:
        for _, edge in edges_dict.items():
            if "attributes" in edge and isinstance(edge["attributes"], dict):
                prefixed = {}
                for k, v in edge["attributes"].items():
                    if k in duplicate_keys:
                        prefixed[f"edge_{k}"] = v
                    else:
                        prefixed[k] = v
                edge["attributes"] = prefixed

        prefixed_edge_keys: Set[str] = set()
        for edge in edges_dict.values():
            if "attributes" in edge and isinstance(edge["attributes"], dict):
                prefixed_edge_keys.update(edge["attributes"].keys())

        still_duplicate = all_node_attr_keys & prefixed_edge_keys
        if still_duplicate:
            raise HTTPException(
                status_code=422,
                detail=f"Edge and node attributes contain non-unique keys even after prefixing: {sorted(still_duplicate)}"
            )

    processed_nodes: List[Node] = list(nodes_dict.values())
    processed_edges: List[Edge] = list(edges_dict.values())

    base_state: NetworkData = {"nodes": [], "edges": []}
    
    # 5. Create delta for timestep 0 with all nodes/edges marked as "added"
    delta_0: TimestepDelta = {
        "nodes_added": processed_nodes,
        "nodes_removed": [],
        "nodes_attr_changed": {},
        "edges_added": processed_edges,
        "edges_removed": [],
        "edges_attr_changed": {}
    }

    cleaned_network: NetworkData = {"nodes": processed_nodes, "edges": processed_edges}

    result: ProcessedNetworkResult = {
        "network": cleaned_network,
        "timesteps": [0],
        "base_state": base_state,
        "deltas": {0: delta_0}
    }

    logger.info(
        f"Preprocessed as static network (timestep 0): {len(processed_nodes)} nodes, {len(processed_edges)} edges"
    )

    return result