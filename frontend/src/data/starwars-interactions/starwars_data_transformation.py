import json
import os
from glob import glob

DATA_DIR = ""
OUTPUT_FILE = "starwars_network.json"

with open(os.path.join(DATA_DIR, "starwars-full-interactions-allCharacters.json"), "r") as f:
    full_data = json.load(f)

nodes = full_data["nodes"]
links = full_data["links"]

node_map = {}
for i, node in enumerate(nodes, start=1):
    node_id = f"n{i}"
    node_map[i - 1] = {
        "id": node_id,
        "label": node["name"],
        "base_attributes": {
            "value": node["value"],
            "colour": node["colour"]
        },
        "episodes": set()
    }

actual_edge_episodes = {}

episode_files = sorted(glob(os.path.join(DATA_DIR, "starwars-episode-*-interactions-allCharacters.json")))
for filepath in episode_files:
    episode_number = int(filepath.split("episode-")[1].split("-")[0])
    
    with open(filepath, "r") as f:
        episode_data = json.load(f)
    
    ep_name_to_idx = {}
    for ep_node in episode_data["nodes"]:
        name = ep_node["name"].strip().upper()
        for idx, node in node_map.items():
            if node["label"].strip().upper() == name:
                node_map[idx]["episodes"].add(episode_number)
                ep_name_to_idx[name] = idx
                break
    
    for ep_link in episode_data["links"]:
        source_name = episode_data["nodes"][ep_link["source"]]["name"].strip().upper()
        target_name = episode_data["nodes"][ep_link["target"]]["name"].strip().upper()
        
        if source_name in ep_name_to_idx and target_name in ep_name_to_idx:
            source_idx = ep_name_to_idx[source_name]
            target_idx = ep_name_to_idx[target_name]
            
            source_id = node_map[source_idx]["id"]
            target_id = node_map[target_idx]["id"]
            
            edge_key = tuple(sorted([source_id, target_id]))
            
            if edge_key not in actual_edge_episodes:
                actual_edge_episodes[edge_key] = {
                    "episodes": set(),
                    "value": ep_link["value"]
                }
            actual_edge_episodes[edge_key]["episodes"].add(episode_number)

flat_nodes = []
for node_data in node_map.values():
    for episode in sorted(node_data["episodes"]):
        flat_nodes.append({
            "id": node_data["id"],
            "label": node_data["label"],
            "timestep": episode,
            "attributes": node_data["base_attributes"]
        })

flat_edges = []
for (source_id, target_id), edge_data in actual_edge_episodes.items():
    for episode in sorted(edge_data["episodes"]):
        flat_edges.append({
            "source": source_id,
            "target": target_id,
            "timestep": episode,
            "attributes": {"value": edge_data["value"]}
        })

graph = {
    "nodes": flat_nodes,
    "edges": flat_edges,
    "directed": False
}

with open(OUTPUT_FILE, "w") as f:
    json.dump(graph, f, indent=2)
