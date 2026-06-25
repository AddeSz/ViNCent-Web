import json
import logging
import os
from typing import Optional

from celery.result import AsyncResult
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import (ALL_CENTRALITIES, ALL_COMMUNITY_ALGORITHMS,
                     CENTRALITY_CATEGORIES, CENTRALITY_DESCRIPTIONS,
                     CENTRALITY_PERFORMANCE, CENTRALITY_REQUIREMENTS,
                     COMMUNITY_CATEGORIES, COMMUNITY_DESCRIPTIONS,
                     COMMUNITY_PERFORMANCE, COMMUNITY_REQUIREMENTS)
from .parsers import parse_network_file
from .preprocessing import process_network
from .registry import get_computed_data, list_datasets
from .types import CentralityType, CommunityType
from .worker import celery_app, process_network_task

logging.basicConfig(
    level=logging.DEBUG,
    format="[%(levelname)s] %(name)s: %(message)s"
)
logging.getLogger("python_multipart.multipart").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)

app = FastAPI(title="Centrality API", version="1.0.0")
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/get-options")
async def get_options():
    try:
        centralities_data = {
            "all": [c.value for c in ALL_CENTRALITIES],
            "categories": {
                category: [c.value for c in centralities]
                for category, centralities in CENTRALITY_CATEGORIES.items()
            },
            "requirements": {
                centrality_type.value: requirement_text
                for centrality_type, requirement_text in CENTRALITY_REQUIREMENTS.items()
            },
            "performance": {
                centrality_type.value: warning_text
                for centrality_type, warning_text in CENTRALITY_PERFORMANCE.items()
            },
            "descriptions": {
                centrality_type.value: desc
                for centrality_type, desc in CENTRALITY_DESCRIPTIONS.items()
            }
        }
        
        communities_data = {
            "all": [algo.value for algo in ALL_COMMUNITY_ALGORITHMS],
            "categories": {
                category: [algo.value for algo in algorithms]
                for category, algorithms in COMMUNITY_CATEGORIES.items()
            },
            "requirements": {
                algo.value: requirement_text
                for algo, requirement_text in COMMUNITY_REQUIREMENTS.items()
            },
            "performance": {
                algo.value: warning_text
                for algo, warning_text in COMMUNITY_PERFORMANCE.items()
            },
            "descriptions": {
                algo.value: desc
                for algo, desc in COMMUNITY_DESCRIPTIONS.items()
            }
        }
        
        options_data = {
            "centralities": centralities_data,
            "communities": communities_data,
            "datasets": list_datasets()
        }
        
        return JSONResponse(content=options_data)
    except Exception as e:
        logger.error(f"Error fetching options: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch options: {str(e)}"
        )
        
@app.post("/process-network")
async def process_network_api(
    file: UploadFile = File(...),
    centralities: str = Form(default="[]"),
    communities: str = Form(default="[]")
):
    try:
        content = await file.read()
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No filename provided"
            )
            
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        
        data = parse_network_file(content, file_extension)
        
        selected_centralities = []
        try:
            centralities_list = json.loads(centralities)
            if centralities_list:
                selected_centralities = [
                    CentralityType(c) for c in centralities_list
                    if c in [ct.value for ct in CentralityType]
                ]
            else:
                selected_centralities = []
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse centralities, defaulting to empty: {e}")
            selected_centralities = []
        
        selected_communities = []
        try:
            communities_list = json.loads(communities)
            if communities_list:
                selected_communities = [
                    algo for algo in communities_list
                    if algo in [a.value for a in ALL_COMMUNITY_ALGORITHMS]
                ]
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse communities, defaulting to empty: {e}")
            selected_communities = []
        
        processed = process_network(
            data, 
            selected_centralities,
            selected_communities
        )

        return JSONResponse(content=processed)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in validate_network: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process network: {str(e)}"
        )

def filter_metrics_info(
    metrics: dict,
    selected_centralities: list[str] | None,
    selected_communities: list[str] | None,
) -> dict:
    selected_centralities = selected_centralities or []
    selected_communities = selected_communities or []

    all_selected = set(selected_centralities + selected_communities)

    all_centrality_keys = {c.value for c in ALL_CENTRALITIES}
    all_community_keys = {a.value for a in ALL_COMMUNITY_ALGORITHMS}

    filtered = {}

    for key, value in metrics.items():
        is_centrality = key in all_centrality_keys
        is_community = key in all_community_keys

        if not is_centrality and not is_community:
            filtered[key] = value
            continue

        if key in all_selected:
            filtered[key] = value

    return filtered


def filter_computed_data(
    data: dict,
    centralities: list[str] | None,
    communities: list[str] | None,
) -> dict:
    filtered_data = data.copy()

    if "centralities" in filtered_data:
        filtered_centralities = {}

        for timestep, timestep_data in filtered_data["centralities"].items():
            filtered_timestep = {}

            if "nodes" in timestep_data:
                if centralities:
                    filtered_nodes = {}
                    for node_id, node_data in timestep_data["nodes"].items():
                        filtered_node = {
                            k: v for k, v in node_data.items() if k in centralities
                        }
                        if filtered_node:
                            filtered_nodes[node_id] = filtered_node
                    filtered_timestep["nodes"] = filtered_nodes
                else:
                    filtered_timestep["nodes"] = {}

            if "edges" in timestep_data:
                if centralities:
                    filtered_edges = {}
                    for edge_id, edge_data in timestep_data["edges"].items():
                        filtered_edge = {
                            k: v for k, v in edge_data.items() if k in centralities
                        }
                        if filtered_edge:
                            filtered_edges[edge_id] = filtered_edge
                    filtered_timestep["edges"] = filtered_edges
                else:
                    filtered_timestep["edges"] = {}

            filtered_centralities[timestep] = filtered_timestep

        filtered_data["centralities"] = filtered_centralities

    if "communities" in filtered_data:
        filtered_communities = {}

        for timestep, timestep_data in filtered_data["communities"].items():
            if communities:
                filtered_communities[timestep] = {
                    k: v for k, v in timestep_data.items() if k in communities
                }
            else:
                filtered_communities[timestep] = {}

        filtered_data["communities"] = filtered_communities

    if "metrics_info" in filtered_data:
        if "nodes" in filtered_data["metrics_info"]:
            filtered_data["metrics_info"]["nodes"] = filter_metrics_info(
                filtered_data["metrics_info"]["nodes"],
                centralities,
                communities,
            )

        if "edges" in filtered_data["metrics_info"]:
            filtered_data["metrics_info"]["edges"] = filter_metrics_info(
                filtered_data["metrics_info"]["edges"],
                centralities,
                communities,
            )
            
    return filtered_data


@app.get("/dataset/{dataset_id}")
async def get_dataset(
    dataset_id: str,
    centralities: Optional[str] = Query(
        None, description="Comma-separated list of centrality measures"
    ),
    communities: Optional[str] = Query(
        None, description="Comma-separated list of community detection algorithms"
    ),
):
    try:
        data = get_computed_data(dataset_id)

        if data is None:
            raise HTTPException(
                status_code=404,
                detail=f"Dataset '{dataset_id}' not found in computed data"
            )

        centralities_list = centralities.split(",") if centralities else None
        communities_list = communities.split(",") if communities else None

        logger.info(
            f"Filtering dataset {dataset_id} - "
            f"centralities: {centralities_list}, communities: {communities_list}"
        )

        data = filter_computed_data(
            data,
            centralities_list,
            communities_list,
        )

        return JSONResponse(content=data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching dataset {dataset_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dataset: {str(e)}"
        )

# Testing task queue
@app.post("/process-network-async")
async def process_network_async_api(
    file: UploadFile = File(...),
    centralities: str = Form(default="[]"),
    communities: str = Form(default="[]")
):
    try:
        content = await file.read()
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No filename provided"
            )

        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''

        selected_centralities = []
        try:
            centralities_list = json.loads(centralities)
            if centralities_list:
                selected_centralities = [
                    c for c in centralities_list
                    if c in [ct.value for ct in CentralityType]
                ]
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse centralities, defaulting to empty: {e}")
            selected_centralities = []

        selected_communities = []
        try:
            communities_list = json.loads(communities)
            if communities_list:
                selected_communities = [
                    CommunityType(algo) for algo in communities_list
                    if algo in [a.value for a in ALL_COMMUNITY_ALGORITHMS]
                ]
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse communities, defaulting to empty: {e}")
            selected_communities = []

        task = process_network_task.delay(
            content, file_extension, selected_centralities, selected_communities
        )

        return {"task_id": task.id, "status": "submitted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting network processing task: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit processing task: {str(e)}"
        )

@app.get("/task-result/{task_id}")
async def get_task_result(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    response = {"task_id": task_id, "status": result.state, "result": None}

    if result.state == "FAILURE":
        response["error"] = str(result.info)
    elif result.state in ("PROCESSING", "PROGRESS"):
        # result.info holds whatever dict was passed to update_state(meta=...) just using as metadata for now
        response["meta"] = result.info
    elif result.ready():
        response["result"] = result.get()

    return response