# Parses tabular files (CSV, TSV, TXT) into my node-link format, supporting multiple graph representations
# Supports: Edge lists (source, target, weight, timestep), adjacency lists (node followed by neighbors), adjacency matrices (2D grid of weights)

# Input examples
# (edge list):
# # directed
# A,B,5
# B,C,3

# (adjacency matrix):
# ,A,B,C
# A,0,1,0
# B,1,0,1
# C,0,1,0

# (adjacency list):
# A B C
# B C
# C A

# Output format examples: (matches json formats)
# {"edges": [["A", "B", 5], ["B", "C", 3]], "directed": true}  (converted by registry later)
# {"matrix": [[0,1,0],[1,0,1],[0,1,0]], "nodes": ["A","B","C"]}  (converted by registry later)
# {"adjacency": {"A": ["B", "C"], "B": ["C"]}}  (converted by registry  later)

# Steps:
# 1. Extract directed flag from comment lines
# 2. Parse CSV/TXT into rows, skip comment lines starting with #
# 3. Detect format: matrix (square grid with mostly numeric values), edge list (2-4 columns), adjacency list (node + neighbors)
#    For matrxies: detect row/column labels, validate square shape (within 2 rows/cols difference), extract numeric matrix and node labels
#    For edge lists: parse source (col 0), target (col 1), optional weight (col 2), optional timestep (col 3)
#    For adjacency lists: validate node ID consistency (all numeric or all non-numeric), create neighbor mappings, ignore invalid neighbors
# 4. Return data dict with directed flag if extracted from comments

import csv
import io
import logging
from typing import Any, Dict, List, Optional, Union

from fastapi import HTTPException

from .base import FileFormatParser

logger = logging.getLogger(__name__)


class TabularParserBase(FileFormatParser):
    def _extract_directed_flag(self, lines: List[str]) -> Optional[bool]:
        for line in lines:
            line_stripped = line.strip().lower()
            if line_stripped.startswith("#"):
                if "undirected" in line_stripped:
                    return False
                elif "directed" in line_stripped:
                    return True
            else:
                break
        return None
    
    # 3. Detect format: matrix (square grid with mostly numeric values), edge list (2-4 columns), adjacency list (node + neighbors)
    #    For matrxies: detect row/column labels, validate square shape (within 2 rows/cols difference), extract numeric matrix and node labels
    #    For edge lists: parse source, target , optional weight, optional timestep
    #    For adjacency lists: validate node ID consistency (all numeric or all non-numeric), create neighbor mappings, ignore invalid neighbors
    def _parse_rows(self, rows: List[List[str]], directed: Optional[bool] = None) -> Dict[str, Any]:
        if not rows:
            raise HTTPException(status_code=400, detail="Empty file")
        
        result: Union[Dict[str, Any], List[Any]]
        
        
        if self._looks_like_matrix(rows):
            result = self._parse_matrix_format(rows)
        elif self._is_edge_or_adj_header(rows[0]):
            header = rows[0]
            data_rows = rows[1:]
            
            if not data_rows:
                raise HTTPException(
                    status_code=400, 
                    detail="File contains only header, no data"
                )
            
            if len(data_rows[0]) > 2 and not self._looks_numeric(data_rows[0][2]):
                result = self._parse_adjacency_format(data_rows)
            else:
                result = self._parse_edge_format(data_rows)
        else:
            data_rows = rows
            
            if len(data_rows[0]) > 2 and not self._looks_numeric(data_rows[0][2]):
                result = self._parse_adjacency_format(data_rows)
            else:
                result = self._parse_edge_format(data_rows)
        
        if isinstance(result, list):
            result = {"edges": result}
        
        if directed is not None:
            result["directed"] = directed
        
        return result
    
    def _is_edge_or_adj_header(self, parts: List[str]) -> bool:
        header_keywords = {
            "source", "target", "src", "dst", "from", "to",
            "node", "neighbor", "weight", "value", "timestep"
        }
        return any(part.lower() in header_keywords for part in parts[:2])
    
    def _looks_numeric(self, value: str) -> bool:
        try:
            float(value)
            return True
        except ValueError:
            return False
    
    def _looks_like_matrix(self, rows: List[List[str]]) -> bool:
        if len(rows) < 3:
            return False
        
        row_lengths = [len(row) for row in rows]
        if len(set(row_lengths)) != 1:
            return False
        
        num_rows = len(rows)
        num_cols = row_lengths[0]
        
        if num_cols < 3:
            return False
        
        format_info = self._detect_matrix_format(rows)
        if not format_info:
            return False
        
        has_row_labels = format_info["has_row_labels"]
        has_col_labels = format_info["has_col_labels"]
        
        if has_row_labels and has_col_labels:
            matrix_rows = num_rows - 1
            matrix_cols = num_cols - 1
        elif has_row_labels:
            matrix_rows = num_rows
            matrix_cols = num_cols - 1
        elif has_col_labels:
            matrix_rows = num_rows - 1
            matrix_cols = num_cols
        else:
            matrix_rows = num_rows
            matrix_cols = num_cols
        
        if abs(matrix_rows - matrix_cols) > 2:
            return False
        
        return True
     
    def _detect_matrix_format(self, rows: List[List[str]]) -> Optional[Dict[str, Any]]:
        num_rows = len(rows)
        num_cols = len(rows[0])
        
        first_row_rest = rows[0][1:]
        has_col_labels = len(first_row_rest) > 0 and all(not self._looks_numeric(cell) for cell in first_row_rest)

        start_row = 1 if has_col_labels else 0
        first_col_data = [rows[i][0] for i in range(start_row, num_rows)]
        has_row_labels = len(first_col_data) > 0 and all(not self._looks_numeric(cell) for cell in first_col_data)
        
        matrix_start_row = 1 if has_col_labels else 0
        matrix_start_col = 1 if has_row_labels else 0
        
        numeric_count = 0
        total_count = 0
        
        for i in range(matrix_start_row, num_rows):
            for j in range(matrix_start_col, num_cols):
                total_count += 1
                if self._looks_numeric(rows[i][j]):
                    numeric_count += 1
        
        if total_count == 0:
            return None
        
        if numeric_count / total_count < 0.8:
            return None
        
        if has_row_labels and has_col_labels:
            col_labels = [cell.strip() for cell in rows[0][1:]]
            row_labels = [rows[i][0].strip() for i in range(1, num_rows)]
            
            if len(col_labels) != len(row_labels):
                return None
            
            if col_labels != row_labels:
                return None
        
        return {
            "has_row_labels": has_row_labels,
            "has_col_labels": has_col_labels
        }
    
    def _parse_matrix_format(self, rows: List[List[str]]) -> Dict[str, Any]:
        format_info = self._detect_matrix_format(rows)
        if not format_info:
            raise HTTPException(
                status_code=400,
                detail="Could not parse adjacency matrix format"
            )
        
        has_row_labels = format_info["has_row_labels"]
        has_col_labels = format_info["has_col_labels"]
        
        logger.info(f"Matrix format detected: row_labels={has_row_labels}, col_labels={has_col_labels}")
        
        row_labels: List[str] = []
        col_labels: Optional[List[str]] = None
        matrix_data: List[List[str]] = []
        
        matrix_start_row = 1 if has_col_labels else 0
        
        if has_col_labels:
            if has_row_labels:
                col_labels = [cell.strip() for cell in rows[0][1:]]
            else:
                col_labels = [cell.strip() for cell in rows[0]]
        
        for i in range(matrix_start_row, len(rows)):
            if has_row_labels:
                row_labels.append(rows[i][0].strip())
                matrix_data.append(rows[i][1:])
            else:
                matrix_data.append(rows[i])
        
        if not matrix_data:
            raise HTTPException(
                status_code=400,
                detail="Adjacency matrix has no data rows"
            )
        
        matrix_num_cols = len(matrix_data[0])
        if any(len(row) != matrix_num_cols for row in matrix_data):
            raise HTTPException(
                status_code=400,
                detail="Adjacency matrix rows have inconsistent lengths"
            )
        
        if has_row_labels and has_col_labels:
            if col_labels is None or len(row_labels) != len(col_labels):
                raise HTTPException(
                    status_code=400,
                    detail=f"Row labels ({len(row_labels)}) and column labels ({len(col_labels) if col_labels else 0}) must have same length"
                )
            
            if row_labels != col_labels:
                raise HTTPException(
                    status_code=400,
                    detail="Row labels and column labels must match exactly for symmetric adjacency matrix"
                )
        
        matrix: List[List[float]] = []
        for i, row in enumerate(matrix_data):
            matrix_row: List[float] = []
            for j, val in enumerate(row):
                val_stripped = val.strip()
                if val_stripped == "" or val_stripped.lower() in ("none", "null"):
                    matrix_row.append(0)
                else:
                    try:
                        matrix_row.append(float(val_stripped))
                    except ValueError:
                        matrix_row.append(0)
            matrix.append(matrix_row)
        
        node_labels: Optional[List[str]] = None
        if has_row_labels and row_labels:
            node_labels = row_labels
        elif col_labels:
            node_labels = col_labels
        
        result: Dict[str, Any] = {"matrix": matrix}
        if node_labels:
            result["nodes"] = node_labels
        
        logger.info(
            f"Parsed adjacency matrix: {len(matrix)}x{len(matrix[0])} "
            f"(node_labels: {node_labels is not None})"
        )
        
        return result
    
    def _parse_edge_format(self, lines: List[List[str]]) -> List[List[Union[str, float, int]]]:
        edges: List[List[Union[str, float, int]]] = []
        for parts in lines:
            if len(parts) >= 2:
                edge: List[Union[str, float, int]] = [parts[0], parts[1]]
                if len(parts) >= 3:
                    try:
                        edge.append(float(parts[2]))
                    except ValueError:
                        pass
                if len(parts) >= 4:
                    try:
                        edge.append(int(parts[3]))
                    except ValueError:
                        pass
                edges.append(edge)
        return edges
    
    def _parse_adjacency_format(self, lines: List[List[str]]) -> Dict[str, List[str]]:
        adjacency: Dict[str, List[str]] = {}
        all_node_ids: set[str] = set()
        
        for parts in lines:
            if len(parts) >= 1:
                node = parts[0]
                all_node_ids.add(node)
        
        if not all_node_ids:
            raise HTTPException(
                status_code=400,
                detail="Adjacency list has no nodes"
            )
        
        numeric_nodes = [node for node in all_node_ids if self._looks_numeric(node)]
        non_numeric_nodes = [node for node in all_node_ids if not self._looks_numeric(node)]
        
        if numeric_nodes and non_numeric_nodes:
            raise HTTPException(
                status_code=400,
                detail=f"Adjacency list has mixed node ID types: {len(numeric_nodes)} numeric, {len(non_numeric_nodes)} non-numeric. All node IDs must be consistently numeric or non-numeric."
            )
        
        for parts in lines:
            if len(parts) >= 1:
                node = parts[0]
                
                if len(parts) >= 2:
                    raw_neighbors = [n for n in parts[1:] if n.strip()]
                    valid_neighbors = []
                    
                    for neighbor in raw_neighbors:
                        if neighbor in all_node_ids:
                            valid_neighbors.append(neighbor)
                        else:
                            logger.debug(f"Ignoring neighbor '{neighbor}' for node '{node}' - not in node list")
                    
                    adjacency[node] = valid_neighbors
                else:
                    adjacency[node] = []
        
        logger.info(
            f"Parsed adjacency list: {len(adjacency)} nodes, "
            f"node type: {'numeric' if numeric_nodes else 'non-numeric'}"
        )
        
        return adjacency


class CSVParser(TabularParserBase):    
    def parse(self, content: bytes) -> Dict[str, Any]:
        try:
            text = content.decode("utf-8")
            lines = text.split("\n")
            
            # 1. Extract directed flag from comment lines
            directed = self._extract_directed_flag(lines)
            
            # 2. Parse CSV/TXT into rows, skip comment lines starting with #
            reader = csv.reader(io.StringIO(text))
            rows = [row for row in reader if row and not row[0].startswith("#")]
            
            return self._parse_rows(rows, directed)
                
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="CSV encoding error: file must be UTF-8"
            )


class TXTParser(TabularParserBase):    
    def parse(self, content: bytes) -> Dict[str, Any]:
        try:
            text = content.decode("utf-8")
            lines = text.split("\n")
            # 1. Extract directed flag from comment lines
            directed = self._extract_directed_flag(lines)
            
            # 2. Parse CSV/TXT into rows, skip comment lines starting with #
            data_lines = [
                line.strip() 
                for line in lines 
                if line.strip() and not line.strip().startswith("#")
            ]
            
            if not data_lines:
                raise HTTPException(status_code=400, detail="Empty text file")
            
            rows = [line.split() for line in data_lines]
            
            return self._parse_rows(rows, directed)
                
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Text file encoding error: file must be UTF-8"
            )