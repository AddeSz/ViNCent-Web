import FileUploader from "@/components/FileUploader";
import { useNetworkStore } from "@/stores/useNetworkStore";
import DisplaySettings from "./components/DisplaySettings";
import NodeLinkDiagramSettings from "./components/NodeLinkDiagramSettings";
import RadialChartSettings from "./components/RadialChartSettings";

interface ChartSettingsProps {
  datasets: Record<string, any>;
  onLoadData: (data: any) => void;
}

const ChartSettings = ({ datasets, onLoadData }: ChartSettingsProps) => {
  const isEmpty = useNetworkStore((s) => s.isNetworkEmpty());
  return (
    <div className="flex flex-col gap-2">
      {!isEmpty && (
        <div>
          <h2 className="mb-0 w-full cursor-default truncate" title="Load Data">
            Load Data
          </h2>
          <FileUploader datasets={datasets} onLoadData={onLoadData} />
        </div>
      )}

      <div>
        <h2
          className="mb-0 w-full cursor-default truncate"
          title="Display Mode"
        >
          Display Mode
        </h2>
        <div className="rounded-[4px] bg-card p-1">
          <DisplaySettings />
        </div>
      </div>

      <div>
        <h2
          className="mb-0 w-full cursor-default truncate"
          title="Radial View Settings"
        >
          Radial View Settings
        </h2>
        <div className="rounded-[4px] bg-card p-1">
          <RadialChartSettings />
        </div>
      </div>

      <div>
        <h2
          className="mb-0 w-full cursor-default truncate"
          title="Node-Link View Settings"
        >
          Node-Link View Settings
        </h2>
        <div className="rounded-[4px] bg-card p-1">
          <NodeLinkDiagramSettings />
        </div>
      </div>
    </div>
  );
};

export default ChartSettings;
