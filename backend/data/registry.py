import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent
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


def get_dataset_path(dataset_id: str) -> Path:
    if dataset_id not in DATASETS:
        raise ValueError(f"Unknown dataset: {dataset_id}")
    return DATASETS[dataset_id]["path"]


def list_datasets() -> list[dict]:
    return [
        {
            "id": dataset_id,
            "name": info["name"],
            "description": info["description"],
            "size": info["size"]
        }
        for dataset_id, info in DATASETS.items()
    ]


def get_dataset_ids() -> list[str]:
    return list(DATASETS.keys())


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