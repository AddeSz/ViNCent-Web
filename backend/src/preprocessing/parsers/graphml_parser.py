import io
import json
import logging
import xml.etree.ElementTree as ET
from typing import Any, Dict

from fastapi import HTTPException

logger = logging.getLogger(__name__)

LABEL_ATTRIBUTE_NAMES = {"label", "name", ".text", "text", "title", "node_label", "nodename", "node_name"}

# http://graphml.graphdrawing.org/
# handles both http://graphml.graphdrawing.org/xmlns and http://graphml.graphdrawing.org/xmlns/graphml 

def parse_graphml_to_network(content: bytes) -> Dict[str, Any]:
    try:
        tree = ET.parse(io.BytesIO(content))
        root = tree.getroot()
        
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
        
        # extract metadata about attributes (keys)
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
        
        nodes = []
        for node in find_elements(graph, "node"):
            node_id = node.get("id")
            if not node_id:
                continue
            
            node_data = {"id": node_id}
            attributes = {}
            history = []
            label_value = None
            
            for data in find_elements(node, "data"):
                key_id = data.get("key")
                value = data.text
                
                if key_id in keys and value is not None:
                    key_info = keys[key_id]
                    attr_name = key_info["name"]
                    
                    typed_value = convert_graphml_value(value, key_info["type"])
                    
                    if attr_name.lower() in LABEL_ATTRIBUTE_NAMES:
                        #only set label if we havent found one yet (first match)
                        if label_value is None:
                            label_value = typed_value
                    elif attr_name == "history" or attr_name == "timeline":
                        try:
                            history = json.loads(typed_value) if isinstance(typed_value, str) else typed_value
                        except:
                            attributes[attr_name] = typed_value
                    elif attr_name.startswith("timestep_"):
                        timestep_num = int(attr_name.split("_")[1])
                        history.append({
                            "timestep": timestep_num,
                            "value": typed_value
                        })
                    else:
                        attributes[attr_name] = typed_value
            
            if label_value is not None:
                node_data["label"] = label_value
            
            if attributes:
                node_data["attributes"] = attributes
            if history:
                node_data["history"] = history
            
            nodes.append(node_data)
        
        links = []
        for edge in find_elements(graph, "edge"):
            source = edge.get("source")
            target = edge.get("target")
            
            if not source or not target:
                continue
            
            edge_data = {
                "source": source,
                "target": target
            }
            
            for data in find_elements(edge, "data"):
                key_id = data.get("key")
                value = data.text
                
                if key_id in keys and value is not None:
                    key_info = keys[key_id]
                    attr_name = key_info["name"]
                    typed_value = convert_graphml_value(value, key_info["type"])
                    
                    if attr_name in ("weight", "value"):
                        edge_data["weight"] = typed_value
                    else:
                        edge_data[attr_name] = typed_value
            
            links.append(edge_data)
        
        logger.info(f"Parsed GraphML: {len(nodes)} nodes, {len(links)} edges")
        
        return {
            "nodes": nodes,
            "links": links
        }
        
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


def convert_graphml_value(value: str, value_type: str) -> Any:
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