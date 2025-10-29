import type { ViewType } from "@/App";
import FileUploader from "@/components/FileUploader";
import { TimestepSlider } from "@/components/TimeStepSlider";
import { useNetworkStore } from "@/stores/useNetworkStore";
import DisplaySettings from "./components/DisplaySettings";
import NodeLinkDiagramSettings from "./components/NodeLinkDiagramSettings";
import RadialChartSettings from "./components/RadialChartSettings";

interface ViewSettingsProps {
  datasets: Record<string, any>;
  onLoadData: (data: any) => void;
  view: ViewType;
}

const ViewSettings = ({ datasets, onLoadData, view }: ViewSettingsProps) => {
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());
  return (
    <div className="flex flex-col gap-2">
      {!isEmpty && (
        <div>
          <p className="mb-0 w-full cursor-default truncate" title="Load Data">
            Load Data
          </p>
          <FileUploader datasets={datasets} onLoadData={onLoadData} />
        </div>
      )}

      <div>
        <p className="mb-0 w-full cursor-default truncate" title="Display Mode">
          Display Mode
        </p>
        <div className="rounded-lg bg-card px-2 py-1">
          <DisplaySettings />
        </div>
      </div>

      {view === "radial" && (
        <div>
          <p
            className="mb-0 w-full cursor-default truncate"
            title="Radial View Settings"
          >
            Radial View Settings
          </p>
          <div className="rounded-lg bg-card px-2 py-1">
            <RadialChartSettings />
          </div>
        </div>
      )}

      {view === "node-link" && (
        <div>
          <p
            className="mb-0 w-full cursor-default truncate"
            title="Node-Link View Settings"
          >
            Node-Link View Settings
          </p>
          <div className="rounded-lg bg-card px-2 py-1">
            <NodeLinkDiagramSettings />
          </div>
        </div>
      )}

      {view === "data-table" && (
        <div>
          <p
            className="mb-0 w-full cursor-default truncate"
            title="Data Tabel View Settings"
          >
            Data Tabel View Settings
          </p>
          <div className="min-h-10 rounded-lg bg-card px-2 py-1">
            <TimestepSlider />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSettings;
