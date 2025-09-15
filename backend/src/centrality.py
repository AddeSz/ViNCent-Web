import networkx as nx
from .models import CentralityType
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

# Long if else in order to meet requirements for the the different centrality measures
def calculate_selected_centralities(G: nx.Graph, centralities: List[CentralityType]) -> Dict[str, Dict[str, float]]:
    results = {}
    
    G_calc: nx.Graph | nx.DiGraph = G.copy()
    is_directed = G_calc.is_directed()
    
    link_weights = nx.get_edge_attributes(G_calc, "weight")
    use_weights = len(link_weights) > 0 and any(w != 1.0 for w in link_weights.values())
    weight_param = "weight" if use_weights else None
    
    is_connected = nx.is_connected(G_calc) if not is_directed else nx.is_weakly_connected(G_calc)
    is_strongly_connected = nx.is_strongly_connected(G_calc) if is_directed else None
    is_acyclic = nx.is_directed_acyclic_graph(G_calc) if is_directed else None
    
    for centrality in centralities:
        try:
            if is_directed:
                if centrality in {
                    CentralityType.SUBGRAPH,
                    CentralityType.SECOND_ORDER,
                    CentralityType.CURRENT_FLOW_CLOSENESS,
                    CentralityType.CURRENT_FLOW_BETWEENNESS,
                    CentralityType.COMMUNICABILITY_BETWEENNESS
                }:
                    logger.info(f"Skipping {centrality.value}: not applicable to directed graphs")
                    continue  #undirected-only
                if centrality == CentralityType.TROPHIC_LEVEL and not is_acyclic:
                    logger.info(f"Skipping {centrality.value}: only applicable to acyclic directed graphs")
                    continue  # only for acyclic graphs
            else:
                if centrality in {
                    CentralityType.IN_DEGREE,
                    CentralityType.OUT_DEGREE,
                    CentralityType.LOCAL_REACHING,
                    CentralityType.TROPHIC_LEVEL
                }:
                    logger.info(f"Skipping {centrality.value}: only applicable to directed graphs")
                    continue  # directed-only
                
            logger.info(f"Calculating {centrality.value}...")
            
            # ----------- Calculate centrality ----------
            if centrality == CentralityType.DEGREE:
                results[centrality.value] = nx.degree_centrality(G_calc)

            elif centrality == CentralityType.IN_DEGREE and is_directed:
                results[centrality.value] = nx.in_degree_centrality(G_calc)

            elif centrality == CentralityType.OUT_DEGREE and is_directed:
                results[centrality.value] = nx.out_degree_centrality(G_calc)

            elif centrality == CentralityType.BETWEENNESS:
                results[centrality.value] = nx.betweenness_centrality(G_calc, weight=weight_param, normalized=True)

            elif centrality == CentralityType.CLOSENESS:
                if is_connected:
                    distance_param = "weight" if use_weights else None
                    results[centrality.value] = nx.closeness_centrality(G_calc, distance=distance_param)
                else:
                    distance_param = "weight" if use_weights else None
                    results[centrality.value] = nx.closeness_centrality(G_calc, distance=distance_param, wf_improved=False)

            elif centrality == CentralityType.EIGENVECTOR:
                if (is_directed and is_strongly_connected) or (not is_directed and is_connected):
                    results[centrality.value] = nx.eigenvector_centrality(G_calc, weight=weight_param, max_iter=1000)
                else:
                    logger.warning(f"Skipping {centrality.value}: requires connected graph")
                    continue

            elif centrality == CentralityType.PAGERANK:
                if weight_param is not None:
                    results[centrality.value] = nx.pagerank(G_calc, weight=weight_param, alpha=0.85, max_iter=1000)
                else:
                    results[centrality.value] = nx.pagerank(G_calc, alpha=0.85, max_iter=1000)

            elif centrality == CentralityType.KATZ:
                try:
                    results[centrality.value] = nx.katz_centrality(G_calc, weight=weight_param, max_iter=1000)
                except nx.NetworkXError as e:
                    if "alpha" in str(e).lower():
                        try:
                            alpha = 1.0 / (max(dict(G_calc.degree()).values()) + 1) # type: ignore
                            results[centrality.value] = nx.katz_centrality(G_calc, alpha=alpha, weight=weight_param, max_iter=1000)
                        except:
                            logger.warning(f"Skipping {centrality.value}: failed with adjusted alpha: {e}")
                            continue
                    else:
                        raise

            elif centrality == CentralityType.HARMONIC:
                distance_param = "weight" if use_weights else None
                results[centrality.value] = nx.harmonic_centrality(G_calc, distance=distance_param)

            elif centrality == CentralityType.LOAD:
                results[centrality.value] = nx.load_centrality(G_calc, weight=weight_param, normalized=True)

            elif centrality == CentralityType.SUBGRAPH:
                if not is_directed:
                    results[centrality.value] = nx.subgraph_centrality(G_calc)

            elif centrality == CentralityType.CURRENT_FLOW_CLOSENESS:
                if not is_directed and is_connected:
                    results[centrality.value] = nx.current_flow_closeness_centrality(G_calc, weight=weight_param)
                else:
                    logger.warning(f"Skipping {centrality.value}:  requires connected undirected graph")
                    continue

            elif centrality == CentralityType.CURRENT_FLOW_BETWEENNESS:
                if not is_directed and is_connected:
                    results[centrality.value] = nx.current_flow_betweenness_centrality(G_calc, weight=weight_param)
                else:
                    logger.warning(f"Skipping {centrality.value}: requires connected undirected graph")
                    continue

            elif centrality == CentralityType.COMMUNICABILITY_BETWEENNESS:
                if not is_directed:
                    results[centrality.value] = nx.communicability_betweenness_centrality(G_calc)

            elif centrality == CentralityType.PERCOLATION:
                results[centrality.value] = nx.percolation_centrality(G_calc, weight=weight_param)

            elif centrality == CentralityType.SECOND_ORDER:
                if not is_directed:
                    results[centrality.value] = nx.second_order_centrality(G_calc)

            elif centrality == CentralityType.LOCAL_REACHING and is_directed:
                if not isinstance(G_calc, nx.DiGraph):
                    G_directed = G_calc.to_directed() if hasattr(G_calc, "to_directed") else nx.DiGraph(G_calc)
                else:
                    G_directed = G_calc
                    
                local_reaching = {}
                for node in G_directed.nodes():
                    try:
                        if weight_param is not None:
                            local_reaching[node] = nx.local_reaching_centrality(G_directed, node, weight=weight_param)
                        else:
                            local_reaching[node] = nx.local_reaching_centrality(G_directed, node)
                    except Exception as node_e:
                        logger.warning(f"Failed to calculate local reching centrality for node {node}: {node_e}")
                        local_reaching[node] = 0.0
                results[centrality.value] = local_reaching

            elif centrality == CentralityType.TROPHIC_LEVEL and is_directed and is_acyclic:
                if not isinstance(G_calc, nx.DiGraph):
                    G_directed = G_calc.to_directed() if hasattr(G_calc, "to_directed") else nx.DiGraph(G_calc)
                else:
                    G_directed = G_calc
                    
                if weight_param is not None:
                    results[centrality.value] = nx.trophic_levels(G_directed, weight=weight_param)
                else:
                    results[centrality.value] = nx.trophic_levels(G_directed)

        except nx.NetworkXError as e:
            logger.warning(f"NetworkX error calculating {centrality.value}: {e}")
            continue
        except Exception as e:
            logger.warning(f"Unexpected error calculating {centrality.value}: {e}")
            continue

    return results