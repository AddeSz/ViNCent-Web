import NodeLinkDiagramSettings from "./NodeLinkDiagramSettings";
import RadialChartSettings from "./RadialChartSettings";

const ChartSettings = () => {
  return (
    <div className="gap-1">
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
        Radial View Settings:
      </div>
      <div className="rounded-[4px] bg-card p-1">
        <RadialChartSettings />
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap">
        Node Diagram Settings:
      </div>
      <div className="rounded-[4px] bg-card p-1">
        <NodeLinkDiagramSettings />
      </div>
    </div>
  );
};

export default ChartSettings;
