import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

COMPUTED_DIR = Path(__file__).parent.parent / "data" / "computed"

def list_datasets() -> list[str]:
    if not COMPUTED_DIR.exists():
        return []
    return [f.stem for f in sorted(COMPUTED_DIR.glob("*.json"))]

def get_computed_data(dataset_id: str) -> Optional[dict]:
    computed_file = COMPUTED_DIR / f"{dataset_id}.json"
    try:
        if computed_file.exists():
            with open(computed_file, 'r') as f:
                data = json.load(f)
                logger.info(f"Computed data loaded: {dataset_id}")
                return data
        logger.debug(f"No computed data for: {dataset_id}")
        return None
    except Exception as e:
        logger.error(f"Error reading computed data for {dataset_id}: {e}")
        return None