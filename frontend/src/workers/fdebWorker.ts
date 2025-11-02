import {
  ForceEdgeBundling,
  type Edge,
  type ForceEdgeBundlingOptions,
  type ForceNode,
} from "@/utils/ForceEdgeBundling";

self.onmessage = (e: MessageEvent) => {
  const { nodes, edges, settings } = e.data as {
    nodes: ForceNode[];
    edges: Edge[];
    settings: ForceEdgeBundlingOptions;
  };

  try {
    const bundler = new ForceEdgeBundling(settings)
      .setNodes(nodes)
      .setEdges(edges);

    const result = bundler.bundle();

    (self as unknown as Worker).postMessage({ type: "result", result });
  } catch (error) {
    (self as unknown as Worker).postMessage({
      type: "error",
      error: (error as Error).message,
    });
  }
};

export {};
