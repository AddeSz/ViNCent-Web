import { ModeToggle } from "@/components/shadcnUI/mode-toggle";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useState, useEffect } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { testData2 } from "@/utils/testData";
import CenterView from "@/features/center-view-feature/CenterView";
import ChartSettings from "@/features/chart-settings-feature/ChartSettings";
import DataFiltering from "@/features/data-filtering-feature/DataFiltering";
import type { Network, Centrality } from "@/types/network";
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface BackendNetworkData {
  nodes: Array<{ id: string; [key: string]: any }>;
  edges: Array<{ source: string; target: string; [key: string]: any }>;
}

const prepareNetworkForBackend = (network: Network): BackendNetworkData => {
  return {
    nodes: network.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      attributes: node.attributes,
      ...(node.label && { label: node.label }),
      ...(node.attributes && { attributes: node.attributes }),
    })),
    edges: network.edges.map((edge) => ({
      source: typeof edge.source === "string" ? edge.source : edge.source.id,
      target: typeof edge.target === "string" ? edge.target : edge.target.id,
      weight: edge.weight || 1.0,
      directed: edge.directed || false,
      attributes: edge.attributes,
      ...(edge.weight && { weight: edge.weight }),
      ...(edge.directed !== undefined && { directed: edge.directed }),
      ...(edge.attributes && { attributes: edge.attributes }),
    })),
  };
};

const calculateCentralityValues = async (
  networkData: Network,
  centralities?: string[],
): Promise<Centrality[]> => {
  try {
    const backendData = {
      network: prepareNetworkForBackend(networkData),
      ...(centralities ? { centralities } : {}),
    };

    const response = await fetch(`${API_BASE_URL}/calculate-centrality-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const backendCentralityData = await response.json();

    return Object.entries(
      backendCentralityData as Record<string, Record<string, string | number>>,
    ).map(([nodeId, centralities]) => ({
      id: nodeId,
      ...centralities,
    }));
  } catch (error) {
    console.error("Error calculating centrality values:", error);
    throw error;
  }
};

const App = () => {
  const [draggingBars, setDraggingBars] = useState<Record<string, boolean>>({});
  const [, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const handleDragging = (id: string) => (isDragging: boolean) => {
    setDraggingBars((prev) => ({ ...prev, [id]: isDragging }));
  };
  const { setNetwork, setCentralityData } = useDataStore();
  useEffect(() => {
    const loadNetworkAndCalculateCentrality = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = testData2;
        setNetwork(data);

        const centralityData = await calculateCentralityValues(data);
        setCentralityData(centralityData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(`Failed to calculate centrality values: ${errorMessage}`);
        console.error("Error in network analysis:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNetworkAndCalculateCentrality();
  }, [setNetwork, setCentralityData]);

  return (
    <div className="flex h-full">
      <PanelGroup direction="horizontal" className="flex">
        <Panel defaultSize={20} minSize={10}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={60} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-x-hidden overflow-y-auto p-2 [scrollbar-gutter:stable] scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
                <ModeToggle />
                <ChartSettings />
              </div>
            </Panel>
            <PanelResizeHandle
              onDragging={handleDragging("left-vert")}
              className={`h-2 transition-colors ${draggingBars["left-vert"] ? "bg-ring" : "bg-border"}`}
            />
            <Panel defaultSize={40} minSize={10}></Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle
          onDragging={handleDragging("middle-left")}
          className={`w-2 transition-colors ${draggingBars["middle-left"] ? "bg-ring" : "bg-border"}`}
        />
        <Panel defaultSize={60} minSize={50}>
          <CenterView />
        </Panel>
        <PanelResizeHandle
          onDragging={handleDragging("middle-right")}
          className={`w-2 transition-colors ${draggingBars["middle-right"] ? "bg-ring" : "bg-border"}`}
        />
        <Panel defaultSize={20} minSize={10}>
          <PanelGroup direction="vertical" className="flex">
            <Panel defaultSize={60} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-y-auto p-2 [scrollbar-gutter:stable] scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
                <DataFiltering />
              </div>
            </Panel>
            <PanelResizeHandle
              onDragging={handleDragging("right-vert")}
              className={`h-2 transition-colors ${draggingBars["right-vert"] ? "bg-ring" : "bg-border"}`}
            />
            <Panel defaultSize={40} minSize={10}></Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
