import json

INPUT_FILE = "co_author_graph.json"
OUTPUT_FILE = "co_author_network.json"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data["nodes"]
links = data["links"]

node_map = {}
for node in nodes:
    node_id = f"n{node['nid']}"
    
    attributes = {}
    for key, value in node.items():
        if key not in ["nid", "name", "x", "y", "degree", "betweenness", "co_authors"]:
            attributes[key] = value
    
    node_map[node["nid"]] = {
        "id": node_id,
        "label": node["name"],
        "attributes": attributes
    }

graph_links = []
for link in links:
    source_id = node_map[link["source"]]["id"]
    target_id = node_map[link["target"]]["id"]
    
    graph_links.append({
        "source": source_id,
        "target": target_id,
        "weight": 1,
        "directed": False
    })

graph = {
    "nodes": list(node_map.values()),
    "links": graph_links
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(graph, f, indent=2)