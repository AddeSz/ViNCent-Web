import hashlib
import json
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

CACHE_DIR = Path(os.environ.get("CACHE_DIR", "./cache"))
CACHE_ENABLED = os.environ.get("CACHE_ENABLED", "true").lower() == "true"

# -------------------- OUTDATED -------------------

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
        logger.info(f"Cache miss: {dataset_id} ({endpoint})")
        return None
    except Exception as e:
        logger.error(f"Cache read error for {dataset_id}: {e}")
        return None


def set_in_cache(dataset_id: str, data: dict, endpoint: str = "all") -> bool:
    if not CACHE_ENABLED:
        return False

    cache_file = CACHE_DIR / get_cache_filename(dataset_id, endpoint)

    try:
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
