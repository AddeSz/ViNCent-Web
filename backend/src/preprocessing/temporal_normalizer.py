# Converts flat temporal format to history based format, tracking node/edge and attribute changes over time
# Supports: Flat temporal graphs with timestep fields on nodes/edges, tracking additions, removals, and attribute changes

# Input format:
# {
#     "nodes": [
#         {"timestep": 1, "id": "A", "label": "Node A", "attributes": {"color": "red"}},
#         {"timestep": 2, "id": "A", "label": "Node A", "attributes": {"color": "blue"}},
#         {"timestep": 3, "id": "A", "label": "Node A", "attributes": {"color": "blue"}}
#     ],
#     "edges": [
#         {"timestep": 1, "source": "A", "target": "B", "weight": 1.0},
#         {"timestep": 2, "source": "A", "target": "B", "weight": 2.0}
#     ]
# }

# Output format:
# {
#     "nodes": [
#         {
#             "id": "A",
#             "label": "Node A",
#             "attributes": {"color": "red"},
#             "history": [
#                 {"timestep": 1, "added": true},
#                 {"timestep": 2, "atributes": {"color": "blue"}},
#                 {"timestep": 5, "removed": true},
#                 {"timestep": 7, "added": true}
#             ]
#         }
#     ],
#     "edges": [...]
# }
# Base object contains first appearance values, history tracks changes (added, removed, attribute updates)

# Steps:
# 1. Collect all unique timesteps from nodes and edges
# 2. Group flat node entries by node ID, group flat edge entries by (source, target) pairs normalized for undirected graphs
# 3. For each node/edge: use first entry as base, create history tracking added/removed/attribute changes
# 4. Track attribute changes as deltas (only changed attributes, None for removed attributes)
# 5. Track active state to detect when nodes/edges are added/removed across timesteps
# 6. Return nodes and edges with embedded history arrays

import logging
from collections import defaultdict
from typing import Any, Dict, List, Set

from ..types import NetworkData

logger = logging.getLogger(__name__)

def convert_flat_to_history_format(flat_data: Dict[str, List[Dict[str, Any]]], directed: bool) -> NetworkData:   
    # 1. Collect all unique timesteps from nodes and edges
    all_timesteps: Set[int | float] = set()
    for node_entry in flat_data.get("nodes", []):
        ts = node_entry.get("timestep")
        if ts is not None:
            all_timesteps.add(ts)
    
    for edge_entry in flat_data.get("edges", []):
        ts = edge_entry.get("timestep")
        if ts is not None:
            all_timesteps.add(ts)
    
    sorted_timesteps = sorted(all_timesteps)
    
    # 2. Group flat node entries by node ID, group flat edge entries by (source, target) pairs normalized for undirected graphs
    nodes_by_id: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for node_entry in flat_data.get("nodes", []):
        node_id = node_entry.get("id")
        if node_id:
            nodes_by_id[node_id].append(node_entry)
    
    edges_by_pair: Dict[tuple, List[Dict[str, Any]]] = defaultdict(list)
    for edge_entry in flat_data.get("edges", []):
        source = edge_entry.get("source")
        target = edge_entry.get("target")
        if source and target:
            if directed:
                edge_key = (source, target)
            else:
                edge_key = tuple(sorted([source, target]))
            edges_by_pair[edge_key].append(edge_entry)
    
    # 3. For each node: use first entry as base, create history tracking added/removed/attribute changes
    converted_nodes = []
    for node_id, timestep_entries in nodes_by_id.items():
        timestep_entries.sort(key=lambda x: x.get("timestep", 0))
        
        node_timesteps = set(entry.get("timestep") for entry in timestep_entries)
        
        first_entry = timestep_entries[0]
        
        node_obj: Dict[str, Any] = {
            "id": node_id,
        }
        
        if "label" in first_entry:
            node_obj["label"] = first_entry["label"]
        
        if "attributes" in first_entry and first_entry["attributes"]:
            node_obj["attributes"] = first_entry["attributes"]
        
        history = []
        
        entry_map = {entry.get("timestep"): entry for entry in timestep_entries}
        
        prev_attrs = dict(first_entry.get("attributes", {}))
        prev_label = first_entry.get("label")
        is_active = False
        
        for ts in sorted_timesteps:
            if ts in node_timesteps:
                if not is_active:
                    history.append({
                        "timestep": ts,
                        "added": True
                    })
                    is_active = True
                else:
                    curr_entry = entry_map[ts]
                    curr_attrs = curr_entry.get("attributes", {})
                    curr_label = curr_entry.get("label")
                    
                    history_entry: Dict[str, Any] = {"timestep": ts}
                    
                    # 4. Track attribute changes as deltas (only changed attributes, None for removed attributes)
                    if curr_attrs != prev_attrs:
                        attr_changes = {}
                        
                        for key, value in curr_attrs.items():
                            if key not in prev_attrs or prev_attrs[key] != value:
                                attr_changes[key] = value
                        
                        for key in prev_attrs.keys():
                            if key not in curr_attrs:
                                attr_changes[key] = None
                        
                        if attr_changes:
                            history_entry["attributes"] = attr_changes
                    
                    if curr_label != prev_label:
                        history_entry["label"] = curr_label
                    
                    if len(history_entry) > 1:
                        history.append(history_entry)
                    
                    prev_attrs = dict(curr_attrs)
                    prev_label = curr_label
            else:
                # 5. Track active state to detect when nodes/edges are added/removed across timesteps
                if is_active:
                    history.append({
                        "timestep": ts,
                        "removed": True
                    })
                    is_active = False
        
        if history:
            node_obj["history"] = history
        
        converted_nodes.append(node_obj)
    
    # 3. For each edge: use first entry as base, create history tracking added/removed/attribute changes
    converted_edges = []
    for _, timestep_entries in edges_by_pair.items():
        timestep_entries.sort(key=lambda x: x.get("timestep", 0))
        
        edge_timesteps = set(entry.get("timestep") for entry in timestep_entries)
        
        first_entry = timestep_entries[0]
        
        source = first_entry.get("source")
        target = first_entry.get("target")
        
        edge_obj: Dict[str, Any] = {
            "source": source,
            "target": target,
        }
        
        if "weight" in first_entry:
            edge_obj["weight"] = first_entry["weight"]
        
        if "attributes" in first_entry and first_entry["attributes"]:
            edge_obj["attributes"] = first_entry["attributes"]
        
        history = []
        
        entry_map = {entry.get("timestep"): entry for entry in timestep_entries}
        
        prev_weight = first_entry.get("weight")
        prev_attrs = dict(first_entry.get("attributes", {}))
        is_active = False
        
        # 4. Track attribute changes as deltas (only changed attributes, None for removed attributes)
        for ts in sorted_timesteps:
            if ts in edge_timesteps:
                if not is_active:
                    history.append({
                        "timestep": ts,
                        "added": True
                    })
                    is_active = True
                else:
                    curr_entry = entry_map[ts]
                    curr_weight = curr_entry.get("weight")
                    curr_attrs = curr_entry.get("attributes", {})
                    
                    history_entry: Dict[str, Any] = {"timestep": ts}
                    
                    if curr_weight != prev_weight:
                        history_entry["weight"] = curr_weight
                    
                    if curr_attrs != prev_attrs:
                        attr_changes = {}
                        
                        for key, value in curr_attrs.items():
                            if key not in prev_attrs or prev_attrs[key] != value:
                                attr_changes[key] = value
                        
                        for key in prev_attrs.keys():
                            if key not in curr_attrs:
                                attr_changes[key] = None
                        
                        if attr_changes:
                            history_entry["attributes"] = attr_changes
                    
                    if len(history_entry) > 1:
                        history.append(history_entry)
                    
                    prev_weight = curr_weight
                    prev_attrs = dict(curr_attrs)
            else:
                # 5. Track active state to detect when nodes/edges are added/removed across timesteps
                if is_active:
                    history.append({
                        "timestep": ts,
                        "removed": True
                    })
                    is_active = False
        
        if history:
            edge_obj["history"] = history
        
        converted_edges.append(edge_obj)
    
    return {
        "nodes": converted_nodes,
        "edges": converted_edges
    }