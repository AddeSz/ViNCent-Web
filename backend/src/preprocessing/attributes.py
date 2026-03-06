import logging
from typing import Any, Dict, Optional, Set, Tuple, cast

from fastapi import HTTPException

from ..types import (AttributeMetadata, AttributesDict, AttributeValue,
                     EdgeChangeEntry, MetricsInfo, NetworkData, TimestepDelta)

logger = logging.getLogger(__name__)

CollectedAttributes = Dict[str, Set[AttributeValue]]

# transforms the attributes from nested objects to a flat list
def flatten_attributes(obj: Dict[str, Any], prefix: str = "", context: str = "attributes") -> Dict[str, AttributeValue]:
    flattened: Dict[str, AttributeValue] = {}

    for key, value in obj.items():
        new_key = f"{prefix}.{key}" if prefix else key

        if value is not None and isinstance(value, dict) and not isinstance(value, list):
            nested = flatten_attributes(value, new_key, context)
            for nested_key, nested_value in nested.items():
                if nested_key in flattened:
                    raise HTTPException(
                        status_code=422,
                        detail=f"{context} contain non-unique keys: '{nested_key}' appears multiple times"
                    )
                flattened[nested_key] = nested_value
        else:
            if new_key in flattened:
                raise HTTPException(
                    status_code=422,
                    detail=f"{context} contain non-unique keys: '{new_key}' appears multiple times"
                )
            flattened[new_key] = cast(AttributeValue, value)

    return flattened


def make_edge_id(source: str, target: str, is_directed: bool) -> str:
    if is_directed:
        return f"{source}|{target}"
    return "|".join(sorted([source, target]))


# if we have duplicate edge/node attribute keys, just add "edge_" as a prefix to the edge attributetus
# if it fails, just throw an error and tell the user to fix it 
def prefix_edge_attrs(
    node_keys: Set[str],
    edge_base_attrs: Dict[str, AttributesDict],
    edge_changes: Dict[str, Dict[int | float, EdgeChangeEntry]],
    prefix: str = "edge_",
) -> Tuple[Dict[str, AttributesDict], Dict[str, Dict[int | float, EdgeChangeEntry]]]:
    duplicate_keys = node_keys & {k for attrs in edge_base_attrs.values() for k in attrs.keys()} 
    
    for changes in edge_changes.values():
        for change in changes.values():
            if "attributes" in change and isinstance(change["attributes"], dict):
                duplicate_keys |= (node_keys & set(change["attributes"].keys()))
    
    if not duplicate_keys:
        return edge_base_attrs, edge_changes
    
    prefixed_edge_base: Dict[str, AttributesDict] = {}
    for eid, attrs in edge_base_attrs.items():
        new_attrs: AttributesDict = {}
        for k, v in attrs.items():
            new_key = f"{prefix}{k}" if k in duplicate_keys else k
            new_attrs[new_key] = v
        prefixed_edge_base[eid] = new_attrs
    
    prefixed_edge_changes: Dict[str, Dict[int | float, EdgeChangeEntry]] = {}
    for eid, changes_by_time in edge_changes.items():
        new_changes: Dict[int | float, EdgeChangeEntry] = {}
        for ts, change in changes_by_time.items():
            new_change: EdgeChangeEntry = {}
            
            if "added" in change:
                new_change["added"] = change["added"]
            if "removed" in change:
                new_change["removed"] = change["removed"]
            if "weight" in change:
                new_change["weight"] = change["weight"]
            
            if "attributes" in change and isinstance(change["attributes"], dict):
                attrs = change["attributes"]
                new_attrs: AttributesDict = {}
                for k, v in attrs.items():
                    new_key = f"{prefix}{k}" if k in duplicate_keys else k
                    new_attrs[new_key] = v
                new_change["attributes"] = new_attrs
            
            new_changes[ts] = new_change
        prefixed_edge_changes[eid] = new_changes
    
    prefixed_keys = {k for attrs in prefixed_edge_base.values() for k in attrs.keys()}
    for changes in prefixed_edge_changes.values():
        for change in changes.values():
            if "attributes" in change and isinstance(change["attributes"], dict):
                prefixed_keys |= set(change["attributes"].keys())
    
    still_duplicate = node_keys & prefixed_keys
    if still_duplicate:
        raise HTTPException(
            status_code=422,
            detail=f"Edge and node attributes contain non-unique keys even after prefixing: {sorted(still_duplicate)}"
        )
    
    return prefixed_edge_base, prefixed_edge_changes


def is_boolean_like(value: Any) -> bool:
    if isinstance(value, bool):
        return True
    
    if isinstance(value, int) and value in (0, 1):
        return True
    
    if isinstance(value, str):
        normalized = value.strip().lower()
        return normalized in ("true", "false", "yes", "no", "1", "0")
    
    return False

# Used in the frontend as it defines the attribute types and values. 
def collect_attribute_data(
    base_state: NetworkData,
    deltas: Dict[int | float, TimestepDelta],
    centralities: Dict[int | float, Dict[str, Dict[str, Dict[str, float]]]],
    communities: Dict[int | float, Dict[str, Dict[str, int]]],
    node_centrality_keys: Set[str],
    edge_centrality_keys: Set[str]
) -> MetricsInfo:
    node_attr_values: CollectedAttributes = {}
    edge_attr_values: CollectedAttributes = {}
    
    def collect_from_attributes(
        attrs: Optional[AttributesDict],
        target_dict: CollectedAttributes
    ) -> None:
        if not attrs:
            return
        for key, value in attrs.items():
            if key not in target_dict:
                target_dict[key] = set()
            target_dict[key].add(value)
    
    for node in base_state.get("nodes", []):
        collect_from_attributes(node.get("attributes"), node_attr_values)
    
    for edge in base_state.get("edges", []):
        collect_from_attributes(edge.get("attributes"), edge_attr_values)
    
    for delta in deltas.values():
        for node in delta.get("nodes_added", []):
            collect_from_attributes(node.get("attributes"), node_attr_values)
        
        for attrs in delta.get("nodes_attr_changed", {}).values():
            collect_from_attributes(attrs, node_attr_values)
        
        for edge in delta.get("edges_added", []):
            collect_from_attributes(edge.get("attributes"), edge_attr_values)
        
        for attrs in delta.get("edges_attr_changed", {}).values():
            collect_from_attributes(attrs, edge_attr_values)
    
    for timestep_centralities in centralities.values():
        for _, node_cents in timestep_centralities.get("nodes", {}).items():
            collect_from_attributes(cast(AttributesDict, node_cents), node_attr_values)
        
        for _, edge_cents in timestep_centralities.get("edges", {}).items():
            collect_from_attributes(cast(AttributesDict, edge_cents), edge_attr_values)
    
    for timestep_communities in communities.values():
        for algorithm_name, node_communities in timestep_communities.items():
            if algorithm_name not in node_attr_values:
                node_attr_values[algorithm_name] = set()
            for community_id in node_communities.values():
                node_attr_values[algorithm_name].add(community_id)
    
    def build_metadata(
        attr_values: CollectedAttributes, 
        centrality_keys: set[str],
        community_keys: set[str]
    ) -> Dict[str, AttributeMetadata]:
        metadata: Dict[str, AttributeMetadata] = {}
        for key, values in attr_values.items():
            values_list = list(values)
            
            non_none_values = [v for v in values_list if v is not None]
            
            if not non_none_values:
                info: AttributeMetadata = {
                    "key": key,
                    "values": values_list,
                    "isCentrality": key in centrality_keys,
                    "isCommunity": key in community_keys,
                    "isNumeric": False,
                    "isCategory": False,
                    "isBoolean": False,
                    "type": "string",
                    "range": None
                }
                metadata[key] = info
                continue
            
            all_numbers = all(isinstance(v, (int, float)) for v in non_none_values)
            all_strings = all(isinstance(v, str) for v in non_none_values)
            all_boolean= all(is_boolean_like(v) for v in non_none_values)
            
            is_community = key in community_keys
            
            info: AttributeMetadata = {
                "key": key,
                "values": values_list,
                "isCentrality": key in centrality_keys,
                "isCommunity": is_community,
                "isNumeric": False,
                "isCategory": False,
                "isBoolean": False,
                "type": "string",
                "range": None
            }
            
            if all_boolean:
                info["type"] = "boolean"
                info["isBoolean"] = True
                info["isCategory"] = True
            elif all_numbers:
                info["type"] = "number"
                info["isNumeric"] = True
                num_values = [float(v) for v in non_none_values]
                info["range"] = {"min": min(num_values), "max": max(num_values)}
                unique_values = set(num_values)
                if is_community or (all(v.is_integer() for v in num_values) and len(unique_values) <= 20):
                    info["isCategory"] = True
            elif all_strings:
                info["type"] = "string"
                if len(set(non_none_values)) <= 20:
                    info["isCategory"] = True
            else:
                info["type"] = "string"
                if len(set(map(str, non_none_values))) <= 20:
                    info["isCategory"] = True
            
            metadata[key] = info
        
        return metadata
    
    community_keys = {
        algorithm_name 
        for timestep_communities in communities.values() 
        for algorithm_name in timestep_communities.keys()
    }
    
    node_metadata = build_metadata(node_attr_values, node_centrality_keys, community_keys)
    edge_metadata = build_metadata(edge_attr_values, edge_centrality_keys, set())
    
    return {
        "nodes": node_metadata,
        "edges": edge_metadata
    }