# Central registry that routes file parsing based on extension and converts all formats to my node-link format
# Supports file extensions: .json, .csv, .txt, .tsv, .graphml, .mtx

# Input: Raw file bytes and file extension

# Output format example:
# nodes: [{"id": "A"}, {"id": "B"}]
# edges: [{"source": "A", "target": "B", "weight": 5}]
# directed: true
# All formats are converted to this standardized node-link structure

# Steps:
# 1. Look up appropriate file parser based on extension (json/csv/txt/tsv/graphml/mtx)
# 2. Parse file content into raw data structure using file-specific parser
# 3. Use format detector to identify network format (node-link, edge-list, adjacency-list, adjacency-matrix)
# 4. if already node-link format: normalize field names ("links" -> "edges"), ensure "directed" field exists
# 5. if edge-list format: convert using EdgeListConverter
# 6. if adjacency-list format: convert using AdjacencyListConverter
# 7. if adjacency-matrix format: convert using AdjacencyMatrixConverter
# 8. Return standardized NetworkData with nodes, edges, and directed flag

import logging
from typing import Any, Dict, List, Union, cast

from fastapi import HTTPException

from ..types import NetworkData
from .file_format_parsers.base import FileFormatParser
from .file_format_parsers.graphml_parser import GraphMLParser
from .file_format_parsers.json_parser import JSONParser
from .file_format_parsers.mtx_parser import MTXParser
from .file_format_parsers.tabular_parser import CSVParser, TXTParser
from .format_detector import NetworkFormatDetector
from .network_format_parsers.adjacency_list import AdjacencyListConverter
from .network_format_parsers.adjacency_matrix import AdjacencyMatrixConverter
from .network_format_parsers.edge_list import EdgeListConverter

logger = logging.getLogger(__name__)

class NetworkParserRegistry:

    FILE_PARSERS: Dict[str, FileFormatParser] = {
        "json": JSONParser(),
        "csv": CSVParser(),
        "txt": TXTParser(),
        "tsv": CSVParser(),
        "graphml": GraphMLParser(),
        "mtx": MTXParser(),
    }
    
    @classmethod
    def parse_file(cls, content: bytes, file_extension: str) -> NetworkData:
        file_ext = file_extension.lower().lstrip(".")
        
        if file_ext not in cls.FILE_PARSERS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: .{file_ext}"
            )
        
        parser = cls.FILE_PARSERS[file_ext]
        raw_data: Union[Dict[str, Any], List[Any], NetworkData] = parser.parse(content)
        
        network_format, directed = NetworkFormatDetector.detect(raw_data)
        
        logger.info(f"Detected network format: {network_format}, directed: {directed}")
        
        if network_format == "node-link":
            if isinstance(raw_data, dict):
                if "links" in raw_data and "edges" not in raw_data:
                    raw_data["edges"] = raw_data.pop("links")
                
                if directed is not None:
                    raw_data["directed"] = directed
                elif "directed" not in raw_data:
                    raw_data["directed"] = True
            
            return cast(NetworkData, raw_data)
        
        elif network_format == "edge-list":
            return EdgeListConverter.convert(raw_data, directed)
        
        elif network_format == "adjacency-list":
            if isinstance(raw_data, dict) and "adjacency" in raw_data:
                adj_data = raw_data["adjacency"]
            else:
                adj_data = raw_data
            return AdjacencyListConverter.convert(adj_data, directed)
        
        elif network_format == "adjacency-matrix":
            return AdjacencyMatrixConverter.convert(raw_data, directed)
        
        else:
            raise HTTPException(
                status_code=422,
                detail=f"Could not detect network format in {file_ext} file"
            )