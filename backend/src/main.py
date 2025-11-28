import logging
import math
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .cache_utils import CACHE_DIR, CACHE_ENABLED, get_from_cache, set_in_cache
from .centrality import calculate_selected_centralities
from .config import ALL_CENTRALITIES
from .graph import create_networkx_graph
from .models import CentralityRequest, CentralityTimestepRequest
from .preprocessing import (parse_graphml_to_network, parse_json_to_network,
                            parse_mtx_to_network, preprocess_network)

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

def separate_centrality_results(results, directed=False):
    node_results = {}
    edge_centralities = {}

    for centrality_name, values in results.items():
        if not values:
            continue

        first_key = next(iter(values.keys()))
        if isinstance(first_key, tuple):
            for source, target in values:
                if directed:
                    edge_id = f"{source}|{target}"
                else:
                    edge_id = "|".join(sorted([source, target]))

                if edge_id not in edge_centralities:
                    edge_centralities[edge_id] = {}
                edge_centralities[edge_id][centrality_name] = values[(source, target)]
        else:
            node_results[centrality_name] = values

    return node_results, edge_centralities


@app.post("/calculate-centrality-all")
async def calculate_all_centralites(request: CentralityRequest):
    dataset_id = getattr(request, "dataset_id", None)
    
    if dataset_id:
        cached_result = get_from_cache(dataset_id, "all")
        if cached_result:
            return cached_result
    
    centralities = ALL_CENTRALITIES
    
    if not request.network.nodes:
        raise HTTPException(status_code=400, detail="Network must contain at least one node")
    
    try:
        G = create_networkx_graph(request.network)
        directed = G.is_directed()
        
        results = calculate_selected_centralities(G, centralities)
        
        node_results, edge_centralities = separate_centrality_results(results, directed=directed)
        
        node_centralities = {
            node: {c: node_results[c].get(node, 0.0) for c in node_results} 
            for node in G.nodes()
        }
                
        response = {
            "nodes": node_centralities,
            "edges": edge_centralities,
            "metadata": {
                "calculated_node_centralities": list(node_results.keys()),
                "calculated_edge_centralities": list({c for d in edge_centralities.values() for c in d.keys()}),
                "directed": directed,
            }
        }
        
        if dataset_id:
            set_in_cache(dataset_id, response, "all")
        
        return response
    
    except Exception as e:
        logger.error(f"Failed to calculate centralities: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Centrality calculation failed: {str(e)}"
        )


@app.post("/calculate-centrality-timestep")
async def calculate_centrality_per_timestep(request: CentralityTimestepRequest):
    dataset_id = getattr(request, "dataset_id", None)
    timestep = getattr(request, "timestep", None)
    
    if dataset_id and timestep is not None:
        cache_key = f"timestep:{timestep}"
        cached_result = get_from_cache(dataset_id, cache_key)
        if cached_result:
            return cached_result
    
    centralities = ALL_CENTRALITIES
    network = request.network
    
    if not network.nodes:
        return {
            "nodes": [],
            "edges": {},
            "metadata": {
                "calculated_node_centralities": [],
                "calculated_edge_centralities": [],
                "directed": False,
            }
        }

    try:
        G = create_networkx_graph(network)
        directed = G.is_directed()
        
        results = calculate_selected_centralities(G, centralities)

        node_results, edge_centralities = separate_centrality_results(results, directed=directed)

        timestep_node_data = []
        for node in G.nodes():
            node_data = {"id": node}
            for c in node_results:
                val = node_results[c].get(node, 0.0)
                if isinstance(val, float) and not math.isfinite(val):
                    val = 0.0
                node_data[c] = val
            timestep_node_data.append(node_data)

        response = {
            "nodes": timestep_node_data,
            "edges": edge_centralities,
            "metadata": {
                "calculated_node_centralities": list(node_results.keys()),
                "calculated_edge_centralities": list({c for d in edge_centralities.values() for c in d.keys()}),
                "directed": directed,
            }
        }
        
        if dataset_id and timestep is not None:
            cache_key = f"timestep:{timestep}"
            set_in_cache(dataset_id, response, cache_key)
        
        return response
    
    except Exception as e:
        logger.error(f"Failed to calulate centralities: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Centrality calculation failed: {str(e)}"
        )
        
        
@app.post("/validate-network")
async def validate_network(file: UploadFile = File(...)):
    try:
        content = await file.read()
        filename_lower = file.filename.lower()
        
        if filename_lower.endswith(".json"):
            data = parse_json_to_network(content)
            
        elif filename_lower.endswith(".graphml") or filename_lower.endswith(".xml"):
            data = parse_graphml_to_network(content)
            
        elif filename_lower.endswith(".mtx") or filename_lower.endswith(".mm"):
            data = parse_mtx_to_network(content)
            
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format: {file.filename}. "
                       f"Supported formats: .json, .graphml, .xml, .mtx, .mm"
            )
        
        preprocessed = preprocess_network(data)
        
        return JSONResponse(content=preprocessed)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in validate_network: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process network: {str(e)}"
        )