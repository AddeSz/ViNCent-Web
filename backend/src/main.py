import json
import logging
import os
from dataclasses import asdict
from enum import Enum
from typing import List, Optional, TypeVar

from celery import states
from celery.result import AsyncResult
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import (CENTRALITIES, CENTRALITIES_META, COMMUNITIES,
                     COMMUNITIES_META)
from .parsers import parse_network_file
from .preprocessing import filter_computed_data, process_network
from .registry import get_computed_data, list_datasets
from .worker import celery_app, get_queue_position, process_network_task

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

E = TypeVar("E", bound=Enum)


def parse_selected(raw: str, allowed: List[E], field_name: str) -> List[E]:
    try:
        values = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse {field_name} as JSON, defaulting to empty")
        return []

    if not isinstance(values, list):
        logger.warning(f"{field_name} was not a JSON list, defaulting to empty")
        return []

    allowed_by_value = {member.value: member for member in allowed}
    return [allowed_by_value[v] for v in values if v in allowed_by_value]

@app.get("/get-options")
async def get_options():
    try:
        return JSONResponse(content={
            "centralities": [asdict(c) for c in CENTRALITIES_META],
            "communities": [asdict(c) for c in COMMUNITIES_META],
            "datasets": list_datasets(),
        })
    except Exception as e:
        logger.error(f"Error fetching options: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch options: {str(e)}")


@app.post("/process-network")
async def process_network_api(
    file: UploadFile = File(...),
    centralities: str = Form(default="[]"),
    communities: str = Form(default="[]")
):
    try:
        content = await file.read()
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        data = parse_network_file(content, file_extension)

        selected_centralities = parse_selected(centralities, CENTRALITIES, "centralities")
        selected_communities = parse_selected(communities, COMMUNITIES, "communities")

        processed = process_network(data, selected_centralities, selected_communities)
        return JSONResponse(content=processed)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in validate_network: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process network: {str(e)}")


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


@app.post("/process-network-async")
async def process_network_async_api(
    file: UploadFile = File(...),
    centralities: str = Form(default="[]"),
    communities: str = Form(default="[]")
):
    try:
        content = await file.read()
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''

        selected_centralities = parse_selected(centralities, CENTRALITIES, "centralities")
        selected_communities = parse_selected(communities, COMMUNITIES, "communities")

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


@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    result = AsyncResult(task_id, app=celery_app)
    state = result.state

    response = {"task_id": task_id, "status": state}

    if state == states.PENDING:
        position, queue_length = get_queue_position(task_id)
        response["queue"] = {
            "position": position,
            "length": queue_length,
        }
    elif state == states.STARTED:
        response["progress"] = {
            "stage": "parsing",
            "metric": None,
            "metric_index": None,
            "metric_total": None,
            "timestep_index": None,
            "timestep_total": None,
        }
    elif state == "PROGRESS":
        info = result.info if isinstance(result.info, dict) else {}
        response["progress"] = {
            "stage": info.get("stage"),
            "metric": info.get("metric"),
            "metric_index": info.get("metric_index"),
            "metric_total": info.get("metric_total"),
            "timestep_index": info.get("timestep_index"),
            "timestep_total": info.get("timestep_total"),
        }

    elif state == states.FAILURE:
        exc = result.info
        response["error"] = {
            "type": type(exc).__name__ if exc else "Unknown",
            "message": str(exc) if exc else "Task failed with no error details",
        }

    elif state == states.SUCCESS:
        response["result"] = result.result

    return response