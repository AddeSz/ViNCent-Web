import Legend from "@/components/Legend";
import CenterView from "@/features/center-view/CenterView";
import { useViewPersistence } from "@/features/center-view/ViewRendering/useViewPersistence";
import ChartFiltering from "@/features/chart-filtering/ChartFiltering";
import { useEffect, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { TaskStatus } from "./api";
import FileUploader from "./components/file-uploader/FileUploader";
import { useFileUploaderState } from "./components/file-uploader/useFileUploaderState";
import { ProcessingProgress } from "./components/ProcessingProgress";
import ViewSettings from "./features/view-settings/ViewSettings";
import { useFilterData } from "./hooks/useFilterData";
import { useProcessData } from "./hooks/useProcessData";
import { useValidateSettings } from "./hooks/useValidateSettings";
import { useNetworkStore } from "./stores/useNetworkStore";
import { useOptionsStore } from "./stores/useOptionsStore";

const VIEW_KEY = "center-view-mode";
export type ViewType = "radial" | "node-link" | "data-table";

type AppState =
  | { phase: "idle" }
  | { phase: "loading"; task: TaskStatus | null }
  | { phase: "error"; message: string }
  | { phase: "ready" };

const App = () => {
  const { view, setView, isViewLoaded } = useViewPersistence(VIEW_KEY);
  const [appState, setAppState] = useState<AppState>({ phase: "idle" });
  const [draggingBars, setDraggingBars] = useState<Record<string, boolean>>({});

  const fetchOptions = useOptionsStore((s) => s.fetchOptions);
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const fileUploaderState = useFileUploaderState();

  const { flaggedNodeData, flaggedEdgeData, nodeChanges, edgeChanges } =
    useFilterData();

  const {
    viewNodeData,
    viewEdgeData,
    visibleNodeData,
    visibleEdgeData,
    renderableNetwork,
    confirmRemovals,
    canConfirm,
  } = useProcessData(
    flaggedNodeData,
    flaggedEdgeData,
    nodeChanges,
    edgeChanges,
  );

  useValidateSettings();
  const currentDataset = useNetworkStore((s) => s.currentDataset);
  const directed = useNetworkStore((s) => s.directed);

  const handleLoadingStart = () =>
    setAppState({ phase: "loading", task: null });

  const handleProgress = (task: TaskStatus) =>
    setAppState({ phase: "loading", task });

  const handleLoadingComplete = () => {
    setAppState({ phase: "ready" });
    fileUploaderState.clearDataSelection();
  };

  const handleLoadingError = (message: string) =>
    setAppState({ phase: "error", message });

  const handleDragging = (id: string) => (isDragging: boolean) => {
    setDraggingBars((prev) => ({ ...prev, [id]: isDragging }));
  };

  const isNotReady = appState.phase === "idle" || appState.phase === "error";

  return (
    <div className="flex h-full">
      <PanelGroup direction="horizontal" className="flex">
        <Panel defaultSize={15} minSize={12} maxSize={22}>
          <div className="flex h-full w-full flex-col bg-card">
            <div className="scrollbar-thin flex-1 overflow-x-hidden overflow-y-auto">
              <div className="flex flex-col pb-4">
                <div className="flex items-center border-b-2 bg-background px-2 pt-2 pb-1.5">
                  <span className="truncate text-lg">ViNCent Web</span>
                </div>

                <div className="border-b-2 bg-background px-2 py-2">
                  <FileUploader
                    onLoadingStart={handleLoadingStart}
                    onLoadingComplete={handleLoadingComplete}
                    onLoadingError={handleLoadingError}
                    onProgress={handleProgress}
                    fileUploaderState={fileUploaderState}
                  />
                </div>

                <ViewSettings view={view} />
              </div>
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
          {appState.phase === "loading" && (
            <ProcessingProgress task={appState.task} />
          )}

          {isNotReady && (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <p
                className={`text-center ${
                  appState.phase === "error"
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {appState.phase === "error"
                  ? appState.message
                  : "No data loaded. Select or import a dataset to begin."}
              </p>

              <div className="w-40">
                <FileUploader
                  onLoadingStart={handleLoadingStart}
                  onLoadingComplete={handleLoadingComplete}
                  onLoadingError={handleLoadingError}
                  onProgress={handleProgress}
                  fileUploaderState={fileUploaderState}
                />
              </div>
            </div>
          )}

          {appState.phase === "ready" && (
            <CenterView
              nodeData={viewNodeData}
              edgeData={viewEdgeData}
              visibleNodeData={visibleNodeData}
              visibleEdgeData={visibleEdgeData}
              renderableNetwork={renderableNetwork}
              nodeChanges={nodeChanges}
              edgeChanges={edgeChanges}
              canConfirm={canConfirm}
              confirmRemovals={confirmRemovals}
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
                <ChartFiltering
                  nodeData={visibleNodeData}
                  edgeData={visibleEdgeData}
                />
              </div>
            </Panel>
            <PanelResizeHandle
              onDragging={handleDragging("right-vert")}
              className={`h-2 transition-colors ${draggingBars["right-vert"] ? "bg-ring" : "bg-border"}`}
            />
            <Panel defaultSize={30} minSize={10}>
              <div className="scrollbar-thin h-full w-full overflow-y-auto">
                <Legend nodeData={flaggedNodeData} />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
