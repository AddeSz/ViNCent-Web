import hashlib
import json
import logging
import math
import os
import time
from typing import Dict, List

import psutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .centrality import calculate_selected_centralities
from .config import ALL_CENTRALITIES, DEFAULT_BASIC_CENTRALITIES
from .graph import create_networkx_graph
from .models import (CentralityRequest, CentralityTimelineRequest,
                     CentralityTimestepRequest, NetworkData)

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

def log_memory(step=""):
    process = psutil.Process(os.getpid())
    print(f"[Memory] {step}: {process.memory_info().rss / 1024 / 1024:.2f} MB")

@app.get("/debug-memory")
def memory_usage():
    process = psutil.Process(os.getpid())
    rss_mb = process.memory_info().rss / 1024 / 1024
    print(f"[Memory Debug] Current RSS: {rss_mb:.2f} MB")
    return {"memory_mb": rss_mb}

#Just extra for testing
@app.post("/calculate-centrality-basic")
async def calculate_centrality_basic(network_data: NetworkData):
    if not network_data.nodes:
        raise HTTPException(status_code=400, detail="Network must contain at least one node")
    G = create_networkx_graph(network_data)
    results = calculate_selected_centralities(G, DEFAULT_BASIC_CENTRALITIES)
    return {node: {c: results[c].get(node, 0.0) for c in results} for node in G.nodes()}

@app.post("/calculate-centrality-all")
async def calculate_centrality_advanced(request: CentralityRequest):
    log_memory("Start /calculate-centrality-all")
    centralities = request.centralities or ALL_CENTRALITIES
    if not request.network.nodes:
        raise HTTPException(status_code=400, detail="Network must contain at least one node")
    G = create_networkx_graph(request.network)
    log_memory("After creating graph")
    results = calculate_selected_centralities(G, centralities)
    log_memory("After calculating centralities")
    return {node: {c: results[c].get(node, 0.0) for c in results} for node in G.nodes()}

@app.post("/calculate-centrality-timeline")
async def calculate_centrality_timeline(request: CentralityTimelineRequest):
    process = psutil.Process(os.getpid())
    centralities = request.centralities or ALL_CENTRALITIES

    timeline_results: Dict[int, List[Dict]] = {}

    start_total = time.time()
    log_memory("Start /calculate-centrality-timeline")

    for t, network in request.networks.items():
        if not network.nodes:
            continue

        timestep_start = time.time()

        G = create_networkx_graph(network)
        log_memory(f"After creating graph for timestep {t}")
        print(f"[Step {t}] Nodes: {len(G.nodes())}, Edges: {len(G.edges())}")

        results = calculate_selected_centralities(G, centralities)
        log_memory(f"After calculating centralities for timestep {t}")

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

        timestep_end = time.time()
        rss_mb = process.memory_info().rss / 1024 / 1024
        cpu_end = psutil.cpu_percent(interval=0.1) 

        print(
            f"[Step {t}] Memory: {rss_mb:.2f} MB, "
            f"Time: {timestep_end - timestep_start:.2f} s, "
            f"CPU usage: {cpu_end:.1f}%"
        )

    end_total = time.time()
    rss_mb_total = process.memory_info().rss / 1024 / 1024
    print(f"[Total] Memory: {rss_mb_total:.2f} MB, Total time: {end_total - start_total:.2f} s")

    logger.info("Returned uncached timeline results")
    log_memory("End /calculate-centrality-timeline")
    return timeline_results


@app.post("/calculate-centrality-timestep")
async def calculate_centrality_single_timestep(
    request: CentralityTimestepRequest
):
    centralities = request.centralities or ALL_CENTRALITIES
    network = request.network
    if not network.nodes:
        return []

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

    return timestep_data