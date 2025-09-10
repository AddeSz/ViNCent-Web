from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .models import NetworkData, CentralityRequest
from .graph import create_networkx_graph
from .centrality import calculate_selected_centralities
from .config import DEFAULT_BASIC_CENTRALITIES, ALL_CENTRALITIES
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Centrality API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

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
