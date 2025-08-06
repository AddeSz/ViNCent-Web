import { ModeToggle } from "@/components/shadcnUI/mode-toggle";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useState, useEffect } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { generateCentralityData, testData1 } from "@/utils/testData";
import CenterView from "@/features/center-view-feature/CenterView";
import ChartSettings from "@/features/chart-settings-feature/ChartSettings";
import DataFiltering from "@/features/data-filtering-feature/DataFiltering";

const App = () => {
  const [draggingBars, setDraggingBars] = useState<Record<string, boolean>>({});
  const handleDragging = (id: string) => (isDragging: boolean) => {
    setDraggingBars((prev) => ({ ...prev, [id]: isDragging }));
  };

  useEffect(() => {
    const data = testData1;
    useDataStore.getState().setNetwork(data);
    const centrality = generateCentralityData(data);

    useDataStore.getState().setCentralityData(centrality);
  }, []);

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
            <Panel defaultSize={40} minSize={10}>
              Left Bottom
            </Panel>
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
            <Panel defaultSize={40} minSize={10}>
              Right Bottom
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default App;
