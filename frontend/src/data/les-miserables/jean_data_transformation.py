import json
import re

DATA_FILE = "jean.dat"
OUTPUT_FILE = "les_miserables_network.json"

def clean_label(text):
    latex_accents = {
        r"\'e": "é", r"\'E": "É", r"\`e": "è", r"\`E": "È",
        r"\^o": "ô", r"\^O": "Ô", r"\^e": "ê", r"\^E": "Ê",
        r"\'a": "á", r"\'A": "Á", r"\`a": "à", r"\`A": "À",
        r"\'i": "í", r"\'I": "Í", r"\'o": "ó", r"\'O": "Ó",
        r"\"e": "ë", r"\"E": "Ë", r"\c{c}": "ç", r"\c{C}": "Ç",
    }
    for latex, unicode_char in latex_accents.items():
        text = text.replace(latex, unicode_char)
    text = text.replace("\\", "")
    text = re.sub(r"\s+", " ", text).strip()
    return text


with open(DATA_FILE, "r", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip() and not line.startswith("*")]

nodes = {}
parsing_characters = True
for line in lines:
    if ":" in line:
        parsing_characters = False

    if parsing_characters and ":" not in line:
        parts = line.split(None, 1)
        if len(parts) == 2:
            code = parts[0]
            name = parts[1].split(",")[0]
            nodes[code] = {
                "id": code,
                "label": clean_label(name),
            }

link_counts = {}
for line in lines:
    if ":" in line:
        parts = line.split(":")
        if len(parts) == 2:
            interactions = parts[1]
            groups = interactions.split(";")
            for group in groups:
                chars = [c.strip() for c in group.split(",")]
                for i in range(len(chars)):
                    for j in range(i+1, len(chars)):
                        source, target = sorted((chars[i], chars[j]))
                        key = (source, target)
                        link_counts[key] = link_counts.get(key, 0) + 1

graph_links = []
nodes_with_links = set()
for (source, target), weight in link_counts.items():
    if source in nodes and target in nodes:
        graph_links.append({
            "source": source,
            "target": target,
            "weight": weight
        })
        nodes_with_links.update([source, target])


filtered_nodes = [node for code, node in nodes.items() if code in nodes_with_links]

graph = {
    "nodes": filtered_nodes,
    "links": graph_links
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(graph, f, indent=2, ensure_ascii=False)
