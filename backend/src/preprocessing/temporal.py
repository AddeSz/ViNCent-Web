# Preprocesses temporal networks into delta based format with base state and timestep changes
# Supports: History based format with node/edge history arrays tracking additions, removals, and attribute changes

# Input format:
# {
#     "nodes": [
#         {
#             "id": "A",
#             "label": "Node A",
#             "atributes": {"color": "red"},
#             "history": [
#                 {"timestep": 1, "added": true},
#                 {"timestep": 2, "atributes": {"color": "blue"}},
#                 {"timestep": 5, "removed": true}
#             ]
#         }
#     ],
#     "edges": [...]
# }

# Output format:
# {
#     "network": {"nodes": [...], "edges": [...]},  # Global list of all nodes/edges
#     "timesteps": [1, 2, 5],
#     "base_state": {"nodes": [...], "edges": [...]},  # Elements existing before first timestep
#     "deltas": {
#         1: {"nodes_added": [...], "edges_added": [...], ...},
#         2: {"nodes_attr_changed": {...}, ...},
#         5: {"nodes_removed": [...], ...}
#     }
# }

# Steps:
# 1. Extract base attributes, labels, and weights from nodes/edges (first appearance values)
# 2. Parse history arrays to collect all timesteps and changes (added, removed, attribute updates)
# 3. Flatten all attributes and collect attribute keys from base and history
# 4. Detect and resolve attribute key conflicts between nodes and edges by prefixing edges with: edge_
# 5. Build deltas for each timestep: nodes/edges added/removed, attribute changes
# 6. Build base_state with elements existing before first timestep (added at t < first_timestep)
# 7. Return result with network, timesteps, base_state, and deltas


import logging
from typing import Dict, List, Set

from ..types import (AttributesDict, Edge, EdgeChangeEntry, Node,
                     NodeChangeEntry, ProcessedNetworkResult, TimestepDelta)
from .attributes import flatten_attributes, make_edge_id, prefix_edge_attrs

logger = logging.getLogger(__name__)

def preprocess_temporal_network(nodes: List[Node], edges: List[Edge], directed: bool) -> ProcessedNetworkResult:
    timesteps_set: Set[int | float] = set()

    node_changes: Dict[str, Dict[int | float, NodeChangeEntry]] = {}
    edge_changes: Dict[str, Dict[int | float, EdgeChangeEntry]] = {}
    
    node_base_attrs: Dict[str, AttributesDict] = {}
    edge_base_attrs: Dict[str, AttributesDict] = {}
    node_labels: Dict[str, str] = {}
    edge_weights: Dict[str, int | float] = {}
    all_node_ids: Set[str] = set()
    all_edge_ids: Set[str] = set()

    all_node_attr_keys: Set[str] = set()
    all_edge_attr_keys: Set[str] = set()

    all_weights: List[float | int] = []

    # 1. Extract base attributes, labels, and weights from nodes/edges (first appearance values)
    for node in nodes:
        node_id = str(node.get("id"))
        all_node_ids.add(node_id)

        node_attrs = node.get("attributes", {})
        if isinstance(node_attrs, dict) and node_attrs:
            # 3. Flatten all attributes and collect attribute keys from base and history
            flattened = flatten_attributes(node_attrs, context="Node attributes")
            node_base_attrs[node_id] = flattened
            all_node_attr_keys.update(flattened.keys())

        label = node.get("label")
        if label:
            node_labels[node_id] = label

        # 2. Parse history arrays to collect all timesteps and changes (added, removed, attribute updates)
        node_history = node.get("history", [])
        if isinstance(node_history, list):
            for entry in node_history:
                if not isinstance(entry, dict):
                    continue
                ts = entry.get("timestep")
                if not isinstance(ts, (int, float)):
                    continue
                timesteps_set.add(ts)

                node_change: NodeChangeEntry = {}
                if "added" in entry:
                    node_change["added"] = entry["added"]
                if "removed" in entry:
                    node_change["removed"] = entry["removed"]

                timestep_attrs = entry.get("attributes", {})
                if isinstance(timestep_attrs, dict) and timestep_attrs:
                    flattened = flatten_attributes(timestep_attrs, context="Node attributes")
                    node_change["attributes"] = flattened
                    all_node_attr_keys.update(flattened.keys())

                if "label" in entry:
                    node_change["label"] = entry["label"]

                if node_change:
                    if node_id not in node_changes:
                        node_changes[node_id] = {}
                    node_changes[node_id][ts] = node_change

    # 1. Extract base attributes, labels, and weights from nodes/edges (first appearance values)
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source is None or target is None:
            continue
        source_s = str(source)
        target_s = str(target)
        edge_id = make_edge_id(source_s, target_s, directed)
        all_edge_ids.add(edge_id)

        weight = edge.get("weight")
        if weight is not None:
            edge_weights[edge_id] = weight
            all_weights.append(weight)

        # 3. Flatten all attributes and collect attribute keys from base and history
        if "attributes" in edge and isinstance(edge["attributes"], dict) and edge["attributes"]:
            flattened = flatten_attributes(edge["attributes"], context="Edge attributes")
            edge_base_attrs[edge_id] = flattened
            all_edge_attr_keys.update(flattened.keys())

        # 2. Parse history arrays to collect all timesteps and changes (added, removed, attribute updates)
        edge_history = edge.get("history", [])
        if isinstance(edge_history, list):
            for entry in edge_history:
                if not isinstance(entry, dict):
                    continue
                ts = entry.get("timestep")
                if not isinstance(ts, (int, float)):
                    continue
                timesteps_set.add(ts)

                edge_change: EdgeChangeEntry = {}
                if "added" in entry:
                    edge_change["added"] = entry["added"]
                if "removed" in entry:
                    edge_change["removed"] = entry["removed"]

                timestep_attrs = entry.get("attributes", {})
                if isinstance(timestep_attrs, dict) and timestep_attrs:
                    flattened = flatten_attributes(timestep_attrs, context="Edge attributes")
                    edge_change["attributes"] = flattened
                    all_edge_attr_keys.update(flattened.keys())

                if "weight" in entry:
                    edge_change["weight"] = entry["weight"]
                    all_weights.append(entry["weight"])

                if edge_change:
                    if edge_id not in edge_changes:
                        edge_changes[edge_id] = {}
                    edge_changes[edge_id][ts] = edge_change

    # 4. Detect and resolve attribute key conflicts between nodes and edges by prefixing edges with: edge_
    edge_base_attrs, edge_changes = prefix_edge_attrs(all_node_attr_keys, edge_base_attrs, edge_changes)

    timesteps_list: List[float | int] = sorted(list(timesteps_set))

    is_weight_meaningful = len(set(all_weights)) > 1

    deltas: Dict[int | float, TimestepDelta] = {}

    # 5. Build deltas for each timestep: nodes/edges added/removed, attribute changes
    for timestep in timesteps_list:
        delta: TimestepDelta = {
            "nodes_added": [],
            "nodes_removed": [],
            "nodes_attr_changed": {},
            "edges_added": [],
            "edges_removed": [],
            "edges_attr_changed": {}
        }

        for node_id, changes_by_time in node_changes.items():
            if timestep not in changes_by_time:
                continue
            change = changes_by_time[timestep]

            if change.get("added"):
                node_info: Node = {"id": node_id}
                if node_id in node_labels:
                    node_info["label"] = node_labels[node_id]
                if node_id in node_base_attrs:
                    node_info["attributes"] = node_base_attrs[node_id]
                delta["nodes_added"].append(node_info)
                
                if "attributes" in change:
                    delta["nodes_attr_changed"][node_id] = change["attributes"]

            elif "attributes" in change:
                delta["nodes_attr_changed"][node_id] = change["attributes"]
                
            if change.get("removed"):
                delta["nodes_removed"].append(node_id)

            if "attributes" in change and not change.get("added"):
                delta["nodes_attr_changed"][node_id] = change["attributes"]

            if "label" in change:
                if node_id not in delta["nodes_attr_changed"]:
                    delta["nodes_attr_changed"][node_id] = {}
                delta["nodes_attr_changed"][node_id]["label"] = change["label"]

        for edge_id, changes_by_time in edge_changes.items():
            if timestep not in changes_by_time:
                continue
            change = changes_by_time[timestep]

            if change.get("added"):
                source, target = edge_id.split("|")
                edge_info: Edge = {"id": edge_id, "source": source, "target": target}

                if edge_id in edge_weights:
                    edge_info["weight"] = edge_weights[edge_id]

                if edge_id in edge_base_attrs:
                    attrs = dict(edge_base_attrs[edge_id])
                    if is_weight_meaningful and edge_id in edge_weights:
                        attrs["weight"] = edge_weights[edge_id]
                    edge_info["attributes"] = attrs

                delta["edges_added"].append(edge_info)
                
                if "attributes" in change:
                    delta["edges_attr_changed"][edge_id] = change["attributes"]
            elif "attributes" in change:
                delta["edges_attr_changed"][edge_id] = change["attributes"]

            if change.get("removed"):
                delta["edges_removed"].append(edge_id)

            if "attributes" in change and not change.get("added"):
                delta["edges_attr_changed"][edge_id] = change["attributes"]

            if "weight" in change:
                if is_weight_meaningful:
                    if edge_id not in delta["edges_attr_changed"]:
                        delta["edges_attr_changed"][edge_id] = {}
                    delta["edges_attr_changed"][edge_id]["weight"] = change["weight"]

        deltas[timestep] = delta

    first_timestep = min(timesteps_list) if timesteps_list else 0

    # 6. Build base_state with elements existing before first timestep (added at t < first_timestep)
    node_first_timestep: Dict[str, int | float] = {}
    for node_id in all_node_ids:
        first_ts = None
        if node_id in node_changes:
            for ts, change in node_changes[node_id].items():
                if change.get("added"):
                    if first_ts is None or ts < first_ts:
                        first_ts = ts
        if first_ts is None:
            first_ts = float('-inf')
        node_first_timestep[node_id] = first_ts

    edge_first_timestep: Dict[str, int | float] = {}
    for edge_id in all_edge_ids:
        first_ts = None
        if edge_id in edge_changes:
            for ts, change in edge_changes[edge_id].items():
                if change.get("added"):
                    if first_ts is None or ts < first_ts:
                        first_ts = ts
        if first_ts is None:
            first_ts = float('-inf')
        edge_first_timestep[edge_id] = first_ts

    base_nodes: List[Node] = []
    base_edges: List[Edge] = []

    for node_id in sorted(all_node_ids, key=lambda n: node_first_timestep[n]):
        if node_first_timestep[node_id] < first_timestep:
            node_info: Node = {"id": node_id}
            if node_id in node_labels:
                node_info["label"] = node_labels[node_id]
            if node_id in node_base_attrs:
                node_info["attributes"] = node_base_attrs[node_id]
            base_nodes.append(node_info)

    for edge_id in sorted(all_edge_ids, key=lambda e: edge_first_timestep[e]):
        if edge_first_timestep[edge_id] < first_timestep:
            source, target = edge_id.split("|")
            edge_info: Edge = {"id": edge_id, "source": source, "target": target}
            if edge_id in edge_weights:
                edge_info["weight"] = edge_weights[edge_id]

            if edge_id in edge_base_attrs:
                attrs = dict(edge_base_attrs[edge_id])
                if is_weight_meaningful and edge_id in edge_weights:
                    attrs["weight"] = edge_weights[edge_id]
                edge_info["attributes"] = attrs

            base_edges.append(edge_info)

    sorted_global_nodes: List[Node] = []
    for node_id in sorted(all_node_ids, key=lambda n: node_first_timestep[n]):
        node_info: Node = {"id": node_id}
        if node_id in node_labels:
            node_info["label"] = node_labels[node_id]
        sorted_global_nodes.append(node_info)

    sorted_global_edges: List[Edge] = []
    for edge_id in sorted(all_edge_ids, key=lambda e: edge_first_timestep[e]):
        source, target = edge_id.split("|")
        edge_info: Edge = {"id": edge_id, "source": source, "target": target}
        if edge_id in edge_weights:
            edge_info["weight"] = edge_weights[edge_id]
        sorted_global_edges.append(edge_info)

    result: ProcessedNetworkResult = {
        "network": {"nodes": sorted_global_nodes, "edges": sorted_global_edges},
        "timesteps": timesteps_list,
        "base_state": {"nodes": base_nodes, "edges": base_edges},
        "deltas": deltas
    }

    logger.info(
        f"Preprocessed temporal network (delta-based): {len(timesteps_list)} timesteps (first: {first_timestep}), {len(base_nodes)} base nodes, {len(base_edges)} base edges"
    )

    return result