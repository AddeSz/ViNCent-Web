# Converts adjacency matrix format into my standardized node-link format
# Supports: 2D arrays (lists of lists), matrices with node labels, weighted and unweighted matrices

# Input examples:
# {"matrix": [[0, 1, 0], [1, 0, 1], [0, 1, 0]]}
# {"matrix": [[0, 5], [3, 0]], "nodes": ["A", "B"]}  (with labels and weights)

# Output format example:
# nodes: [{"id": "n0"}, {"id": "n1"}, {"id": "n2"}]  (or with provided labels: [{"id": "A"}, {"id": "B"}])
# edges: [{"source": "n0", "target": "n1", "weight": 1}, {"source": "n1", "target": "n0", "weight": 1}]
# directed: true

# Non-zero matrix values become edges, with the value as weight if not 1

# Steps:
# 1. extract matrix data and optional node labels from input dict or direct 2D aray
# 2. Validate matrix is square (NxN)
# 3. Detect if matrix is symmetric (undirected) when directed flag not specified
# 4. Use provided labels as node IDs, or generate "nX" etc. if no labels
# 5. for each non-zero value at [i][j], create edge from node i to node j
#    - for undirected graps, only process upper triangle (i < j) to avoid duplicates
# 6. skip zero, None, False, empty string values (treated as no edge)
# 7. Add weight to edge if value is not 1 or 1.0, otherwise include weight=1
# 8. Return nodes list, edges list, and directed flag

import logging
from typing import Any, Dict, List, Optional, Union, cast

from fastapi import HTTPException

from ...types import Edge, NetworkData, Node

logger = logging.getLogger(__name__)

class AdjacencyMatrixConverter:
    @staticmethod
    def _is_symmetric(matrix: List[List[Any]]) -> bool:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                val_ij = matrix[i][j]
                val_ji = matrix[j][i]
                
                def normalize(v):
                    if v in (0, None, False, "", 0.0):
                        return 0
                    if isinstance(v, (int, float)):
                        return float(v)
                    if isinstance(v, str):
                        try:
                            return float(v)
                        except ValueError:
                            return v
                    return v
                
                norm_ij = normalize(val_ij)
                norm_ji = normalize(val_ji)
                
                if norm_ij != norm_ji:
                    return False
        
        return True
    
    @staticmethod
    def convert(matrix_data: Union[List[List[Any]], Dict[str, Any]], directed: Optional[bool] = None) -> NetworkData:
        # 1. extract matrix data and optional node labels from input dict or direct 2D aray
        if isinstance(matrix_data, dict):
            if directed is None and "directed" in matrix_data:
                directed = matrix_data["directed"]
            
            if "matrix" not in matrix_data:
                raise HTTPException(
                    status_code=422,
                    detail="Adjacency matrix dict must contain 'matrix' field"
                )
            
            matrix = matrix_data["matrix"]
            node_labels = matrix_data.get("nodes", matrix_data.get("labels"))
            
            if not isinstance(matrix, list):
                raise HTTPException(
                    status_code=422,
                    detail="Matrix must be a 2D array"
                )
        else:
            matrix = matrix_data
            node_labels = None
        
        if not matrix or not isinstance(matrix, list):
            raise HTTPException(
                status_code=422,
                detail="Matrix must be a non-empty 2D array"
            )
        
        num_nodes = len(matrix)
        
        # 2. Validate matrix is square (NxN)
        for i, row in enumerate(matrix):
            if not isinstance(row, list):
                raise HTTPException(
                    status_code=422,
                    detail=f"Matrix row {i} must be an array"
                )
            if len(row) != num_nodes:
                raise HTTPException(
                    status_code=422,
                    detail=f"Matrix must be square: row {i} has {len(row)} elements, expected {num_nodes}"
                )
        
        # 3. Detect if matrix is symmetric (undirected) when directed flag not specified
        if directed is None:
            is_symmetric = AdjacencyMatrixConverter._is_symmetric(matrix)
            directed = not is_symmetric
            logger.info(f"Matrix symmetry detected: symmetric={is_symmetric}, setting directed={directed}")
        
        # 4. use provided labels as nodeIDs, or generate "nX" etc. if no labels
        if node_labels:
            if len(node_labels) != num_nodes:
                raise HTTPException(
                    status_code=422,
                    detail=f"Number of node labels ({len(node_labels)}) must match matrix size ({num_nodes})"
                )
            node_ids = [str(label) for label in node_labels]
        else:
            node_ids = [f"n{i}" for i in range(num_nodes)]
        
        nodes: List[Node] = [cast(Node, {"id": node_id}) for node_id in node_ids]
        
        edges: List[Edge] = []
        has_weights = False
        
        # 5. for each non-zero value at [i][j], create edge from node i to node j
        #    for undirected graphs, only process upper triangle (i < j) to avoid duplicates
        for i in range(num_nodes):
            start_j = i + 1 if not directed else 0
            
            for j in range(start_j, num_nodes):
                value = matrix[i][j]
                
                # 6. skip zero, None, False, empty string values (treated as no edge)
                if value in (0, None, False, "", 0.0):
                    continue
                
                source_id = node_ids[i]
                target_id = node_ids[j]
                
                edge = cast(Edge, {
                    "source": source_id,
                    "target": target_id
                })
                
                # 7. Add weight to edge if value is not 1 or 1.0, otherwise include weight=1
                if isinstance(value, (int, float)):
                    if value != 1 and value != 1.0:
                        edge["weight"] = value
                        has_weights = True
                    elif value == 1 or value == 1.0:
                        edge["weight"] = value
                elif isinstance(value, bool) and value:
                    pass
                elif isinstance(value, str):
                    try:
                        numeric_value = float(value)
                        if numeric_value != 1.0:
                            edge["weight"] = numeric_value
                            has_weights = True
                    except ValueError:
                        pass
                else:
                    pass
                
                edges.append(edge)
         
        logger.info(
            f"Converted adjacency matrix to node-link: {len(nodes)} nodes, "
            f"{len(edges)} edges (weighted: {has_weights}, directed: {directed})"
        )
        
        # 8. Return nodes list, edges list, and directed flag
        result: NetworkData = {
            "nodes": nodes,
            "edges": edges,
            "directed": directed
        }
        
        return result