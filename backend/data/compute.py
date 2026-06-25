import json
import logging
from pathlib import Path

from src.config import ALL_CENTRALITIES, ALL_COMMUNITY_ALGORITHMS
from src.parsers import parse_network_file
from src.preprocessing import process_network

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
ORIGINAL_DIR = DATA_DIR / "original"
COMPUTED_DIR = DATA_DIR / "computed"

DATASETS = {
    "starwars": {
        "path": ORIGINAL_DIR / "starwars-interactions" / "starwars_network.json",
        "name": "Star Wars Character Interactions",
        "description": "Network of character interactions from Star Wars movies",
        "size": "small"
    },
    "les_miserables": {
        "path": ORIGINAL_DIR / "les-miserables" / "les_miserables_network.json",
        "name": "Les Misérables",
        "description": "Character co-appearance network from Les Misérables",
        "size": "small"
    },
    "test_small": {
        "path": ORIGINAL_DIR / "synthetic" / "network_n150.json",
        "name": "Small Test Network",
        "description": "Small synthetic network (150 nodes)",
        "size": "small"
    },
    "small_cluster": {
        "path": ORIGINAL_DIR / "synthetic" / "network_n500_l1500.json",
        "name": "Small Clustered Network",
        "description": "Small clustered synthetic network (500 nodes, 1500 links)",
        "size": "medium"
    },
    "large_cluster": {
        "path": ORIGINAL_DIR / "synthetic" / "network_clustered_1000_2000.json",
        "name": "Large Clustered Network",
        "description": "Large clustered synthetic network (1000 nodes, 2000 links)",
        "size": "medium"
    },
    # "massive_cluster": {
    #     "path": ORIGINAL_DIR / "synthetic" / "network_clustered_n4000_l10000.json",
    #     "name": "Massive Clustered Network",
    #     "description": "Massive clustered synthetic network (4000 nodes, 10000 links)",
    #     "size": "large"
    # },
    #     "co_author": {
    #     "path": ORIGINAL_DIR / "co_author" / "co_author_network.json",
    #     "name": "Co-Author Network",
    #     "description": "Academic co-authorship network (5000+ nodes, 16000+ links)",
    #     "size": "large"
    # },
}

def compute_all_datasets():
    COMPUTED_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Found {len(DATASETS)} datasets to compute")

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

            output_path = COMPUTED_DIR / f"{dataset_id}.json"
            with open(output_path, 'w') as f:
                json.dump(processed, f)

            file_size_mb = output_path.stat().st_size / 1024 / 1024
            logger.info(f"Saved {dataset_id} - {file_size_mb:.2f} MB")

        except Exception as e:
            logger.error(f"Failed to process {dataset_id}: {e}", exc_info=True)

if __name__ == "__main__":
    compute_all_datasets()