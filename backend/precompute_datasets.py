import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from datasets_registry import DATASETS, PRECOMPUTED_DIR
from src.config import ALL_CENTRALITIES, ALL_COMMUNITY_ALGORITHMS
from src.parsers import parse_network_file
from src.preprocessing import process_network

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def precompute_all_datasets():
    
    PRECOMPUTED_DIR.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Found {len(DATASETS)} datasets to precompute")
    
    for dataset_id, dataset_info in DATASETS.items():
        dataset_path = dataset_info["path"]
        logger.info(f"Processing: {dataset_id} ({dataset_info['name']})")
        
        if not dataset_path.exists():
            logger.error(f"Dataset file not found: {dataset_path}")
            continue
        
        try:
            with open(dataset_path, 'rb') as f:
                content = f.read()
            
            file_extension = dataset_path.suffix.lstrip('.')
            data = parse_network_file(content, file_extension)
            
            processed = process_network(
                data,
                centralities=list(ALL_CENTRALITIES),
                community_algorithms=list(ALL_COMMUNITY_ALGORITHMS)
            )
            
            output_path = PRECOMPUTED_DIR / f"{dataset_id}.json"
            with open(output_path, 'w') as f:
                json.dump(processed, f)
            
            file_size_mb = output_path.stat().st_size / 1024 / 1024
            logger.info(f"Saved {dataset_id} - {file_size_mb:.2f} MB")
            
        except Exception as e:
            logger.error(f"Failed to process {dataset_id}: {e}", exc_info=True)


if __name__ == "__main__":
    precompute_all_datasets()