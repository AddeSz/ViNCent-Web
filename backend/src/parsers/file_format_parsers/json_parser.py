# Parses JSON files into my node-link format, supporting various graph representations
# Supports: Edge lists (arrays), node-link format (objects with nodes/edges), adjacency lists, adjacency matrices

# Input example:
# [["A", "B", 5], ["B", "C", 3]]  (edge list)
# {"nodes": [...], "edges": [...], "directed": true}  (node-link)
# {"adjacency": {"A": ["B", "C"]}}  (adjacency list)
# {"matrix": [[0, 1], [1, 0]]}  (adjacency matrix)

# Output format example:
# {"edges": [{"source": "A", "target": "B", "weight": 5}]}  (gets converted by format detector)
# or returns the dict as-is if already valid

import json
import logging
from typing import Any, Dict

from fastapi import HTTPException

from .base import FileFormatParser

logger = logging.getLogger(__name__)

class JSONParser(FileFormatParser):
    def parse(self, content: bytes) -> Dict[str, Any]:
        try:
            data = json.loads(content)
            
            if isinstance(data, list):
                return {"edges": data}
            elif isinstance(data, dict):
                return data
            else:
                raise HTTPException(
                    status_code=400,
                    detail="JSON must be an object or array"
                )
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid JSON format: {str(e)}"
            )