import FileUploader from "@/components/file-uploader/FileUploader";
import Legend from "@/components/Legend";
import { Spinner } from "@/components/ui/spinner";
import CenterView from "@/features/center-view/CenterView";
import { useViewPersistence } from "@/features/center-view/ViewRendering/useViewPersistence";
import ChartFiltering from "@/features/chart-filtering/ChartFiltering";
import { useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ViewSettings from "./features/view-settings/ViewSettings";
import { useFilteredData } from "./hooks/useFilteredData";
import { useProcessedData } from "./hooks/useProcessedData";
import { useNetworkStore } from "./stores/useNetworkStore";

const VIEW_KEY = "center-view-mode";
export type ViewType = "radial" | "node-link" | "data-table";

type LoadStatus = "idle" | "loading" | "error" | "ready";

const App = () => {
  const { view, setView, isViewLoaded } = useViewPersistence(VIEW_KEY);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const [draggingBars, setDraggingBars] = useState<Record<string, boolean>>({});

  const { nodeMap, edgeMap, nodeChanges, edgeChanges } = useFilteredData();
  const { nodeData, edgeData, filteredNetwork, handlePreview, canPreview } =
    useProcessedData(nodeMap, edgeMap, nodeChanges, edgeChanges);
  const currentDataset = useNetworkStore((s) => s.currentDataset);
  const directed = useNetworkStore((s) => s.directed);

  const handleLoadingStart = () => {
    setStatus("loading");
    setError(null);
  };

  const handleLoadingComplete = () => {
    setStatus("ready");
  };

  const handleLoadingError = (errorMessage: string) => {
    setError(errorMessage);
    setStatus("error");
  };

  const handleDragging = (id: string) => (isDragging: boolean) => {
    setDraggingBars((prev) => ({ ...prev, [id]: isDragging }));
  };

  return (
    <div className="flex h-full">
      <PanelGroup direction="horizontal" className="flex">
        <Panel defaultSize={15} minSize={12} maxSize={22}>
          <div className="flex h-full w-full flex-col bg-card">
            <div className="scrollbar-thin flex-1 overflow-x-hidden overflow-y-auto">
              <ViewSettings
                onLoadingStart={handleLoadingStart}
                onLoadingComplete={handleLoadingComplete}
                onLoadingError={handleLoadingError}
                view={view}
              />
            </div>
            {currentDataset !== null && directed !== null && (
              <div className="border-t-2 border-border bg-background px-2 pt-1 pb-2">
                <div className="text-xs text-muted-foreground">
                  <p className="truncate">Data: {currentDataset}</p>
                  <p className="truncate">
                    Graph Type: {directed ? "Directed" : "Undirected"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle
          onDragging={handleDragging("middle-left")}
          className={`w-2 transition-colors ${draggingBars["middle-left"] ? "bg-ring" : "bg-border"}`}
        />

        <Panel defaultSize={65} minSize={50}>
          {status === "loading" && (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <Spinner className="size-10" />
              <p className="text-center text-sm text-muted-foreground">
                Processing dataset and calculating centrality values...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <p className="text-center text-red-500">{error}</p>
              <div className="w-40">
                <FileUploader
                  onLoadingStart={handleLoadingStart}
                  onLoadingComplete={handleLoadingComplete}
                  onLoadingError={handleLoadingError}
                />
              </div>
            </div>
          )}

          {status === "idle" && (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <p className="text-center text-muted-foreground">
                No data loaded. Select or import a dataset to begin.
              </p>
              <div className="w-40">
                <FileUploader
                  onLoadingStart={handleLoadingStart}
                  onLoadingComplete={handleLoadingComplete}
                  onLoadingError={handleLoadingError}
                />
              </div>
            </div>
          )}

          {status === "ready" && (
            <CenterView
              nodeMap={nodeData}
              edgeData={edgeData}
              filteredNetwork={filteredNetwork}
              nodeChanges={nodeChanges}
              edgeChanges={edgeChanges}
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

        <Panel defaultSize={20} minSize={15} maxSize={55}>
          <PanelGroup direction="vertical" className="flex">
            <Panel defaultSize={70} minSize={10}>
              <div className="h-full w-full">
                <ChartFiltering nodeData={nodeData} edgeData={edgeData} />
              </div>
            </Panel>
            <PanelResizeHandle
              onDragging={handleDragging("right-vert")}
              className={`h-2 transition-colors ${draggingBars["right-vert"] ? "bg-ring" : "bg-border"}`}
            />
            <Panel defaultSize={30} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-y-auto p-2">
                <Legend nodeData={nodeData} />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
