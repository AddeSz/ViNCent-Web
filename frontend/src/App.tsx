import FileUploader from "@/components/FileUploader";
import Legend from "@/components/Legend";
import { Spinner } from "@/components/ui/spinner";
import { miserablesData, starwarsData, testDataSmall } from "@/data/testData";
import CenterView from "@/features/center-view/CenterView";
import { useViewPersistence } from "@/features/center-view/ViewRendering/useViewPersistence";
import ChartFiltering from "@/features/chart-filtering/ChartFiltering";
import ChartSettings from "@/features/chart-settings/ChartSettings";
import DataFiltering from "@/features/data-filtering/DataFiltering";
import { useDataStores } from "@/hooks/useDataStores";
import { useFullData } from "@/hooks/useFullData";
import { useProcessedData } from "@/hooks/useProcessedData";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const datasets = {
  "Starwars Dataset": starwarsData,
  "Les Miserables Dataset": miserablesData,
  // "Test Dataset": testData,
  "Test Dataset Small": testDataSmall,
  // "Test Dataset Time": testDataTime,
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
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());
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
      let errorMessage = "Unknown error occurred";

      if (err instanceof Error) {
        if (
          err.message.includes("NetworkError") ||
          err.message.includes("fetch")
        ) {
          errorMessage =
            "Failed to connect to the server. Please check your connection.";
        } else if (err.message.includes("422")) {
          errorMessage =
            "Invalid dataset format. Please ensure your JSON has valid nodes and links.";
        } else if (err.message.includes("400")) {
          errorMessage = "Bad request. Please check your dataset format.";
        } else if (err.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.message.includes("JSON")) {
          errorMessage = "Invalid data format. Please check your dataset.";
        } else if (err.message.includes("timeout")) {
          errorMessage =
            "Request timed out. The server took too long to respond.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
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
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Spinner className="size-10" />
              <p className="text-sm text-muted-foreground">
                Processing dataset and calculating centrality values...
              </p>
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <p className="text-red-500">{error}</p>
              </div>
              <FileUploader datasets={datasets} onLoadData={handleLoadData} />
            </div>
          ) : isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground">
                No data loaded. Select or import a dataset to begin.
              </p>
              <FileUploader datasets={datasets} onLoadData={handleLoadData} />
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
