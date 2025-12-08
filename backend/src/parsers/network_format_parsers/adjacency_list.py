# Converts adjacency list format into my standardized node-link format
# Supports: {node: [neighbors]}, {node: {neighbor: weight}}, {node: [{target: "A", weight: 5}]}

# Input examples:
# {"adjacency": {"A": ["B", "C"], "B": ["C"]}}
# {"A": {"B": 5, "C": 3}, "B": {"C": 2}}  (with weights)
# {"A": [{"target": "B", "weight": 5}]}  (dict format in list)

# Output format example:
# nodes: [{"id": "A"}, {"id": "B"}, {"id": "C"}]
# edges: [{"source": "A", "target": "B"}, {"source": "A", "target": "C"}, {"source": "B", "target": "C"}]
# directed: true

# Steps:
# 1. Extract adjacency data
# 2. Collect all unique node IDs from sources and all targets
# 3. For each source node, iterate through its neighbors list/dict
#    Create edge objects with source and target, add weight if present
# 4. Return nodes list, edges list, and directed flag

import logging
from typing import Any, Dict, List, Optional, cast

from fastapi import HTTPException

from ...types import Edge, NetworkData, Node

logger = logging.getLogger(__name__)

class AdjacencyListConverter:
    @staticmethod
    def convert(data: Dict[str, Any], directed: Optional[bool] = None) -> NetworkData:
        if directed is None and "directed" in data:
            directed = data["directed"]
        
        # 1. Extract adjacency data
        if "adjacency" in data:
            adjacency = data["adjacency"]
        else:
            adjacency = {k: v for k, v in data.items() if k != "directed"}
        
        nodes_set = set()
        edges: List[Edge] = []
        
        # 2. Collect all unique node IDs from sources and all targets
        for source, targets in adjacency.items():
            nodes_set.add(str(source))
            
            # 3. For each source node, iterate through its neighbors list/dict
            #    Create edge objects with source and target, add weight if present
            if isinstance(targets, list):
                for target in targets:
                    if isinstance(target, dict):
                        if "target" not in target:
                            raise HTTPException(
                                status_code=422,
                                detail=f"Adjacency dict for '{source}' missing 'target'"
                            )
                        edge = cast(Edge, {"source": source, **target})
                        nodes_set.add(str(target["target"]))
                    else:
                        edge = cast(Edge, {"source": source, "target": target})
                        nodes_set.add(str(target))
                    
                    edges.append(edge)
                    
            elif isinstance(targets, dict):
                for target, value in targets.items():
                    nodes_set.add(str(target))
                    edge = cast(Edge, {"source": source, "target": target})
                    
                    if isinstance(value, (int, float)):
                        edge["weight"] = value
                    elif isinstance(value, dict):
                        edge.update(value)
                    
                    edges.append(edge)
            else:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid adjacency format for node '{source}'"
                )
        
        nodes: list[Node] = [{"id": node_id} for node_id in sorted(nodes_set)]
        
        logger.info(
            f"Converted adjacency list to node-link: {len(nodes)} nodes, "
            f"{len(edges)} edges"
        )
        
        result: NetworkData = {
            "nodes": nodes,
            "edges": edges,
            "directed": directed if directed is not None else True
        }
        
        return result