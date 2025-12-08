import logging
import time
from typing import Any, Dict, List, Optional, Union, cast

import networkx as nx

from ..types import CentralityType

logger = logging.getLogger(__name__)


class CentralityCalculator:    
    def __init__(self, G: Union[nx.Graph, nx.DiGraph]):
        self.G: Union[nx.Graph, nx.DiGraph] = G.copy()
        self.is_directed = self.G.is_directed()
        
        if self.is_directed:
            G_directed = cast(nx.DiGraph, self.G)
            self.is_connected = nx.is_strongly_connected(G_directed)
            self.is_weakly_connected = nx.is_weakly_connected(G_directed)
            self.is_acyclic = nx.is_directed_acyclic_graph(G_directed)
        else:
            G_undirected = cast(nx.Graph, self.G)
            self.is_connected = nx.is_connected(G_undirected)
            self.is_weakly_connected = self.is_connected
            self.is_acyclic = False
        
        edge_weights = nx.get_edge_attributes(self.G, "weight")
        self.use_weights = len(edge_weights) > 0 and any(w != 1.0 for w in edge_weights.values())
        
        # for strength based metrics (PageRank, Katz, Eigenvector, etc.)
        self.weight_param: Optional[str] = "weight" if self.use_weights else None
        
        # for distance based metrics (Closeness, betweenness, Harmonic etc.)
        if self.use_weights:
            self._prepare_distance_weights()
            self.distance_param: Optional[str] = "distance"
        else:
            self.distance_param = None
        
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
            CentralityType.EDGE_DISPERSION: self._edge_dispersion,
            
            CentralityType.IN_DEGREE: self._in_degree,
            CentralityType.OUT_DEGREE: self._out_degree,
            CentralityType.LOCAL_REACHING: self._local_reaching,
            CentralityType.GLOBAL_REACHING: self._global_reaching,
            
            CentralityType.TROPHIC_LEVEL: self._trophic_level,
            CentralityType.EDGE_TROPHIC_DIFFERENCES: self._edge_trophic_differences,
            CentralityType.TROPHIC_INCOHERENCE: self._trophic_incoherence,
        }
    
    # Convert strength weights to distances by invertning
    # higher strength = closer = lower distance
    def _prepare_distance_weights(self):
        for _, _, data in self.G.edges(data=True):
            if "weight" in data and data["weight"] > 0:
                data["distance"] = 1.0 / data["weight"]
            else:
                data["distance"] = 1.0
    
    def calculate_centralities(
        self, 
        centralities: List[CentralityType]
    ) -> Dict[str, Union[Dict[str, float], Dict[tuple, float]]]:
        results: Dict[str, Union[Dict[str, float], Dict[tuple, float]]] = {}
        
        logger.info(f"Starting calculation of {len(centralities)} centrality metrics")
        total_start_time = time.time()
        
        calculated_count = 0
        skipped_count = 0
        
        for centrality in centralities:
            if centrality not in self.centrality_handlers:
                logger.warning(f"Unknown centrality type: {centrality.value}")
                skipped_count += 1
                continue
            
            skip_reason = self._check_requirements(centrality)
            if skip_reason:
                logger.info(f"Skipping {centrality.value}: {skip_reason}")
                skipped_count += 1
                continue
            
            try:
                start_time = time.time()
                result = self.centrality_handlers[centrality]()
                elapsed_time = time.time() - start_time
                
                if result is not None:
                    results[centrality.value] = result
                    calculated_count += 1
                    logger.info(f"Calculated {centrality.value} in {elapsed_time:.4f} seconds")
                else:
                    logger.warning(f"Skipping {centrality.value}: returned None")
                    skipped_count += 1
                    
            except nx.NetworkXError as e:
                logger.warning(f"Skipping {centrality.value}: NetworkX error - {e}")
                skipped_count += 1
            except Exception as e:
                logger.warning(f"Skipping {centrality.value}: Unexpected error - {e}")
                skipped_count += 1
        
        total_elapsed = time.time() - total_start_time
        logger.info(
            f"Centrality calculation complete: {calculated_count} calculated, "
            f"{skipped_count} skipped, total time {total_elapsed:.4f} seconds"
        )
        
        return results
    
    def _check_requirements(self, centrality: CentralityType) -> Optional[str]:
        directed_only = {
            CentralityType.IN_DEGREE,
            CentralityType.OUT_DEGREE,
            CentralityType.LOCAL_REACHING,
            CentralityType.GLOBAL_REACHING,
            CentralityType.TROPHIC_LEVEL,
            CentralityType.EDGE_TROPHIC_DIFFERENCES,
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
        
        if centrality in {CentralityType.TROPHIC_LEVEL, CentralityType.EDGE_TROPHIC_DIFFERENCES, 
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
        return dict(nx.degree_centrality(self.G))
    
    def _betweenness(self) -> Dict[str, float]:
        return dict(nx.betweenness_centrality(self.G, weight=self.distance_param, normalized=True))
    
    def _closeness(self) -> Dict[str, float]:
        if self.is_connected:
            return dict(nx.closeness_centrality(self.G, distance=self.distance_param))
        else:
            return dict(nx.closeness_centrality(self.G, distance=self.distance_param, wf_improved=False))
    
    def _eigenvector_numpy(self) -> Dict[str, float]:
        return dict(nx.eigenvector_centrality_numpy(self.G, weight=self.weight_param))
    
    def _pagerank(self) -> Dict[str, float]:
        return dict(nx.pagerank(self.G, weight=self.weight_param, alpha=0.85, max_iter=1000))
    
    def _katz_numpy(self) -> Dict[str, float]:
        try:
            return dict(nx.katz_centrality_numpy(self.G, weight=self.weight_param))
        except nx.NetworkXError as e:
            if "alpha" in str(e).lower():
                degree_dict = dict(nx.degree(self.G))
                max_degree = max(degree_dict.values())
                alpha = 1.0 / (max_degree + 2)
                logger.info(f"Retrying Katz with adjusted alpha={alpha}")
                return dict(nx.katz_centrality_numpy(self.G, alpha=alpha, weight=self.weight_param))
            raise
    
    def _harmonic(self) -> Dict[str, float]:
        return dict(nx.harmonic_centrality(self.G, distance=self.distance_param))
        
    def _load(self) -> Dict[str, float]:
        result = nx.load_centrality(self.G, weight=self.distance_param, normalized=True)
        if isinstance(result, dict):
            return result
        return {str(node): 0.0 for node in self.G.nodes()}
    
    def _edge_betweenness(self) -> Dict[tuple, float]:
        return dict(nx.edge_betweenness_centrality(self.G, weight=self.distance_param, normalized=True))
    
    def _edge_load(self) -> Dict[tuple, float]:
        return dict(nx.edge_load_centrality(self.G))
    
    def _current_flow_betweenness(self) -> Dict[str, float]:
        return dict(nx.current_flow_betweenness_centrality(self.G, weight=self.weight_param))
    
    def _edge_current_flow_betweenness(self) -> Dict[tuple, float]:
        return dict(nx.edge_current_flow_betweenness_centrality(self.G, weight=self.weight_param))
      
    def _information_centrality(self) -> Dict[str, float]:
        return dict(nx.information_centrality(self.G, weight=self.distance_param))
    
    def _communicability_betweenness(self) -> Dict[str, float]:
        return dict(nx.communicability_betweenness_centrality(self.G))
        
    def _subgraph(self) -> Dict[str, float]:
        return dict(nx.subgraph_centrality(self.G))
    
    def _subgraph_exp(self) -> Dict[str, float]:
        return dict(nx.subgraph_centrality_exp(self.G))
    
    def _laplacian(self) -> Dict[str, float]:
        return dict(nx.laplacian_centrality(self.G))
    
    def _second_order(self) -> Dict[str, float]:
        return dict(nx.second_order_centrality(self.G))
    
    def _percolation(self) -> Dict[str, float]:
        return dict(nx.percolation_centrality(self.G, weight=self.weight_param))
        
    def _voterank(self) -> Dict[str, float]:
        ranked_nodes = nx.voterank(self.G)
        result: Dict[str, float] = {node: 0.0 for node in self.G.nodes()}
        for rank, node in enumerate(ranked_nodes, 1):
            result[str(node)] = float(len(ranked_nodes) - rank + 1)
        return result
    
    def _edge_dispersion(self) -> Dict[tuple, float]:
        result: Dict[tuple, float] = {}
        for u, v in self.G.edges():
            try:
                disp_value = nx.dispersion(self.G, u, v)
                if isinstance(disp_value, dict):
                    disp_dict = cast(Dict[Any, float], disp_value)
                    result[(u, v)] = disp_dict.get(v, 0.0)
                else:
                    result[(u, v)] = float(disp_value) if disp_value is not None else 0.0
            except Exception as e:
                logger.warning(f"Failed dispersion for edge ({u}, {v}): {e}")
                result[(u, v)] = 0.0
        return result
    
    def _in_degree(self) -> Dict[str, float]:
        G_directed = cast(nx.DiGraph, self.G)
        return dict(nx.in_degree_centrality(G_directed))
    
    def _out_degree(self) -> Dict[str, float]:
        G_directed = cast(nx.DiGraph, self.G)
        return dict(nx.out_degree_centrality(G_directed))
    
    def _local_reaching(self) -> Dict[str, float]:
        result: Dict[str, float] = {}
        G_directed = cast(nx.DiGraph, self.G)
        for node in G_directed.nodes():
            try:
                if self.weight_param:
                    result[str(node)] = nx.local_reaching_centrality(G_directed, node, weight=self.weight_param)
                else:
                    result[str(node)] = nx.local_reaching_centrality(G_directed, node)
            except Exception as e:
                logger.warning(f"Failed local reaching for node {node}: {e}")
                result[str(node)] = 0.0
        return result
    
    def _global_reaching(self) -> Dict[str, float]:
        try:
            G_directed = cast(nx.DiGraph, self.G)
            if self.weight_param:
                value = nx.global_reaching_centrality(G_directed, weight=self.weight_param)
            else:
                value = nx.global_reaching_centrality(G_directed)
            return {str(node): value for node in G_directed.nodes()}
        except Exception as e:
            logger.warning(f"Failed global reaching: {e}")
            return {str(node): 0.0 for node in self.G.nodes()}
        
    def _trophic_level(self) -> Dict[str, float]:
        G_directed = cast(nx.DiGraph, self.G)
        if self.weight_param:
            return dict(nx.trophic_levels(G_directed, weight=self.weight_param))
        else:
            return dict(nx.trophic_levels(G_directed))
    
    def _edge_trophic_differences(self) -> Dict[tuple, float]:
        G_directed = cast(nx.DiGraph, self.G)
        if self.weight_param:
            return dict(nx.trophic_differences(G_directed, weight=self.weight_param))
        else:
            return dict(nx.trophic_differences(G_directed))
    
    def _trophic_incoherence(self) -> Dict[str, float]:
        try:
            G_directed = cast(nx.DiGraph, self.G)
            if self.weight_param:
                value = nx.trophic_incoherence_parameter(G_directed, weight=self.weight_param)
            else:
                value = nx.trophic_incoherence_parameter(G_directed)
            return {str(node): value for node in self.G.nodes()}
        except Exception as e:
            logger.warning(f"Failed trophic incoherence: {e}")
            return {str(node): 0.0 for node in self.G.nodes()}


def calculate_selected_centralities(
    G: Union[nx.Graph, nx.DiGraph],
    centralities: List[CentralityType]
) -> tuple[Dict[str, Dict[str, float]], Dict[str, Dict[str, float]]]:

    calculator = CentralityCalculator(G)
    raw_results = calculator.calculate_centralities(centralities)

    node_results: Dict[str, Dict[str, float]] = {}
    edge_results: Dict[str, Dict[str, float]] = {}

    for centrality_name, values in raw_results.items():
        if not values:
            continue

        first_key = next(iter(values.keys()))
        is_edge = isinstance(first_key, tuple)

        if is_edge:
            edge_values = cast(Dict[tuple, float], values)
            for (u, v), value in edge_values.items():
                edge_id = (
                    f"{u}|{v}"
                    if G.is_directed()
                    else "|".join(sorted([str(u), str(v)]))
                )
                edge_results.setdefault(edge_id, {})[centrality_name] = value
        else:
            node_values = cast(Dict[str, float], values)
            for node, value in node_values.items():
                node_results.setdefault(str(node), {})[centrality_name] = value

    return node_results, edge_results