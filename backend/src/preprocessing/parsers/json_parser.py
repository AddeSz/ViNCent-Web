import json
import logging
from typing import Any, Dict

from fastapi import HTTPException

logger = logging.getLogger(__name__)


def parse_json_to_network(content: bytes) -> Dict[str, Any]:
    try:
        data = json.loads(content)
        logger.info("Successfully parsed JSON network data")
        return data
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except Exception as e:
        logger.exception("Error parsing JSON")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse JSON file: {str(e)}"
        )