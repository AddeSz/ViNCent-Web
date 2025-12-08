# Converts edge list format into my standardized node-link format
# Supports: Arrays [source, target, weight, timestep], dicts {source, target, weight, timestep}, mixed formats

# Input examples:
# [["A", "B", 5, 1], ["B", "C", 3, 0]]  (with optional weight and timestep)
# [{"source": "A", "target": "B", "weight": 5, "timestep": 0}]
# [["A", "B"], [0, 1, 2.5]]  (mixed string and numeric IDs)

# Output format example:
# nodes: [{"id": "A"}, {"id": "B"}, {"id": "C"}]
# edges: [{"source": "A", "target": "B", "weight": 5}, {"source": "B", "target": "C", "weight": 3, "timestep": 0}]
# directed: true

# creates nodes/edges per timestep

# Steps:
# 1. Sample first 10 edges to detect if using numeric indices and if temporal data exists
# 2. if numeric indices detected, convert node_id to "nX" format
# 3. For each edge, extract source, target, optional weight and optional timestep
# 4. Normalize node IDs and collect all unique nodes
# 5. if temporal: create separate node entries per timestep
#    if static: create single node entry per unique node ID
# 6. Return nodes list, edges list, and directed flag

import logging
from collections import defaultdict
from typing import Any, Dict, List, Optional, Union, cast

from fastapi import HTTPException

from ...types import Edge, NetworkData, Node

logger = logging.getLogger(__name__)

class EdgeListConverter:    
    @staticmethod
    def convert(data: Union[List[Any], Dict[str, Any]], directed: Optional[bool] = None) -> NetworkData:
        if isinstance(data, dict):
            if directed is None and "directed" in data:
                directed = data["directed"]
            
            if "edges" in data:
                edges = data["edges"]
            else:
                raise HTTPException(
                    status_code=422,
                    detail="Dict format must contain 'edges' key"
                )
        else:
            edges = data
        
        normalized_edges: List[Edge] = []
        uses_numeric_indices = False
        has_temporal_data = False
        
        # 1. Sample first 10 edges to detect if using numeric indices and if temporal data exists
        for edge in edges[:min(10, len(edges))]:
            if isinstance(edge, (list, tuple)) and len(edge) >= 2:
                if isinstance(edge[0], int) and isinstance(edge[1], int):
                    uses_numeric_indices = True
                if len(edge) >= 4 and isinstance(edge[3], (int, float)):
                    has_temporal_data = True
            elif isinstance(edge, dict):
                source = edge.get("source")
                target = edge.get("target")
                if isinstance(source, int) and isinstance(target, int):
                    uses_numeric_indices = True
                if "timestep" in edge:
                    has_temporal_data = True
                    
        # 2. if numeric indices detected, convert node_id to "nX" format
        def normalize_node_id(node_id: Any) -> str:
            if uses_numeric_indices and isinstance(node_id, int):
                return f"n{node_id}"
            return str(node_id)
        
        nodes_at_timestep = defaultdict(set)
        all_nodes = set()
        
        # 3. For each edge, extract source, target, optional weight and optional timestep
        for edge in edges:
            if isinstance(edge, dict):
                if "source" not in edge or "target" not in edge:
                    raise HTTPException(
                        status_code=422,
                        detail="Edge objects must contain 'source' and 'target' fields"
                    )
                
                source_id = normalize_node_id(edge["source"])
                target_id = normalize_node_id(edge["target"])
                
                edge_data = cast(Edge, edge.copy())
                edge_data["source"] = source_id
                edge_data["target"] = target_id
                
                all_nodes.add(source_id)
                all_nodes.add(target_id)
                
                if "timestep" in edge:
                    timestep = edge["timestep"]
                    nodes_at_timestep[timestep].add(source_id)
                    nodes_at_timestep[timestep].add(target_id)
                
            # 4. Normalize node IDs and collect all unique nodes
            elif isinstance(edge, (list, tuple)) and len(edge) >= 2:
                source_id = normalize_node_id(edge[0])
                target_id = normalize_node_id(edge[1])
                
                edge_data = cast(Edge, {
                    "source": source_id,
                    "target": target_id
                })
                
                all_nodes.add(source_id)
                all_nodes.add(target_id)
                
                if len(edge) >= 3:
                    edge_data["weight"] = edge[2]
                
                if len(edge) == 4:
                    if isinstance(edge[3], (int, float)):
                        edge_data["timestep"] = edge[3]
                        has_temporal_data = True
                        nodes_at_timestep[edge[3]].add(source_id)
                        nodes_at_timestep[edge[3]].add(target_id)
                elif len(edge) > 4:
                    edge_data["attributes"] = {
                        f"attr_{i}": edge[i] for i in range(3, len(edge))
                    }
                
            else:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid edge format: {edge}"
                )
            
            normalized_edges.append(edge_data)
        
        # 5. if temporal: create separate node entries per timestep
        #    if static: create single node entry per unique node ID
        if has_temporal_data:
            nodes: List[Node] = []
            for timestep in sorted(nodes_at_timestep.keys()):
                for node_id in sorted(nodes_at_timestep[timestep]):
                    nodes.append(cast(Node, {
                        "id": node_id,
                        "timestep": timestep
                    }))
            
            logger.info(
                f"Converted edge list to temporal format: "
                f"{len(all_nodes)} unique nodes across {len(nodes_at_timestep)} timesteps, "
                f"{len(normalized_edges)} edges"
            )
        else:
            nodes = [cast(Node, {"id": node_id}) for node_id in sorted(all_nodes)]
            
            logger.info(
                f"Converted edge list to node-link: {len(nodes)} nodes, "
                f"{len(normalized_edges)} edges"
            )
        
        result: NetworkData = {
            "nodes": nodes,
            "edges": normalized_edges,
            "directed": directed if directed is not None else True
        }
        
        return result