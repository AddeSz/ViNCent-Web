import Legend from "@/components/Legend";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CenterView from "@/features/center-view/CenterView";
import { useViewPersistence } from "@/features/center-view/ViewRendering/useViewPersistence";
import ChartFiltering from "@/features/chart-filtering/ChartFiltering";
import { useEffect, useState } from "react";
import type { TaskStatus } from "./api";
import FileUploader from "./components/file-uploader/FileUploader";
import { useFileUploaderState } from "./components/file-uploader/useFileUploaderState";
import { ProcessingProgress } from "./components/ProcessingProgress";
import ViewSettings from "./features/view-settings/ViewSettings";
import { useGraphData } from "./hooks/useGraphData";
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

  const fetchOptions = useOptionsStore((s) => s.fetchOptions);
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const fileUploaderState = useFileUploaderState();

  const {
    nodeData,
    edgeData,
    nodeChanges,
    edgeChanges,
    confirmRemovals,
    canConfirm,
  } = useGraphData();

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

  const isNotReady = appState.phase === "idle" || appState.phase === "error";

  return (
    <div className="flex h-full">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={"15%"} minSize={"12%"} maxSize={"22%"}>
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
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={"65%"} minSize={"50%"}>
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
              nodeData={nodeData}
              edgeData={edgeData}
              nodeChanges={nodeChanges}
              edgeChanges={edgeChanges}
              canConfirm={canConfirm}
              confirmRemovals={confirmRemovals}
              view={view}
              onViewChange={setView}
              isViewLoaded={isViewLoaded}
            />
          )}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={"20%"} minSize={"15%"} maxSize={"55%"}>
          <ResizablePanelGroup orientation="vertical" className="h-full">
            <ResizablePanel defaultSize={"70%"} minSize={"10%"}>
              <div className="h-full w-full">
                <ChartFiltering nodeData={nodeData} edgeData={edgeData} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={"30%"} minSize={"10%"}>
              <div className="scrollbar-thin h-full w-full overflow-y-auto">
                <Legend nodeData={nodeData} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default App;
