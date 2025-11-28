from typing import Any, Dict, List, Set

from fastapi import HTTPException


def validate_network_structure(data: Dict[str, Any]) -> None:
    if "nodes" not in data or "links" not in data:
        raise HTTPException(
            status_code=422,
            detail="Invalid format: must contain 'nodes' and 'links'. "
                   "Supported formats: node-link, edge list, or adjacency list."
        )
    
    if not isinstance(data["nodes"], list) or not isinstance(data["links"], list):
        raise HTTPException(
            status_code=422,
            detail="'nodes' and 'links' must be arrays"
        )
    
    if len(data["nodes"]) == 0:
        raise HTTPException(
            status_code=422,
            detail="Network must contain at least one node"
        )


def validate_links(
    links: List[Dict[str, Any]], 
    valid_node_ids: Set[str]
) -> None:
    for idx, link in enumerate(links):
        if "source" not in link or "target" not in link:
            raise HTTPException(
                status_code=422,
                detail=f"Link at index {idx} must have 'source' and 'target'"
            )
        
        source_id = str(link["source"])
        target_id = str(link["target"])
        
        if source_id not in valid_node_ids:
            raise HTTPException(
                status_code=422,
                detail=f"Link references non-existent source node: {source_id}"
            )
        
        if target_id not in valid_node_ids:
            raise HTTPException(
                status_code=422,
                detail=f"Link references non-existent target node: {target_id}"
            )