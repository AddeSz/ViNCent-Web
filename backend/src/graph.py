import networkx as nx
from .models import NetworkData
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

def create_networkx_graph(network_data: NetworkData) -> nx.Graph:
    try:
        has_directed_links = any(link.directed for link in network_data.links)
        G = nx.DiGraph() if has_directed_links else nx.Graph()

        for node in network_data.nodes:
            attrs = {}
            if node.label:
                attrs["label"] = node.label
            if node.attributes:
                attrs.update(node.attributes)
            G.add_node(node.id, **attrs)

        for link in network_data.links:
            attrs = {"weight": link.weight or 1.0}
            if link.directed is not None:
                attrs["directed"] = link.directed
            if link.attributes:
                attrs.update(link.attributes)
            G.add_edge(link.source, link.target, **attrs)

        return G

    except Exception as e:
        logger.error(f"Error creating graph: {e}")
        raise HTTPException(status_code=400, detail=f"Error creating graph: {e}")
