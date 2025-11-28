import logging
from typing import Any, Dict, List, Set

from fastapi import HTTPException

from .normalizers import normalize_network_format
from .validators import validate_links, validate_network_structure

logger = logging.getLogger(__name__)

# Preprocess and validate network data from various formats:
#   Node-link format: {"nodes": [...], "links": [...]}
#   Edge list format: {"edges": [[source, target], ...]} or [{"source": ..., "target": ...}]
#   Adjacency list format: {"adjacency": {node: [neighbors]}}

# Extracts and returns a dict of the following data:
#   Cleaned network (nodes without history/attributes in base structure)
#   Timesteps (sorted list of unique timesteps from node histories)
#   Timelines (mapping of node_id -> history entries)
#   Attributes (mapping of node_id -> attributes dict)

def preprocess_network(data: Dict[str, Any]) -> Dict[str, Any]:
    normalized_data = normalize_network_format(data)
    validate_network_structure(normalized_data)
    
    nodes = normalized_data.get("nodes", [])
    links = normalized_data.get("links", [])
    
    timesteps: Set[int] = set()
    timelines: Dict[str, List[Dict[str, Any]]] = {}
    attributes: Dict[str, Dict[str, Any]] = {}
    processed_nodes: List[Dict[str, Any]] = []
    
    for node in nodes:
        node_id = node.get("id")
        
        if node_id is None:
            raise HTTPException(
                status_code=422,
                detail="All nodes must have an 'id' field"
            )
        
        node_attrs = node.get("attributes", {})
        if node_attrs and isinstance(node_attrs, dict):
            attributes[str(node_id)] = node_attrs
        
        node_history = node.get("history", [])
        if isinstance(node_history, list) and len(node_history) > 0:
            timelines[str(node_id)] = node_history
            
            for entry in node_history:
                if isinstance(entry, dict):
                    timestep_value = entry.get("timestep")
                    if isinstance(timestep_value, (int, float)):
                        timesteps.add(int(timestep_value))
        
        processed_node = {"id": node_id}
        
        if "label" in node:
            processed_node["label"] = node["label"]
        
        processed_nodes.append(processed_node)
    
    validate_links(links, {str(n["id"]) for n in processed_nodes})
    
    cleaned_network = {
        "nodes": processed_nodes,
        "links": links
    }
    
    result = {
        "network": cleaned_network,
        "timesteps": sorted(list(timesteps)),
        "timelines": timelines,
        "attributes": attributes
    }
    
    logger.info(
        f"Preprocessed network: {len(processed_nodes)} nodes, "
        f"{len(links)} links, {len(timesteps)} timesteps, "
        f"{len(timelines)} nodes with timelines, "
        f"{len(attributes)} nodes with attributes"
    )
    
    return result