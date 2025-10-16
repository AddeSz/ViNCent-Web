import json
import os
from glob import glob

DATA_DIR = "./starwars-interactions"
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
        "attributes": {
            "value": node["value"],
            "colour": node["colour"]
        },
        "history": []
    }

episode_files = sorted(glob(os.path.join(DATA_DIR, "starwars-episode-*-interactions-allCharacters.json")))

for filepath in episode_files:
    episode_number = int(filepath.split("episode-")[1].split("-")[0])
    with open(filepath, "r") as f:
        episode_data = json.load(f)

    for ep_node in episode_data["nodes"]:
        name = ep_node["name"].strip()
        for node in node_map.values():
            if node["label"].strip().upper() == name.upper():
                node["history"].append({"timestep": episode_number})
                break

graph_links = []
for link in links:
    source_id = node_map[link["source"]]["id"]
    target_id = node_map[link["target"]]["id"]
    graph_links.append({
        "source": source_id,
        "target": target_id,
        "attributes": {"value": link["value"]}
    })

graph = {
    "nodes": list(node_map.values()),
    "links": graph_links
}

with open(OUTPUT_FILE, "w") as f:
    json.dump(graph, f, indent=2)
