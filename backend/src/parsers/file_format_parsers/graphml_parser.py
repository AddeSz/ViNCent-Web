# Parses GraphML XML files into my node-link format, supporting both static and temporal graphs
# Supports: Standard GraphML with node/edge data attributes, temporal graphs with timestep markers in the form of "timestep_N" and "attr_timestep_N"

# Input example:
# <key id="ts0" for="node" attr.name="timestep_0" attr.type="boolean"/>
# <key id="ts1" for="node" attr.name="timestep_1" attr.type="boolean"/>
# <key id="color0" for="node" attr.name="color_timestep_0" attr.type="string"/>
# <node id="A">
#   <data key="ts0">true</data>
#   <data key="ts1">true</data>
#   <data key="color0">red</data>
# </node>
# timestep_N marks existence at timestep N for nodes/edges, attr_timestep_N provides attribute values at timestep N

# Output format example:
# nodes: [{"id": "A", "timestep": 0, "attributes": {"color": "red"}}, {"id": "A", "timestep": 1}]
# edges: [{"source": "A", "target": "B", "timestep": 0, "weight": 5}]
# directed: false
# Each node/edge exists at specific timesteps, creating separate entries per timestep


# Steps:
# 1. Parse XML and extract namespace
# 2. Read key definitions to understand attribute types and names
# 3. Scan all attributes to detect timesteps (looks for "timestep_N" and "attr_timestep_N" patterns)
# 4. Parse: nodes/edges with their attributes, creating separate entries for each timestep if temporal
# 5. Return nodes, edges, and directed flag

import io
import logging
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Set, cast

from fastapi import HTTPException

from ...types import Edge, Node
from .base import FileFormatParser

logger = logging.getLogger(__name__)
LABEL_ATTRIBUTE_NAMES = {"label", "name", ".text", "text", "title", "node_label", "nodename", "node_name"}

class GraphMLParser(FileFormatParser):
    def parse(self, content: bytes) -> Dict[str, Any]:
        try:
            tree = ET.parse(io.BytesIO(content))
            root = tree.getroot()
            
            # 1. Parse XML and extract namespace
            namespace = ""
            if root.tag.startswith("{"):
                namespace = root.tag.split("}")[0].strip("{")
            
            ns = {"graphml": namespace} if namespace else {}
            
            
            def find_elements(parent, tag):
                if namespace:
                    return parent.findall(f"graphml:{tag}", ns)
                else:
                    return parent.findall(tag)
            
            def find_element(parent, tag):
                if namespace:
                    return parent.find(f"graphml:{tag}", ns)
                else:
                    return parent.find(tag)
            
            # 2. Read key definitions to understand attribute types and names
            keys = {}
            for key in find_elements(root, "key"):
                key_id = key.get("id")
                key_for = key.get("for")
                key_name = key.get("attr.name")
                key_type = key.get("attr.type", "string")
                
                keys[key_id] = {
                    "name": key_name or key_id,
                    "for": key_for,
                    "type": key_type
                }
            
            graph = find_element(root, "graph")
            if graph is None:
                raise HTTPException(
                    status_code=400,
                    detail="No graph element found in GraphML file"
                )
            
            edgedefault = graph.get("edgedefault", "directed")
            is_directed = (edgedefault == "directed")
            
            # 3. Scan all attributes to detect timesteps (looks for "timestep_N" and "attr_timestep_N" patterns)
            all_graph_timesteps: Set[int | float] = set()
            for node in find_elements(graph, "node"):
                for data in find_elements(node, "data"):
                    key_id = data.get("key")
                    if key_id in keys:
                        attr_name = keys[key_id]["name"]
                        self._extract_timestep(attr_name, all_graph_timesteps)
            
            for edge in find_elements(graph, "edge"):
                for data in find_elements(edge, "data"):
                    key_id = data.get("key")
                    if key_id in keys:
                        attr_name = keys[key_id]["name"]
                        self._extract_timestep(attr_name, all_graph_timesteps)
            
            has_temporal = len(all_graph_timesteps) > 0
            logger.info(f"Found timesteps in graph: {sorted(all_graph_timesteps)}")
            
            # 4. Parse nodes
            nodes: List[Node] = []
            for node in find_elements(graph, "node"):
                node_entries = self._parse_temporal_element(
                    node, find_elements, keys, all_graph_timesteps, has_temporal, "node"
                )
                nodes.extend([cast(Node, entry) for entry in node_entries])

            # 4. Parse edges
            edges: List[Edge] = []
            for edge in find_elements(graph, "edge"):
                edge_entries = self._parse_temporal_element(
                    edge, find_elements, keys, all_graph_timesteps, has_temporal, "edge"
                )
                edges.extend([cast(Edge, entry) for entry in edge_entries])
                
            logger.info(
                f"Parsed GraphML: {len(nodes)} node entries, {len(edges)} edge entries, "
                f"directed: {is_directed}, temporal: {has_temporal}"
            )
            
            result = {
                "nodes": nodes,
                "edges": edges,
                "directed": is_directed
            }
            
            return result
            
        except ET.ParseError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid GraphML XML format: {str(e)}"
            )
        except Exception as e:
            logger.exception("Error parsing GraphML")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to parse GraphML file: {str(e)}"
            )
    
    def _extract_timestep(self, attr_name: str, timesteps: Set[int | float]) -> None:
        if attr_name.startswith("timestep_") and "_" not in attr_name[9:]:
            try:
                ts_str = attr_name[9:]
                ts = float(ts_str) if '.' in ts_str else int(ts_str)
                timesteps.add(ts)
            except ValueError:
                pass
        elif "_timestep_" in attr_name:
            parts = attr_name.split("_timestep_")
            if len(parts) == 2:
                try:
                    ts = float(parts[1]) if '.' in parts[1] else int(parts[1])
                    timesteps.add(ts)
                except ValueError:
                    pass
    
    def _convert_value(self, value: str, value_type: str) -> Any:
        if value_type in ("int", "long"):
            try:
                return int(value)
            except ValueError:
                return value
        elif value_type in ("float", "double"):
            try:
                return float(value)
            except ValueError:
                return value
        elif value_type == "boolean":
            return value.lower() in ("true", "1", "yes")
        else:
            return value
        
    def _parse_temporal_element(
        self, 
        element, 
        find_elements, 
        keys, 
        all_graph_timesteps: Set[int | float],
        has_temporal: bool,
        element_type: str
    ) -> List[Dict[str, Any]]:

        if element_type == "node":
            element_id = element.get("id")
            if not element_id:
                return []
            required_fields = {"id": element_id}
        else:
            source = element.get("source")
            target = element.get("target")
            if not source or not target:
                return []
            required_fields = {"source": source, "target": target}
        
        base_attributes = {}
        label_value = None
        base_weight = None
        existence_timesteps: Set[int | float] = set()
        timestep_attrs: Dict[int | float, Dict[str, Any]] = {}
        
        for data in find_elements(element, "data"):
            key_id = data.get("key")
            value = data.text
            
            if key_id in keys:
                key_info = keys[key_id]
                attr_name = key_info["name"]
                
                if attr_name.startswith("timestep_") and "_" not in attr_name[9:]:
                    try:
                        ts_str = attr_name[9:]
                        ts = float(ts_str) if '.' in ts_str else int(ts_str)
                        if value and value.lower() in ("true", "1", "yes"):
                            existence_timesteps.add(ts)
                        continue
                    except ValueError:
                        pass
                
                if value is not None:
                    typed_value = self._convert_value(value, key_info["type"])
                    
                    if element_type == "node" and attr_name.lower() in LABEL_ATTRIBUTE_NAMES:
                        if label_value is None:
                            label_value = typed_value
                    elif element_type == "edge" and attr_name in ("weight", "value"):
                        base_weight = typed_value
                    #extract timebased attributets
                    elif "_timestep_" in attr_name:
                        parts = attr_name.split("_timestep_")
                        if len(parts) == 2:
                            base_attr = parts[0]
                            try:
                                ts = float(parts[1]) if '.' in parts[1] else int(parts[1])
                                
                                if typed_value == "" or typed_value is None:
                                    continue
                                
                                if ts not in timestep_attrs:
                                    timestep_attrs[ts] = {}
                                
                                if element_type == "edge" and base_attr in ("weight", "value"):
                                    timestep_attrs[ts]["weight"] = typed_value
                                else:
                                    timestep_attrs[ts][base_attr] = typed_value
                            except ValueError:
                                base_attributes[attr_name] = typed_value
                        else:
                            base_attributes[attr_name] = typed_value
                    else:
                        base_attributes[attr_name] = typed_value
        
        results = []
        
        if has_temporal and (existence_timesteps or timestep_attrs):
            for ts in sorted(all_graph_timesteps):
                if ts in existence_timesteps:
                    entry: Dict[str, Any] = {
                        "timestep": ts,
                        **required_fields
                    }
                    
                    if element_type == "node" and label_value is not None:
                        entry["label"] = label_value
                    
                    if element_type == "edge":
                        if ts in timestep_attrs and "weight" in timestep_attrs[ts]:
                            entry["weight"] = timestep_attrs[ts]["weight"]
                        elif base_weight is not None:
                            entry["weight"] = base_weight
                    
                    # merge attributes
                    all_attrs = {}
                    if base_attributes:
                        all_attrs.update(base_attributes)
                    if ts in timestep_attrs:
                        for k, v in timestep_attrs[ts].items():
                            if not (element_type == "edge" and k == "weight"):
                                all_attrs[k] = v
                    
                    if all_attrs:
                        entry["attributes"] = all_attrs
                    
                    results.append(entry)
        else:
            entry: Dict[str, Any] = required_fields.copy()
            
            if element_type == "node" and label_value is not None:
                entry["label"] = label_value
            
            if element_type == "edge" and base_weight is not None:
                entry["weight"] = base_weight
            
            if base_attributes:
                entry["attributes"] = base_attributes
            
            results.append(entry)
        
        return results