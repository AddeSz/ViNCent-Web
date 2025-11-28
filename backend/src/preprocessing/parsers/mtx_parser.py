import logging
from typing import Any, Dict

from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Format link: https://networkrepository.com/mtx-matrix-market-format.html 
# MTX format is a simple text format for storing sparse matrices, it represents the adjacency matrix.
# Format:
#   Header line: %MatrixMarket matrix coordinate [real|integer|pattern] [general|symmetric]
#   Coment lines: start with %
#   Size line: rows cols entries
#   Data lines: row col [value]

def parse_mtx_to_network(content: bytes) -> Dict[str, Any]:
    try:
        text = content.decode("utf-8")
        lines = text.strip().split("\n")
        
        if not lines:
            raise HTTPException(
                status_code=400,
                detail="Empty MTX file"
            )
        
        #header can start with % or %%
        header = lines[0].strip()
        if not header.startswith("%MatrixMarket"):
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
        
        object_type = header_parts[0] 
        matrix_type = header_parts[1]
        format_type = header_parts[2]
        data_type = header_parts[3]
        symmetry = header_parts[4] if len(header_parts) > 4 else "general"
        
        if matrix_type != "matrix" or format_type != "coordinate":
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported MTX format: {matrix_type} {format_type}"
            )
        
        # skip coment lines
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
        num_entries = int(size_line[2])
        
        idx += 1
        
        if num_rows != num_cols:
            logger.warning(f"Non-square matrix: {num_rows}x{num_cols}. Treating as bipartite.")
        
        num_nodes = max(num_rows, num_cols)
        nodes = [{"id": f"n{i}"} for i in range(num_nodes)]
        
        links = []
        node_set = set()
        
        for line_num in range(idx, len(lines)):
            line = lines[line_num].strip()
            if not line or line.startswith("%"):
                continue
            
            parts = line.split()
            if len(parts) < 2:
                continue
            
            try:
                row = int(parts[0]) - 1  #MTX uses 1-based indexing
                col = int(parts[1]) - 1
                
                weight = None
                if data_type in ("real", "integer") and len(parts) >= 3:
                    weight = float(parts[2]) if data_type == "real" else int(parts[2])
                elif data_type == "pattern":
                    weight = 1.0
                
                source_id = f"n{row}"
                target_id = f"n{col}"
                
                node_set.add(source_id)
                node_set.add(target_id)
                
                edge = {
                    "source": source_id,
                    "target": target_id
                }
                if weight is not None:
                    edge["weight"] = weight
                
                links.append(edge)
                
                # Symmetric: add reverse edge but not self-loops
                if symmetry == "symmetric" and row != col:
                    reverse_edge = {
                        "source": target_id,
                        "target": source_id
                    }
                    if weight is not None:
                        reverse_edge["weight"] = weight
                    links.append(reverse_edge)
                    
            except (ValueError, IndexError) as e:
                logger.warning(f"Skipping invalid MTX line {line_num + 1}: {line}")
                continue
        
        #Potentially: filter nodes to only those that appear in edges
        #if node_set:
        #    nodes = [{"id": node_id} for node_id in sorted(node_set)]
        
        logger.info(
            f"Parsed MTX ({data_type}, {symmetry}): "
            f"{len(nodes)} nodes, {len(links)} edges"
        )
        
        return {
            "nodes": nodes,
            "links": links
        }
        
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