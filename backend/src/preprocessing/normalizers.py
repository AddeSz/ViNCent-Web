import logging
from typing import Any, Dict, List

from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Normalize various network formats to standard node-link format:
#   Node-link: {"nodes": [...], "links"/"edges": [...]}
#   Adjacency list: {"adjacency": {node: [neighbors]}}
#   Simple array: [[source, target], ...]

def normalize_network_format(data: Dict[str, Any]) -> Dict[str, Any]:

    if "nodes" in data and ("links" in data or "edges" in data):
        if "edges" in data and "links" not in data:
            data["links"] = data["edges"]
        return data
    
    if "adjacency" in data:
        return adjacency_to_node_link(data["adjacency"])
    
    if isinstance(data, list):
        return edge_list_to_node_link(data)
    
    if all(isinstance(v, (list, dict)) for v in data.values()):
        return adjacency_to_node_link(data)
    
    return data


# Convert edge list format to node-link format.
#   Array of objects: [{"source": "A", "target": "B", "weight": 1}, ...]
#   Array of arrays: [["A", "B"], ["B", "C"], ...]
#   Array of tuples: [("A", "B"), ("B", "C"), ...]
#   Numeric indices: [[0, 1], [1, 2, 1.5], [2, 3]] -> converts to "n0", "n1", etc.

def edge_list_to_node_link(edges: List[Any]) -> Dict[str, Any]:

    nodes_dict = {}
    normalized_links = []
    uses_numeric_indices = False
    
    for edge in edges:
        if isinstance(edge, (list, tuple)) and len(edge) >= 2:
            source, target = edge[0], edge[1]
            if isinstance(source, int) and isinstance(target, int):
                uses_numeric_indices = True
                break
        elif isinstance(edge, dict):
            source = edge.get("source")
            target = edge.get("target")
            if isinstance(source, int) and isinstance(target, int):
                uses_numeric_indices = True
                break
    
    def normalize_node_id(node_id: Any) -> str:
        if uses_numeric_indices and isinstance(node_id, int):
            return f"n{node_id}"
        return str(node_id)
    
    for edge in edges:
        link = {}
        
        if isinstance(edge, dict):
            if "source" not in edge or "target" not in edge:
                raise HTTPException(
                    status_code=422,
                    detail="Edge objects must contain 'source' and 'target' fields"
                )
            
            source_id = normalize_node_id(edge["source"])
            target_id = normalize_node_id(edge["target"])
            
            link = edge.copy()
            link["source"] = source_id
            link["target"] = target_id
            
            nodes_dict[source_id] = source_id
            nodes_dict[target_id] = target_id
            
        elif isinstance(edge, (list, tuple)) and len(edge) >= 2:
            source_id = normalize_node_id(edge[0])
            target_id = normalize_node_id(edge[1])
            
            link["source"] = source_id
            link["target"] = target_id
            
            if len(edge) >= 3:
                link["weight"] = edge[2]
            
            if len(edge) > 3:
                link["attributes"] = {f"attr_{i}": edge[i] for i in range(3, len(edge))}
            
            nodes_dict[source_id] = source_id
            nodes_dict[target_id] = target_id
        else:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid edge format: {edge}. Expected dict, list, or tuple."
            )
        
        normalized_links.append(link)
    
    nodes = [{"id": node_id} for node_id in sorted(nodes_dict.keys())]
    
    format_info = "with numeric indices (n0, n1, ...)" if uses_numeric_indices else ""
    logger.info(f"Converted edge list to node-link format {format_info}: {len(nodes)} nodes, {len(normalized_links)} edges")
    
    return {
        "nodes": nodes,
        "links": normalized_links
    }


# Convert adjacency list format to node-link format.
#   Simple: {"A": ["B", "C"], "B": ["C"], ...}
#   With weights: {"A": {"B": 1.0, "C": 2.0}, ...}
#   With attributes: {"A": [{"target": "B", "weight": 1}], ...}

def adjacency_to_node_link(adjacency: Dict[str, Any]) -> Dict[str, Any]:
    nodes_set = set()
    links = []
    
    for source, targets in adjacency.items():
        nodes_set.add(str(source))
        
        if isinstance(targets, list):
            for target in targets:
                if isinstance(target, dict):
                    if "target" not in target:
                        raise HTTPException(
                            status_code=422,
                            detail=f"Adjacency entry for '{source}' contains dict without 'target' field"
                        )
                    link = {"source": source, **target}
                    nodes_set.add(str(target["target"]))
                else:
                    link = {"source": source, "target": target}
                    nodes_set.add(str(target))
                
                links.append(link)
                
        elif isinstance(targets, dict):
            for target, value in targets.items():
                nodes_set.add(str(target))
                link = {"source": source, "target": target}
                
                if isinstance(value, (int, float)):
                    link["weight"] = value
                elif isinstance(value, dict):
                    link.update(value)
                
                links.append(link)
        else:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid adjacency format for node '{source}'"
            )
    
    nodes = [{"id": node_id} for node_id in sorted(nodes_set)]
    
    logger.info(f"Converted djacency list to node-link format: {len(nodes)} nodes, {len(links)} edges")
    
    return {
        "nodes": nodes,
        "links": links
    }