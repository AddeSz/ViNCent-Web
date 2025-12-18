import json
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .cache_utils import CACHE_DIR, CACHE_ENABLED
from .config import (ALL_CENTRALITIES, ALL_COMMUNITY_ALGORITHMS,
                     CENTRALITY_CATEGORIES, CENTRALITY_DESCRIPTIONS,
                     CENTRALITY_PERFORMANCE, CENTRALITY_REQUIREMENTS,
                     COMMUNITY_CATEGORIES, COMMUNITY_DESCRIPTIONS,
                     COMMUNITY_PERFORMANCE, COMMUNITY_REQUIREMENTS)
from .parsers import parse_network_file
from .preprocessing import process_network
from .types import CentralityType

logging.basicConfig(
    level=logging.DEBUG,
    format="[%(levelname)s] %(name)s: %(message)s"
)
logging.getLogger("python_multipart.multipart").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if CACHE_ENABLED:
        try:
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            logger.info(f"Cache directory initialized at {CACHE_DIR}")
        except Exception as e:
            logger.error(f"Failed to create cache directory: {e}")
    
    yield


app = FastAPI(title="Centrality API", version="1.0.0", lifespan=lifespan)
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
            "communities": communities_data
        }
        
        return JSONResponse(content=options_data)
    except Exception as e:
        logger.error(f"Error fetching options: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch options: {str(e)}"
        )
        
@app.post("/validate-network")
async def validate_network(
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