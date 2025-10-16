import hashlib
import json
import logging
import math
from typing import Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .centrality import calculate_selected_centralities
from .config import ALL_CENTRALITIES, DEFAULT_BASIC_CENTRALITIES
from .graph import create_networkx_graph
from .models import CentralityRequest, CentralityTimelineRequest, NetworkData

logger = logging.getLogger(__name__)

app = FastAPI(title="Centrality API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["https://vincent-frontend.onrender.com/", "https://vincent-frontend.onrender.com","http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

#Just extra for testing
@app.post("/calculate-centrality")
async def calculate_centrality_basic(network_data: NetworkData):
    if not network_data.nodes:
        raise HTTPException(status_code=400, detail="Network must contain at least one node")
    G = create_networkx_graph(network_data)
    results = calculate_selected_centralities(G, DEFAULT_BASIC_CENTRALITIES)
    return {node: {c: results[c].get(node, 0.0) for c in results} for node in G.nodes()}

@app.post("/calculate-centrality-all")
async def calculate_centrality_advanced(request: CentralityRequest):
    centralities = request.centralities or ALL_CENTRALITIES
    if not request.network.nodes:
        raise HTTPException(status_code=400, detail="Network must contain at least one node")
    G = create_networkx_graph(request.network)
    results = calculate_selected_centralities(G, centralities)
    return {node: {c: results[c].get(node, 0.0) for c in results} for node in G.nodes()}


# <--------- CACHE FOR LOCAL TESTING -------------->
# timeline_cache: Dict[str, Dict[int, List[Dict]]] = {}
# def make_cache_key(request: CentralityTimelineRequest) -> str:
#     """Generate a hash key from the request content."""
#     request_str = json.dumps(request.dict(), sort_keys=True)
#     return hashlib.sha256(request_str.encode("utf-8")).hexdigest()

# @app.post("/calculate-centrality-timeline")
# async def calculate_centrality_timeline(request: CentralityTimelineRequest):
#     centralities = request.centralities or ALL_CENTRALITIES

#     cache_key = make_cache_key(request)

#     if cache_key in timeline_cache:
#         logger.info(f"Returning cached timeline results for key={cache_key}")
#         return timeline_cache[cache_key]

#     timeline_results: Dict[int, List[Dict]] = {}

#     for t, network in request.networks.items():
#         if not network.nodes:
#             continue

#         G = create_networkx_graph(network)
#         results = calculate_selected_centralities(G, centralities)

#         timestep_data = []
#         for node in G.nodes():
#             node_data = {"id": node}
#             for c in results:
#                 val = results[c].get(node, 0.0)
#                 if isinstance(val, float) and not math.isfinite(val):
#                     val = 0.0
#                 node_data[c] = val
#             timestep_data.append(node_data)

#         timeline_results[t] = timestep_data

#     timeline_cache[cache_key] = timeline_results
#     logger.info(f"Cached timeline results for key={cache_key}")
#     print(f"Cached timeline results for key={cache_key}")
#     return timeline_results

@app.post("/calculate-centrality-timeline")
async def calculate_centrality_timeline(request: CentralityTimelineRequest):
    centralities = request.centralities or ALL_CENTRALITIES

    timeline_results: Dict[int, List[Dict]] = {}

    for t, network in request.networks.items():
        if not network.nodes:
            continue

        G = create_networkx_graph(network)
        results = calculate_selected_centralities(G, centralities)

        timestep_data = []
        for node in G.nodes():
            node_data = {"id": node}
            for c in results:
                val = results[c].get(node, 0.0)
                if isinstance(val, float) and not math.isfinite(val):
                    val = 0.0
                node_data[c] = val
            timestep_data.append(node_data)

        timeline_results[t] = timestep_data

    logger.info("Returned uncached timeline results")
    return timeline_results