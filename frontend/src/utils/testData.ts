import type { Network, Centrality } from "@/types/network";
import n50 from "./network_test_data_n50.json"
import n150 from "./network_test_data_n150.json"
export const testData1: Network = n50;
export const testData2: Network = n150;
export const testData3 = {
  nodes: [
    { id: "n1", label: "Alice", attributes: { role: "Engineer", team: "A" } },
    { id: "n2", label: "Bob", attributes: { role: "Designer", team: "A" } },
    { id: "n3", label: "Charlie", attributes: { role: "Engineer", team: "B" } },
    { id: "n4", label: "Diana", attributes: { role: "Manager", team: "A" } },
    { id: "n5", label: "Eve", attributes: { role: "Engineer", team: "B" } },
    { id: "n6", label: "Frank", attributes: { role: "Product", team: "C" } },
  ],
  edges: [
    {
      source: "n1",
      target: "n2",
      weight: 0.8,
      attributes: { relation: "coworker" },
    },
    {
      source: "n1",
      target: "n4",
      weight: 0.9,
      attributes: { relation: "reports_to" },
    },
    {
      source: "n2",
      target: "n4",
      weight: 0.6,
      attributes: { relation: "reports_to" },
    },
    {
      source: "n3",
      target: "n5",
      weight: 0.7,
      attributes: { relation: "peer" },
    },
    {
      source: "n5",
      target: "n6",
      weight: 0.5,
      attributes: { relation: "collaborates_with" },
    },
    {
      source: "n4",
      target: "n6",
      weight: 0.4,
      attributes: { relation: "stakeholder" },
    },
  ],
};

export function generateCentralityData(network: Network): Centrality[] {
  return network.nodes.map((node) => {
    const entry: Centrality = { id: node.id };
    for (let i = 0; i < 10; i++) {
      entry[`centrality${i}`] = Math.random()*(i+1);
    }
    return entry;
  });
}
