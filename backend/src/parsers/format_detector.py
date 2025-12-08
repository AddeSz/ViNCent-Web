# Detects which network format is used in the input data and validates structure
# Supports: node-link (nodes + edges), edge-list (edges only), adjacency-list (dict of neighbors), adjacency-matrix (2D array)

# Input examples:
# {"nodes": [...], "edges": [...]}  -> "node-link"
# {"edges": [...]}  -> "edge-list"
# {"adjacency": {...}}  -> "adjcency-list"
# {"matrix": [[...]]}  -> "adjacency-matrix"

# Output format example:
# ("node-link", True)  -> (format_name, directed_flag)
# Validates node-link format strictly: nodes must have "id", edges must have "source"/"target"

# Steps:
# 1. Check for "directed" field and parse to boolean if present
# 2. Detect format by checking for specific keys in priority order
# 3. For node-link: validate nodes array (must have "id", only allowed fields: id/label/attributes/timestep)
# 4. For node-link: validate edges array (must have "source"/"target", only allowed fields: source/target/weight/attributes/timestep)
# 5. Reject unknown fields or nested structures
# 6. For other formats: return format name (handled by converters)
# 7. (format_name, directed_flag)

from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException


class NetworkFormatDetector:
    @staticmethod
    def detect(data: Dict[str, Any]) -> Tuple[str, Optional[bool]]:
        directed = None
        
        if "directed" in data:
            val = data["directed"]
            if isinstance(val, bool):
                directed = val
            elif isinstance(val, str):
                directed = val.lower() == "directed"
        
        if "nodes" in data and ("edges" in data or "links" in data):
            NetworkFormatDetector._validate_node_link_format(data)
            return ("node-link", directed)
        
        if "matrix" in data:
            return ("adjacency-matrix", directed)
        
        if "adjacency" in data:
            return ("adjacency-list", directed)
        
        if "edges" in data:
            return ("edge-list", directed)
        
        if all(isinstance(v, (list, dict)) for k, v in data.items() if k != "directed"):
            return ("adjacency-list", directed)
        
        return ("unknown", directed)
    
    @staticmethod
    def _validate_node_link_format(data: Dict[str, Any]) -> None:
        nodes = data.get("nodes", [])
        edges = data.get("edges") or data.get("links", [])
        
        if not isinstance(nodes, list):
            raise HTTPException(
                status_code=422,
                detail="'nodes' must be a list"
            )
        
        if not isinstance(edges, list):
            raise HTTPException(
                status_code=422,
                detail="'edges' (or 'links') must be a list"
            )
        
        for i, node in enumerate(nodes):
            if not isinstance(node, dict):
                raise HTTPException(
                    status_code=422,
                    detail=f"Node at index {i} must be an object/dict, got {type(node).__name__}"
                )
            
            if "id" not in node:
                raise HTTPException(
                    status_code=422,
                    detail=f"Node at index {i} missing required 'id' field"
                )
            
            allowed_node_fields = {"id", "label", "attributes", "timestep"}
            unknown_fields = set(node.keys()) - allowed_node_fields
            if unknown_fields:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Node at index {i} contains unknown fields: {sorted(unknown_fields)}. "
                        f"Allowed fields: {sorted(allowed_node_fields)}"
                    )
                )
            
            if "timestep" in node:
                if not isinstance(node["timestep"], (int, float)):
                    raise HTTPException(
                        status_code=422,
                        detail=f"Node at index {i}: 'timestep' must be a number, got {type(node['timestep']).__name__}"
                    )
            
            if "attributes" in node:
                if not isinstance(node["attributes"], dict):
                    raise HTTPException(
                        status_code=422,
                        detail=f"Node at index {i}: 'attributes' must be an object/dict"
                    )
        
        for i, edge in enumerate(edges):
            if not isinstance(edge, dict):
                raise HTTPException(
                    status_code=422,
                    detail=f"Edge at index {i} must be an object/dict, got {type(edge).__name__}"
                )
            
            if "source" not in edge:
                raise HTTPException(
                    status_code=422,
                    detail=f"Edge at index {i} missing required 'source' field"
                )
            
            if "target" not in edge:
                raise HTTPException(
                    status_code=422,
                    detail=f"Edge at index {i} missing required 'target' field"
                )
            
            allowed_edge_fields = {"source", "target", "weight", "attributes", "timestep"}
            unknown_fields = set(edge.keys()) - allowed_edge_fields
            if unknown_fields:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Edge at index {i} contains unknown fields: {sorted(unknown_fields)}. "
                        f"Allowed fields: {sorted(allowed_edge_fields)}"
                    )
                )
            
            if "timestep" in edge:
                if not isinstance(edge["timestep"], (int, float)):
                    raise HTTPException(
                        status_code=422,
                        detail=f"Edge at index {i}: 'timestep' must be a number, got {type(edge['timestep']).__name__}"
                    )
            
            if "weight" in edge:
                if not isinstance(edge["weight"], (int, float)):
                    raise HTTPException(
                        status_code=422,
                        detail=f"Edge at index {i}: 'weight' must be a number"
                    )
            
            if "attributes" in edge:
                if not isinstance(edge["attributes"], dict):
                    raise HTTPException(
                        status_code=422,
                        detail=f"Edge at index {i}: 'attributes' must be an object/dict"
                    )