import json
import random

random.seed(42)

NUM_NODES = 2000
NUM_LINKS = 5000
MODE = "hierarchical"  # "clustered" or "interactions" or "hierarchical"
OUTPUT_FILE = f"network_{MODE}_n{NUM_NODES}_l{NUM_LINKS}.json"

names = [
    "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace",
    "Hank", "Ivy", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia",
    "Paul", "Quinn", "Rita", "Sam", "Tina", "Uma", "Victor", "Wendy",
    "Xavier", "Yara", "Zane"
]

roles = ["Engineer", "Designer", "Manager", "Product", "Analyst"]
teams = ["A", "B", "C", "D", "E"]

nodes = []
for i in range(1, NUM_NODES + 1):
    name = names[(i - 1) % len(names)]
    role = roles[(i - 1) % len(roles)]
    team = teams[(i - 1) % len(teams)]

    nodes.append({
        "id": f"n{i}",
        "label": f"{name} {i}",
        "attributes": {
            "role": role,
            "team": team
        }
    })

team_members = {team: [n["id"] for n in nodes if n["attributes"]["team"] == team] for team in teams}
liaisons = {
    team: random.sample(members, min(random.randint(2, 5), len(members)))
    for team, members in team_members.items()
}

links = []
link_set = set()


if MODE == "clustered":
    for _ in range(NUM_LINKS):
        r = random.random()
        if r < 0.7:
            team = random.choice(teams)
            members = team_members[team]
            if len(members) >= 2:
                source, target = random.sample(members, 2)
            else:
                continue
        elif r < 0.94:
            team1, team2 = random.sample(teams, 2)
            source = random.choice(liaisons[team1])
            target = random.choice(liaisons[team2])
        else:
            team1, team2 = random.sample(teams, 2)
            source = random.choice(team_members[team1])
            target = random.choice(team_members[team2])

        pair = tuple(sorted((source, target)))
        if source != target and pair not in link_set:
            link_set.add(pair)
            links.append({"source": source, "target": target})


elif MODE == "interactions":
    num_hubs = max(3, NUM_NODES // 50)
    hubs = random.sample([n["id"] for n in nodes], num_hubs)

    for _ in range(NUM_LINKS):
        r = random.random()
        if r < 0.75:
            source = random.choice([n["id"] for n in nodes if n["id"] not in hubs])
            target = random.choice(hubs)
        elif r < 0.9:
            source = random.choice(hubs)
            target = random.choice([n["id"] for n in nodes if n["id"] not in hubs])
        else:
            source, target = random.sample([n["id"] for n in nodes], 2)

        pair = tuple(sorted((source, target)))
        if source != target and pair not in link_set:
            link_set.add(pair)
            links.append({"source": source, "target": target})

    for node in nodes:
        node["attributes"]["is_hub"] = node["id"] in hubs

elif MODE == "hierarchical":
    levels = 5
    nodes_per_level = NUM_NODES // levels
    hierarchy = [nodes[i * nodes_per_level:(i + 1) * nodes_per_level] for i in range(levels)]

    for i in range(1, levels):
        for node in hierarchy[i]:
            parent = random.choice(hierarchy[i - 1])
            links.append({"source": parent["id"], "target": node["id"]})
else:
    raise ValueError(f"Unknown MODE: {MODE}")


linked_node_ids = {link["source"] for link in links}.union({link["target"] for link in links})
nodes = [node for node in nodes if node["id"] in linked_node_ids]

graph = {
    "nodes": nodes,
    "links": links
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(graph, f, indent=2, ensure_ascii=False)
