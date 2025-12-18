import logging
import time
from typing import Any, Dict, List, Optional, Union, cast

import networkx as nx
from networkx.algorithms import community

from ..types import CommunityType

logger = logging.getLogger(__name__)

class Community:
    def __init__(self, G: Union[nx.Graph, nx.DiGraph]):
        self.G_original: Union[nx.Graph, nx.DiGraph] = G.copy()
        self.is_directed = self.G_original.is_directed()
        
        if self.is_directed:
            G_directed = cast(nx.DiGraph, self.G_original)
            self.G: nx.Graph = G_directed.to_undirected()
            self.is_connected = nx.is_strongly_connected(G_directed)
            self.is_weakly_connected = nx.is_weakly_connected(G_directed)
            logger.info("Converted directed graph to undirected for community detection")
        else:
            self.G: nx.Graph = cast(nx.Graph, self.G_original)
            G_undirected = cast(nx.Graph, self.G_original)
            self.is_connected = nx.is_connected(G_undirected)
            self.is_weakly_connected = self.is_connected
        
        edge_weights = nx.get_edge_attributes(self.G, "weight")
        self.use_weights = len(edge_weights) > 0 and any(w != 1.0 for w in edge_weights.values())
        self.weight_param: Optional[str] = "weight" if self.use_weights else None
        
        self.community_handlers = {
            CommunityType.LOUVAIN: self._louvain,
            CommunityType.LABEL_PROPAGATION: self._label_propagation,
            CommunityType.GREEDY_MODULARITY: self._greedy_modularity,
            CommunityType.GIRVAN_NEWMAN: self._girvan_newman,
            CommunityType.KERNIGHAN_LIN: self._kernighan_lin,
            CommunityType.ASYN_LPABASE: self._asyn_lpabase,
            CommunityType.ASYN_FLUIDC: self._asyn_fluidc,
        }
    
    def calculate_communities(
        self, 
        algorithms: List[CommunityType]
    ) -> Dict[str, Dict[str, int]]:
        results: Dict[str, Dict[str, int]] = {}
        
        logger.info(f"Starting detection of {len(algorithms)} community algorithms")
        total_start_time = time.time()
        
        detected_count = 0
        skipped_count = 0
        
        for algorithm in algorithms:
            if algorithm not in self.community_handlers:
                logger.warning(f"Unknown community algorithm: {algorithm}")
                skipped_count += 1
                continue
            
            skip_reason = self._check_requirements(algorithm)
            if skip_reason:
                logger.info(f"Skipping {algorithm}: {skip_reason}")
                skipped_count += 1
                continue
            
            try:
                start_time = time.time()
                result = self.community_handlers[algorithm]()
                elapsed_time = time.time() - start_time
                
                if result is not None and len(result) > 0:
                    results[algorithm] = result
                    detected_count += 1
                    num_communities = len(set(result.values()))
                    logger.info(
                        f"Detected {algorithm} in {elapsed_time:.4f} seconds "
                        f"({num_communities} communities)"
                    )
                else:
                    logger.warning(f"Skipping {algorithm}: returned None or empty")
                    skipped_count += 1
                    
            except nx.NetworkXError as e:
                logger.warning(f"Skipping {algorithm}: NetworkX error - {e}")
                skipped_count += 1
            except Exception as e:
                logger.warning(f"Skipping {algorithm}: Unexpected error - {e}")
                skipped_count += 1
        
        total_elapsed = time.time() - total_start_time
        logger.info(
            f"Community detection complete: {detected_count} detected, "
            f"{skipped_count} skipped, total time {total_elapsed:.4f} seconds"
        )
        
        return results
    
    def _check_requirements(self, algorithm: str) -> Optional[str]:
        
        connected_required = {
            CommunityType.ASYN_FLUIDC,
        }
        if algorithm in connected_required and not nx.is_connected(self.G):
            return "requires connected graph"
        
        if len(self.G.nodes()) < 2:
            return "requires at least 2 nodes"
        
        return None
    
    def _communities_to_node_dict(self, communities: Any) -> Dict[str, int]:
        node_to_community: Dict[str, int] = {}
        
        if hasattr(communities, '__iter__') and not isinstance(communities, (list, set, frozenset, dict)):
            communities = list(communities)
        
        if isinstance(communities, (list, set, frozenset)):
            for comm_id, community_set in enumerate(communities):
                for node in community_set:
                    node_to_community[str(node)] = comm_id
        
        elif isinstance(communities, dict):
            for node, comm_id in communities.items():
                node_to_community[str(node)] = int(comm_id)
        
        return node_to_community
    
    def _louvain(self) -> Dict[str, int]:
        communities = community.louvain_communities(
            self.G, 
            weight=self.weight_param,
            seed=42
        )
        if hasattr(communities, '__iter__'):
            communities = list(communities)
        return self._communities_to_node_dict(communities)
    
    def _label_propagation(self) -> Dict[str, int]:
        communities_gen = community.label_propagation_communities(self.G)
        communities = list(communities_gen)
        return self._communities_to_node_dict(communities)
    
    def _greedy_modularity(self) -> Dict[str, int]:
        communities = community.greedy_modularity_communities(
            self.G,
            weight=self.weight_param
        )
        if hasattr(communities, '__iter__'):
            communities = list(communities)
        return self._communities_to_node_dict(communities)
    
    def _girvan_newman(self) -> Dict[str, int]:
        comp = community.girvan_newman(self.G)
        try:
            first_level = next(comp)
            communities = list(first_level)
            return self._communities_to_node_dict(communities)
        except StopIteration:
            logger.warning("Girvan-Newman returned empty generator")
            return {}
    
    def _kernighan_lin(self) -> Dict[str, int]:
        if len(self.G.nodes()) < 2:
            return {}
        
        if self.weight_param is not None:
            partition = community.kernighan_lin_bisection(
                self.G,
                weight=self.weight_param,
                seed=42
            )
        else:
            partition = community.kernighan_lin_bisection(
                self.G,
                seed=42
            )
        
        result: Dict[str, int] = {}
        for comm_id, node_set in enumerate(partition):
            for node in node_set:
                result[str(node)] = comm_id
        
        return result
    
    def _asyn_lpabase(self) -> Dict[str, int]:
        communities_gen = community.asyn_lpa_communities(
            self.G, 
            weight=self.weight_param, 
            seed=42
        )
        communities = list(communities_gen)
        return self._communities_to_node_dict(communities)
    
    def _asyn_fluidc(self) -> Dict[str, int]:
        k = max(2, int(len(self.G.nodes()) ** 0.5))
        communities_gen = community.asyn_fluidc(self.G, k, seed=42)
        communities = list(communities_gen)
        return self._communities_to_node_dict(communities)


def calculate_selected_communities(
    G: Union[nx.Graph, nx.DiGraph],
    algorithms: List[CommunityType]
) -> Dict[str, Dict[str, int]]:
    
    detector = Community(G)
    return detector.calculate_communities(algorithms)