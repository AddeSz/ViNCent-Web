import logging
from typing import Dict, List, Optional, Union

import networkx as nx

from .models import CentralityType

logger = logging.getLogger(__name__)

# calculates all the avialable centrality metrics, including edge centralites
class CentralityCalculator:    
    EDGE_CENTRALITIES = {
        CentralityType.EDGE_BETWEENNESS,
        CentralityType.EDGE_LOAD,
        CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
        CentralityType.TROPHIC_DIFFERENCES,
    }
    
    def __init__(self, G: nx.Graph):
        self.G = G.copy()
        self.is_directed = self.G.is_directed()
        
        self.is_connected = (
            nx.is_strongly_connected(self.G) if self.is_directed 
            else nx.is_connected(self.G)
        )
        self.is_weakly_connected = (
            nx.is_weakly_connected(self.G) if self.is_directed 
            else self.is_connected
        )
        self.is_acyclic = (
            nx.is_directed_acyclic_graph(self.G) if self.is_directed 
            else False
        )
        
        link_weights = nx.get_edge_attributes(self.G, "weight")
        self.use_weights = len(link_weights) > 0 and any(w != 1.0 for w in link_weights.values())
        self.weight_param = "weight" if self.use_weights else None
        
        self.centrality_handlers = {
            CentralityType.DEGREE: self._degree,
            CentralityType.BETWEENNESS: self._betweenness,
            CentralityType.CLOSENESS: self._closeness,
            CentralityType.EIGENVECTOR: self._eigenvector_numpy,
            CentralityType.PAGERANK: self._pagerank,
            CentralityType.KATZ: self._katz_numpy,
            CentralityType.HARMONIC: self._harmonic,
            
            CentralityType.LOAD: self._load,
            CentralityType.EDGE_BETWEENNESS: self._edge_betweenness,
            CentralityType.EDGE_LOAD: self._edge_load,
            CentralityType.CURRENT_FLOW_BETWEENNESS: self._current_flow_betweenness,
            CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS: self._edge_current_flow_betweenness,
            CentralityType.INFORMATION_CENTRALITY: self._information_centrality,
            CentralityType.COMMUNICABILITY_BETWEENNESS: self._communicability_betweenness,
            
            CentralityType.SUBGRAPH: self._subgraph,
            CentralityType.SUBGRAPH_CENTRALITY_EXP: self._subgraph_exp,
            CentralityType.LAPLACIAN: self._laplacian,
            CentralityType.SECOND_ORDER: self._second_order,
            
            CentralityType.PERCOLATION: self._percolation,
            CentralityType.VOTERANK: self._voterank,
            CentralityType.DISPERSION: self._dispersion,
            
            CentralityType.IN_DEGREE: self._in_degree,
            CentralityType.OUT_DEGREE: self._out_degree,
            CentralityType.LOCAL_REACHING: self._local_reaching,
            CentralityType.GLOBAL_REACHING: self._global_reaching,
            
            CentralityType.TROPHIC_LEVEL: self._trophic_level,
            CentralityType.TROPHIC_DIFFERENCES: self._trophic_differences,
            CentralityType.TROPHIC_INCOHERENCE: self._trophic_incoherence,
        }
    
    @classmethod
    def is_edge_centrality(cls, centrality: CentralityType) -> bool:
        return centrality in cls.EDGE_CENTRALITIES
    
    def calculate_centralities(
        self, 
        centralities: List[CentralityType]
    ) -> Dict[str, Union[Dict[str, float], Dict[tuple, float]]]:
        results = {}
        
        for centrality in centralities:
            if centrality not in self.centrality_handlers:
                logger.warning(f"Unknown centrality type: {centrality.value}")
                continue
            
            skip_reason = self._check_requirements(centrality)
            if skip_reason:
                logger.info(f"Skipping {centrality.value}: {skip_reason}")
                continue
            
            try:
                logger.info(f"Calculating {centrality.value}...")
                result = self.centrality_handlers[centrality]()
                if result is not None:
                    results[centrality.value] = result
            except nx.NetworkXError as e:
                logger.warning(f"NetworkX error calculating {centrality.value}: {e}")
            except Exception as e:
                logger.warning(f"Unexpected error calculating {centrality.value}: {e}")
        
        return results
    
    def _check_requirements(self, centrality: CentralityType) -> Optional[str]:
        directed_only = {
            CentralityType.IN_DEGREE,
            CentralityType.OUT_DEGREE,
            CentralityType.LOCAL_REACHING,
            CentralityType.GLOBAL_REACHING,
            CentralityType.TROPHIC_LEVEL,
            CentralityType.TROPHIC_DIFFERENCES,
            CentralityType.TROPHIC_INCOHERENCE,
        }
        if centrality in directed_only and not self.is_directed:
            return "only applicable to directed graphs"
        
        undirected_only = {
            CentralityType.SUBGRAPH,
            CentralityType.SUBGRAPH_CENTRALITY_EXP,
            CentralityType.SECOND_ORDER,
            CentralityType.INFORMATION_CENTRALITY,
            CentralityType.CURRENT_FLOW_BETWEENNESS,
            CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
            CentralityType.COMMUNICABILITY_BETWEENNESS,
        }
        if centrality in undirected_only and self.is_directed:
            return "not applicable to directed graphs"
        
        if centrality in {CentralityType.TROPHIC_LEVEL, CentralityType.TROPHIC_DIFFERENCES, 
                         CentralityType.TROPHIC_INCOHERENCE}:
            if not self.is_acyclic:
                return "only applicable to acyclic directed graphs"
        
        strongly_connected_required = {CentralityType.EIGENVECTOR}
        if centrality in strongly_connected_required:
            if self.is_directed and not self.is_connected:
                return "requires strongly connected graph"
            if not self.is_directed and not self.is_connected:
                return "requires connected graph"
        
        connected_undirected = {
            CentralityType.INFORMATION_CENTRALITY,
            CentralityType.CURRENT_FLOW_BETWEENNESS,
            CentralityType.EDGE_CURRENT_FLOW_BETWEENNESS,
            CentralityType.COMMUNICABILITY_BETWEENNESS,
            CentralityType.SECOND_ORDER,
        }
        if centrality in connected_undirected and not self.is_connected:
            return "requires connected undirected graph"
        
        return None
        
    def _degree(self) -> Dict[str, float]:
        return nx.degree_centrality(self.G)
    
    def _betweenness(self) -> Dict[str, float]:
        return nx.betweenness_centrality(self.G, weight=self.weight_param, normalized=True)
    
    def _closeness(self) -> Dict[str, float]:
        distance_param = self.weight_param
        if self.is_connected:
            return nx.closeness_centrality(self.G, distance=distance_param)
        else:
            return nx.closeness_centrality(self.G, distance=distance_param, wf_improved=False)
    
    def _eigenvector_numpy(self) -> Dict[str, float]:
        return nx.eigenvector_centrality_numpy(self.G, weight=self.weight_param)
    
    def _pagerank(self) -> Dict[str, float]:
        return nx.pagerank(self.G, weight=self.weight_param, alpha=0.85, max_iter=1000)
    
    def _katz_numpy(self) -> Dict[str, float]:
        try:
            return nx.katz_centrality_numpy(self.G, weight=self.weight_param)
        except nx.NetworkXError as e:
            if "alpha" in str(e).lower():
                max_degree = max(dict(self.G.degree()).values())
                alpha = 1.0 / (max_degree + 1)
                logger.info(f"Retrying Katz with adjusted alpha={alpha}")
                return nx.katz_centrality_numpy(self.G, alpha=alpha, weight=self.weight_param)
            raise
    
    def _harmonic(self) -> Dict[str, float]:
        return nx.harmonic_centrality(self.G, distance=self.weight_param)
        
    def _load(self) -> Dict[str, float]:
        return nx.load_centrality(self.G, weight=self.weight_param, normalized=True)
    
    def _edge_betweenness(self) -> Dict[tuple, float]:
        return nx.edge_betweenness_centrality(self.G, weight=self.weight_param, normalized=True)
    
    def _edge_load(self) -> Dict[tuple, float]:
        return nx.edge_load_centrality(self.G)
    
    def _current_flow_betweenness(self) -> Dict[str, float]:
        return nx.current_flow_betweenness_centrality(self.G, weight=self.weight_param)
    
    def _edge_current_flow_betweenness(self) -> Dict[tuple, float]:
        return nx.edge_current_flow_betweenness_centrality(self.G, weight=self.weight_param)
      
    def _information_centrality(self) -> Dict[str, float]:
        return nx.information_centrality(self.G, weight=self.weight_param)
    
    def _communicability_betweenness(self) -> Dict[str, float]:
        return nx.communicability_betweenness_centrality(self.G)
        
    def _subgraph(self) -> Dict[str, float]:
        return nx.subgraph_centrality(self.G)
    
    def _subgraph_exp(self) -> Dict[str, float]:
        return nx.subgraph_centrality_exp(self.G)
    
    def _laplacian(self) -> Dict[str, float]:
        return nx.laplacian_centrality(self.G)
    
    def _second_order(self) -> Dict[str, float]:
        return nx.second_order_centrality(self.G)
    
    
    def _percolation(self) -> Dict[str, float]:
        return nx.percolation_centrality(self.G, weight=self.weight_param)
        
    def _voterank(self) -> Dict[str, float]:
        ranked_nodes = nx.voterank(self.G)
        result = {node: 0.0 for node in self.G.nodes()}
        for rank, node in enumerate(ranked_nodes, 1):
            result[node] = len(ranked_nodes) - rank + 1
        return result
    
    def _dispersion(self) -> Dict[str, float]:
        result = {}
        for node in self.G.nodes():
            dispersions = nx.dispersion(self.G, node)
            if dispersions:
                result[node] = sum(dispersions.values()) / len(dispersions)
            else:
                result[node] = 0.0
        return result
    
    
    def _in_degree(self) -> Dict[str, float]:
        return nx.in_degree_centrality(self.G)
    
    def _out_degree(self) -> Dict[str, float]:
        return nx.out_degree_centrality(self.G)
    
    def _local_reaching(self) -> Dict[str, float]:
        result = {}
        for node in self.G.nodes():
            try:
                result[node] = nx.local_reaching_centrality(self.G, node, weight=self.weight_param)
            except Exception as e:
                logger.warning(f"Failed local reaching for node {node}: {e}")
                result[node] = 0.0
        return result
    
    def _global_reaching(self) -> Dict[str, float]:
        try:
            value = nx.global_reaching_centrality(self.G, weight=self.weight_param)
            return {node: value for node in self.G.nodes()}
        except Exception as e:
            logger.warning(f"Failed global reaching: {e}")
            return {node: 0.0 for node in self.G.nodes()}
        
    def _trophic_level(self) -> Dict[str, float]:
        return nx.trophic_levels(self.G, weight=self.weight_param)
    
    def _trophic_differences(self) -> Dict[tuple, float]:
        return nx.trophic_differences(self.G, weight=self.weight_param)
    
    def _trophic_incoherence(self) -> Dict[str, float]:
        try:
            value = nx.trophic_incoherence_parameter(self.G, weight=self.weight_param)
            return {node: value for node in self.G.nodes()}
        except Exception as e:
            logger.warning(f"Failed tophic incoherence: {e}")
            return {node: 0.0 for node in self.G.nodes()}


def calculate_selected_centralities(
    G: nx.Graph, 
    centralities: List[CentralityType]
) -> Dict[str, Union[Dict[str, float], Dict[tuple, float]]]:

    calculator = CentralityCalculator(G)
    return calculator.calculate_centralities(centralities)