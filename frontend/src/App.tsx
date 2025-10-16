import { starwarsData, testData2, testData3 } from "@/data/testData";
import { useDataStores } from "@/hooks/useDataStores";
import { useFullData } from "@/hooks/useFullData";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import CenterView from "./features/center-view/CenterView";
import Legend from "./features/center-view/Tooltips/Legend";
import { useViewPersistence } from "./features/center-view/ViewRendering/useViewPersistence";
import ChartFiltering from "./features/chart-filtering/ChartFiltering";
import ChartSettings from "./features/chart-settings/ChartSettings";
import DataFiltering from "./features/data-filtering/DataFiltering";
import { useProcessedData } from "./hooks/useProcessedData";

const datasets = {
  "Starwars Dataset": starwarsData,
  "Les Miserables Dataset": testData2,
  "Test Dataset": testData3,
};

const VIEW_KEY = "center-view-mode";
export type ViewType = "radial" | "node-link" | "data-table";

const App = () => {
  const { view, setView, isViewLoaded } = useViewPersistence(VIEW_KEY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadNetwork, clearAllData } = useDataStores();
  const [draggingBars, setDraggingBars] = useState<Record<string, boolean>>({});
  const handleDragging = (id: string) => (isDragging: boolean) => {
    setDraggingBars((prev) => ({ ...prev, [id]: isDragging }));
  };

  const { fullData, changes } = useFullData();
  const { data, dataMap, filteredNetwork, handlePreview, canPreview } =
    useProcessedData(fullData, changes);
  const handleLoadData = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      clearAllData();
      await loadNetwork(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to load data: ${errorMessage}`);
      console.error("Error loading dataset:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <PanelGroup direction="horizontal" className="flex">
        <Panel defaultSize={15} minSize={10} maxSize={25}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={60} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-x-hidden overflow-y-auto p-2 scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
                <ChartSettings
                  datasets={datasets}
                  onLoadData={handleLoadData}
                />
              </div>
            </Panel>
            <PanelResizeHandle
              onDragging={handleDragging("left-vert")}
              className={`h-2 transition-colors ${draggingBars["left-vert"] ? "bg-ring" : "bg-border"}`}
            />
            <Panel defaultSize={40} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-x-hidden overflow-y-auto p-2 scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
                <DataFiltering
                  view={view}
                  dataMap={dataMap}
                  filteredNetwork={filteredNetwork}
                />
              </div>
            </Panel>
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
            <CenterView
              data={data}
              dataMap={dataMap}
              filteredNetwork={filteredNetwork}
              lastChanges={changes}
              canPreview={canPreview}
              onPreview={handlePreview}
              view={view}
              onViewChange={setView}
              isViewLoaded={isViewLoaded}
            />
          )}
        </Panel>
        <PanelResizeHandle
          onDragging={handleDragging("middle-right")}
          className={`w-2 transition-colors ${draggingBars["middle-right"] ? "bg-ring" : "bg-border"}`}
        />
        <Panel defaultSize={20} minSize={15} maxSize={25}>
          <PanelGroup direction="vertical" className="flex">
            <Panel defaultSize={70} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-y-auto p-2 scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
                <ChartFiltering data={data} dataMap={dataMap} />
              </div>
            </Panel>
            <PanelResizeHandle
              onDragging={handleDragging("right-vert")}
              className={`h-2 transition-colors ${draggingBars["right-vert"] ? "bg-ring" : "bg-border"}`}
            />
            <Panel defaultSize={30} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-y-auto p-2 scrollbar-thumb-card-foreground scrollbar-thumb-rounded-full scrollbar-track-transparent">
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
