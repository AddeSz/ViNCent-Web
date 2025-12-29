import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Optional
from .datasets_registry import PRECOMPUTED_DIR, get_dataset_ids

logger = logging.getLogger(__name__)

CACHE_DIR = Path(os.environ.get("CACHE_DIR", "./cache"))
CACHE_ENABLED = os.environ.get("CACHE_ENABLED", "true").lower() == "true"


def get_precomputed_data(dataset_id: str) -> Optional[dict]:
    precomputed_file = PRECOMPUTED_DIR / f"{dataset_id}.json"
    
    try:
        if precomputed_file.exists():
            with open(precomputed_file, 'r') as f:
                data = json.load(f)
                logger.info(f"Precomputed data loaded: {dataset_id}")
                return data
        logger.debug(f"No precomputed data for: {dataset_id}")
        return None
    except Exception as e:
        logger.error(f"Error reading precomputed data for {dataset_id}: {e}")
        return None


def list_available_datasets() -> list[str]:
    return get_dataset_ids()


def get_cache_filename(dataset_id: str, endpoint: str = "all") -> str:
    key = f"{endpoint}:{dataset_id}"
    hash_key = hashlib.md5(key.encode()).hexdigest()
    return f"{hash_key}.json"


def get_from_cache(dataset_id: str, endpoint: str = "all") -> Optional[dict]:
    if not CACHE_ENABLED:
        return None

    cache_file = CACHE_DIR / get_cache_filename(dataset_id, endpoint)

    try:
        if cache_file.exists():
            with open(cache_file, 'r') as f:
                data = json.load(f)
                logger.info(f"Cache hit: {dataset_id} ({endpoint})")
                return data
        return None
    except Exception as e:
        logger.error(f"Cache read error for {dataset_id}: {e}")
        return None


def set_in_cache(dataset_id: str, data: dict, endpoint: str = "all") -> bool:
    if not CACHE_ENABLED:
        return False

    cache_file = CACHE_DIR / get_cache_filename(dataset_id, endpoint)

    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with open(cache_file, 'w') as f:
            json.dump(data, f)
        file_size_mb = cache_file.stat().st_size / 1024 / 1024
        logger.info(f"Cached: {dataset_id} ({endpoint}) - {file_size_mb:.2f} MB")
        return True
    except Exception as e:
        logger.error(f"Cache write error for {dataset_id}: {e}")
        return False


def clear_cache(dataset_id: Optional[str] = None):
    if not CACHE_ENABLED:
        return

    try:
        if dataset_id:
            for endpoint in ["all", "timestep"]:
                cache_file = CACHE_DIR / get_cache_filename(dataset_id, endpoint)
                if cache_file.exists():
                    cache_file.unlink()
                    logger.info(f"Cleared cache: {dataset_id} ({endpoint})")
        else:
            for cache_file in CACHE_DIR.glob("*.json"):
                cache_file.unlink()
            logger.info("Cleared all cache")
    except Exception as e:
        logger.error(f"Cache clear error: {e}")