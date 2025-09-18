// import { ModeToggle } from "@/components/shadcnUI/mode-toggle";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useState, useEffect } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { testData2 } from "@/data/testData";
import CenterView from "@/features/center-view-feature/CenterView";
import ChartSettings from "@/features/chart-settings-feature/ChartSettings";
import DataFiltering from "@/features/data-filtering-feature/DataFiltering";
import { useChartSettings } from "@/hooks/useChartSettings";
import Legend from "./features/center-view-feature/components/Tooltips/Legend";
import {
  calculateLinkCounts,
  calculateRadialSettings,
} from "@/utils/networkProcessing";
import { calculateCentralityValues } from "@/utils/networkBackend";
import { defaultRadialSettings } from "@/hooks/useChartSettings";

const App = () => {
  const [draggingBars, setDraggingBars] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadNetwork, loadCentralityData } = useDataStore();

  const handleDragging = (id: string) => (isDragging: boolean) => {
    setDraggingBars((prev) => ({ ...prev, [id]: isDragging }));
  };
  useEffect(() => {
    const loadNetworkAndCalculateCentrality = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = calculateLinkCounts(testData2);
        loadNetwork(data);

        const calculatedRadial = calculateRadialSettings(data.nodes.length);
        useChartSettings.getState().setInitialRadialSettings({
          ...defaultRadialSettings,
          ...calculatedRadial,
        });

        const centralityData = await calculateCentralityValues(testData2);
        loadCentralityData(centralityData);
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
  }, []);

  return (
    <div className="flex h-full">
      <PanelGroup direction="horizontal" className="flex">
        <Panel defaultSize={15} minSize={10}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={60} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-x-hidden overflow-y-auto p-2 [scrollbar-gutter:stable] scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
                {/* <ModeToggle /> */}
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
        <Panel defaultSize={65} minSize={50}>
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              Loading…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-red-500">
              {error}
            </div>
          ) : (
            <CenterView />
          )}
        </Panel>
        <PanelResizeHandle
          onDragging={handleDragging("middle-right")}
          className={`w-2 transition-colors ${draggingBars["middle-right"] ? "bg-ring" : "bg-border"}`}
        />
        <Panel defaultSize={20} minSize={10}>
          <PanelGroup direction="vertical" className="flex">
            <Panel defaultSize={70} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-y-auto p-2 [scrollbar-gutter:stable] scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
                <DataFiltering />
              </div>
            </Panel>
            <PanelResizeHandle
              onDragging={handleDragging("right-vert")}
              className={`h-2 transition-colors ${draggingBars["right-vert"] ? "bg-ring" : "bg-border"}`}
            />
            <Panel defaultSize={30} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-y-auto p-2 [scrollbar-gutter:stable] scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
                <Legend />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
