from typing import Any, Dict, List, Optional, Set

from ..config import ALL_CENTRALITIES, ALL_COMMUNITY_ALGORITHMS

ALL_CENTRALITY_KEYS: Set[str] = {c.value for c in ALL_CENTRALITIES}
ALL_COMMUNITY_KEYS: Set[str] = {a.value for a in ALL_COMMUNITY_ALGORITHMS}


def _filter_entity_metrics(
    entities: Dict[str, Dict[str, Any]],
    selected_keys: List[str],
) -> Dict[str, Dict[str, Any]]:
    if not selected_keys:
        return {}

    selected_set = set(selected_keys)
    filtered: Dict[str, Dict[str, Any]] = {}
    for entity_id, metrics in entities.items():
        kept = {k: v for k, v in metrics.items() if k in selected_set}
        if kept:
            filtered[entity_id] = kept
    return filtered


def _filter_centralities(
    centralities_by_timestep: Dict[Any, Dict[str, Any]],
    selected_centralities: Optional[List[str]],
) -> Dict[Any, Dict[str, Any]]:
    if not selected_centralities:
        return {}

    return {
        timestep: {
            "nodes": _filter_entity_metrics(
                timestep_data.get("nodes", {}), selected_centralities
            ),
            "edges": _filter_entity_metrics(
                timestep_data.get("edges", {}), selected_centralities
            ),
        }
        for timestep, timestep_data in centralities_by_timestep.items()
    }


def _filter_communities(
    communities_by_timestep: Dict[Any, Dict[str, Any]],
    selected_communities: Optional[List[str]],
) -> Dict[Any, Dict[str, Any]]:
    if not selected_communities:
        return {}

    selected = set(selected_communities)
    return {
        timestep: {k: v for k, v in algorithms.items() if k in selected}
        for timestep, algorithms in communities_by_timestep.items()
    }


def filter_metrics_info(
    metrics: Dict[str, Any],
    selected_centralities: Optional[List[str]],
    selected_communities: Optional[List[str]],
) -> Dict[str, Any]:
    selected = set(selected_centralities or []) | set(selected_communities or [])

    filtered = {}
    for key, value in metrics.items():
        is_selectable = key in ALL_CENTRALITY_KEYS or key in ALL_COMMUNITY_KEYS
        if not is_selectable or key in selected:
            filtered[key] = value
    return filtered


def filter_computed_data(
    data: Dict[str, Any],
    centralities: Optional[List[str]],
    communities: Optional[List[str]],
) -> Dict[str, Any]:
    filtered_data = data.copy()

    filtered_data["centralities"] = _filter_centralities(
        data.get("centralities", {}), centralities
    )
    filtered_data["communities"] = _filter_communities(
        data.get("communities", {}), communities
    )

    if "metrics_info" in filtered_data:
        info = filtered_data["metrics_info"]
        filtered_data["metrics_info"] = {
            "nodes": filter_metrics_info(info.get("nodes", {}), centralities, communities),
            "edges": filter_metrics_info(info.get("edges", {}), centralities, communities),
        }

    return filtered_data