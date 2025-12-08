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

# Used in the frontend as it defines the attribute types and values. 
def collect_attribute_data(
    base_state: NetworkData,
    deltas: Dict[int | float, TimestepDelta],
    centralities: Dict[int | float, Dict[str, Dict[str, Dict[str, float]]]],
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
    
    def build_metadata(attr_values: CollectedAttributes, centrality_keys: set[str]) -> Dict[str, AttributeMetadata]:
        metadata: Dict[str, AttributeMetadata] = {}
        for key, values in attr_values.items():
            values_list = list(values)
            all_numbers = all(isinstance(v, (int, float)) for v in values_list)
            all_strings = all(isinstance(v, str) for v in values_list)
            all_booleans = all(isinstance(v, bool) for v in values_list)
            
            info: AttributeMetadata = {
                "key": key,
                "values": values_list,
                "isCentrality": key in centrality_keys,
                "isNumeric": False,
                "isCategory": False,
                "type": "string",
                "range": None
            }
            
            if all_booleans:
                info["type"] = "boolean"
                info["isCategory"] = True
            elif all_numbers:
                info["type"] = "number"
                info["isNumeric"] = True
                num_values = [float(v) for v in values_list]
                info["range"] = {"min": min(num_values), "max": max(num_values)}
                unique_values = set(num_values)
                if all(v.is_integer() for v in num_values) and len(unique_values) <= 10:
                    info["isCategory"] = True
            elif all_strings:
                info["type"] = "string"
                if len(set(values_list)) <= 10:
                    info["isCategory"] = True
            else:
                info["type"] = "string"
                if len(set(map(str, values_list))) <= 10:
                    info["isCategory"] = True
            
            metadata[key] = info
        
        return metadata
    
    node_metadata = build_metadata(node_attr_values, node_centrality_keys)
    edge_metadata = build_metadata(edge_attr_values, edge_centrality_keys)
    
    return {
        "nodes": node_metadata,
        "edges": edge_metadata
    }