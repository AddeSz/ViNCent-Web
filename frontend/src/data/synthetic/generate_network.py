import json
import random

random.seed(42)

NUM_NODES = 4000
NUM_LINKS = 8000
MODE = "clustered"  # "clustered" or "interactions" or "hierarchical"
OUTPUT_FILE = f"network_{MODE}_n{NUM_NODES}_l{NUM_LINKS}.json"

names = [
    "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace",
    "Hank", "Ivy", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia",
    "Paul", "Quinn", "Rita", "Sam", "Tina", "Uma", "Victor", "Wendy",
    "Xavier", "Yara", "Zane"
]

roles = ["Engineer", "Designer", "Manager", "Product", "Analyst"]
teams = ["A", "B", "C", "D", "E", "F", "G"]

nodes = []
team_sizes = {}
target_size = NUM_NODES // len(teams)
variance = target_size // 3 

for team in teams:
    team_sizes[team] = target_size + random.randint(-variance, variance)

total = sum(team_sizes.values())
diff = NUM_NODES - total
team_sizes[random.choice(teams)] += diff

sub_teams = {}
for team in teams:
    num_subs = random.randint(2, 4)
    sub_teams[team] = [f"{team}{i}" for i in range(1, num_subs + 1)]

node_id = 1
team_members = {team: [] for team in teams}
sub_team_members = {}

for team in teams:
    subs = sub_teams[team]
    sub_team_members.update({sub: [] for sub in subs})
    
    for _ in range(team_sizes[team]):
        name = names[(node_id - 1) % len(names)]
        
        role_weights = [0.4, 0.2, 0.1, 0.2, 0.1]
        role = random.choices(roles, weights=role_weights)[0]
        
        sub_team = random.choice(subs)
        
        node = {
            "id": f"n{node_id}",
            "label": f"{name} {node_id}",
            "attributes": {
                "role": role,
                "team": team,
                "sub_team": sub_team
            }
        }
        nodes.append(node)
        team_members[team].append(node["id"])
        sub_team_members[sub_team].append(node["id"])
        node_id += 1

liaisons = {}
for team in teams:
    team_nodes = [n for n in nodes if n["attributes"]["team"] == team]
    managers = [n["id"] for n in team_nodes if n["attributes"]["role"] == "Manager"]
    others = [n["id"] for n in team_nodes if n["attributes"]["role"] != "Manager"]
    
    num_liaisons = min(len(team_nodes) // 10, len(team_nodes))
    liaisons[team] = managers + random.sample(others, max(0, num_liaisons - len(managers)))

links = []
link_set = set()

if MODE == "clustered":
    for _ in range(NUM_LINKS):
        r = random.random()
        
        if r < 0.5:
            sub_team = random.choice([st for st in sub_team_members.keys()])
            members = sub_team_members[sub_team]
            if len(members) >= 2:
                source, target = random.sample(members, 2)
            else:
                continue
        
        elif r < 0.75:
            team = random.choice(teams)
            subs = sub_teams[team]
            if len(subs) >= 2:
                sub1, sub2 = random.sample(subs, 2)
                if sub_team_members[sub1] and sub_team_members[sub2]:
                    source = random.choice(sub_team_members[sub1])
                    target = random.choice(sub_team_members[sub2])
                else:
                    continue
            else:
                continue
        
        elif r < 0.9:
            team1, team2 = random.sample(teams, 2)
            if liaisons[team1] and liaisons[team2]:
                source = random.choice(liaisons[team1])
                target = random.choice(liaisons[team2])
            else:
                continue
        
        else:
            role = random.choice(roles)
            role_nodes = [n["id"] for n in nodes if n["attributes"]["role"] == role]
            if len(role_nodes) >= 2:
                source, target = random.sample(role_nodes, 2)
                source_team = next(n["attributes"]["team"] for n in nodes if n["id"] == source)
                target_team = next(n["attributes"]["team"] for n in nodes if n["id"] == target)
                if source_team == target_team:
                    continue
            else:
                continue
        
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
