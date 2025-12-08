# Parses Matrix Market (.mtx) coordinate format files into my node-link format
# Supports: Sparse matrices in coordinate format (real, integer, pattern types), symmetric and general matrices

# Input example:
# %%MatrixMarket matrix coordinate real general
# 3 3 4
# 1 2 5.0
# 2 3 3.0
# 3 1 2.0
# First line: header, second line: rows cols entries, remaining: coments or row col value

# Output format example:
# nodes: [{"id": "n0"}, {"id": "n1"}, {"id": "n2"}]
# edges: [{"source": "n0", "target": "n1", "weight": 5.0}, {"source": "n1", "target": "n2", "weight": 3.0}]
# directed: true (or false for symmetric matrices)

# Steps:
# 1. Parse MatrixMarket header to determine matrix type, data type, and symmetry
# 2. Skip coment lines and read matrix dimensions (rows, cols, entries)
# 3. Create nodes with IDs "nX", etc. based on max(rows, cols)
# 4. Parse coordinate entries (row, col, optional weight) into edges
# 5. For symmetric matrix, create reverse edges
# 6. Return nodes, edges, and directed flag (directed=false for symmetric)

import logging
from typing import Any, Dict, List, cast

from fastapi import HTTPException

from ...types import Edge, Node
from .base import FileFormatParser

logger = logging.getLogger(__name__)

class MTXParser(FileFormatParser):
    def parse(self, content: bytes) -> Dict[str, Any]:
        try:
            # 1. Parse MatrixMarket header to determine matrix type, data type, and symmetry
            text = content.decode("utf-8")
            lines = text.strip().split("\n")
            
            if not lines:
                raise HTTPException(
                    status_code=400,
                    detail="Empty MTX file"
                )
            header = lines[0].strip()
            if not header.lstrip("%").startswith("MatrixMarket"):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid MTX file: missing MatrixMarket header"
                )
            
            header_parts = header.lstrip("%").split()
            if len(header_parts) < 4:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid MTX header format"
                )
            
            matrix_type = header_parts[1]
            format_type = header_parts[2]
            data_type = header_parts[3]
            symmetry = header_parts[4] if len(header_parts) > 4 else "general"
            
            if matrix_type != "matrix" or format_type != "coordinate":
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported MTX format: {matrix_type} {format_type}"
                )
            
            is_directed = (symmetry == "general")
            
            # 2. Skip coment lines and read matrix dimensions (rows, cols, entries)
            idx = 1
            while idx < len(lines) and lines[idx].startswith("%"):
                idx += 1
            
            if idx >= len(lines):
                raise HTTPException(
                    status_code=400,
                    detail="MTX file missing size specification"
                )
            
            size_line = lines[idx].strip().split()
            if len(size_line) < 3:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid MTX size line format"
                )
            
            num_rows = int(size_line[0])
            num_cols = int(size_line[1])
            
            idx += 1
            
            if num_rows != num_cols:
                logger.warning(f"Non-square matrix: {num_rows}x{num_cols}. Treating as bipartite.")
                
            # 3. Create nodes with IDs "nX", etc. based on max(rows, cols)
            num_nodes = max(num_rows, num_cols)
            nodes: List[Node] = [cast(Node, {"id": f"n{i}"}) for i in range(num_nodes)]
            
            # 4. Parse coordinate entries (row, col, optional weight) into edges
            edges: List[Edge] = []
            for line_num in range(idx, len(lines)):
                line = lines[line_num].strip()
                if not line or line.startswith("%"):
                    continue
                
                parts = line.split()
                if len(parts) < 2:
                    continue
                
                try:
                    row = int(parts[0]) - 1
                    col = int(parts[1]) - 1
                    
                    weight = None
                    if data_type in ("real", "integer") and len(parts) >= 3:
                        weight = float(parts[2]) if data_type == "real" else int(parts[2])
                    elif data_type == "pattern":
                        weight = 1.0
                    
                    source_id = f"n{row}"
                    target_id = f"n{col}"
                    
                    edge: Dict[str, Any] = {
                        "source": source_id,
                        "target": target_id
                    }
                    if weight is not None:
                        edge["weight"] = weight
                    
                    edges.append(cast(Edge, edge))
                    
                    # 5. For symmetric matrix, create reverse edges
                    if symmetry == "symmetric" and row != col:
                        reverse_edge: Dict[str, Any] = {
                            "source": target_id,
                            "target": source_id
                        }
                        if weight is not None:
                            reverse_edge["weight"] = weight
                        edges.append(cast(Edge, reverse_edge))
                        
                except (ValueError, IndexError) as e:
                    logger.warning(f"Skipping invalid MTX line {line_num + 1}: {line}")
                    continue
            
            logger.info(
                f"Parsed MTX ({data_type}, {symmetry}): "
                f"{len(nodes)} nodes, {len(edges)} edges, "
                f"directed: {is_directed}"
            )
            
            result = {
                "nodes": nodes,
                "edges": edges,
                "directed": is_directed
            }
            
            return result
            
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="MTX file encoding error: file must be UTF-8 text"
            )
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid MTX numeric value: {str(e)}"
            )
        except Exception as e:
            logger.exception("Error parsing MTX")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse MTX file: {str(e)}"
            )