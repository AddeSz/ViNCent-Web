import networkx as nx
from .models import NetworkData, Edge, Node
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)

def create_networkx_graph(network_data: NetworkData) -> nx.Graph:
    try:
        has_directed_edges = any(edge.directed for edge in network_data.edges)
        G = nx.DiGraph() if has_directed_edges else nx.Graph()

        for node in network_data.nodes:
            attrs = {}
            if node.label:
                attrs["label"] = node.label
            if node.attributes:
                attrs.update(node.attributes)
            G.add_node(node.id, **attrs)

        for edge in network_data.edges:
            attrs = {"weight": edge.weight or 1.0}
            if edge.directed is not None:
                attrs["directed"] = edge.directed
            if edge.attributes:
                attrs.update(edge.attributes)
            G.add_edge(edge.source, edge.target, **attrs)

        return G

    except Exception as e:
        logger.error(f"Error creating graph: {e}")
        raise HTTPException(status_code=400, detail=f"Error creating graph: {e}")
