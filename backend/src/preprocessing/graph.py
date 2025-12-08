import logging
from typing import Union

import networkx as nx
from fastapi import HTTPException

from ..types import NetworkData

logger = logging.getLogger(__name__)

def create_networkx_graph(network_data: NetworkData, directed: bool) -> Union[nx.Graph, nx.DiGraph]:
    try:
        G = nx.DiGraph() if directed else nx.Graph()

        for node in network_data["nodes"]:
            G.add_node(node["id"])

        for edge in network_data["edges"]:
            weight = edge.get("weight", 1.0)
            G.add_edge(edge["source"], edge["target"], weight=weight)

        return G

    except Exception as e:
        logger.error(f"Error creating graph: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Error creating graph: {e}"
        )
