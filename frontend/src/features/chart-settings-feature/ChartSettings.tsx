import { RadioGroup, RadioGroupItem } from "@/components/shadcnUI/radio-group";
import NodeLinkDiagramSettings from "./NodeLinkDiagramSettings";
import RadialChartSettings from "./RadialChartSettings";
import { Label } from "@/components/shadcnUI/label";
import { useChartSettings } from "@/hooks/useChartSettings";

const ChartSettings = () => {
  const { displayMode, setDisplayMode } = useChartSettings();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="mb-0 cursor-default overflow-hidden text-lg text-ellipsis whitespace-nowrap">
          Display Mode
        </h2>
        <div className="rounded-[4px] bg-card p-1">
          <RadioGroup
            value={displayMode}
            onValueChange={(val) =>
              setDisplayMode(val as "attributes" | "centrality" | "both")
            }
            className="flex flex-wrap gap-2"
          >
            <div className="flex min-w-0 items-center">
              <RadioGroupItem
                value="attributes"
                id="attributes"
                className="cursor-pointer"
              />
              <Label
                htmlFor="attributes"
                className="cursor-pointer truncate p-1 text-ellipsis whitespace-nowrap"
              >
                Attributes
              </Label>
            </div>
            <div className="flex min-w-0 items-center">
              <RadioGroupItem
                value="centrality"
                id="centrality"
                className="cursor-pointer"
              />
              <Label
                htmlFor="centrality"
                className="cursor-pointer truncate overflow-hidden p-1 whitespace-nowrap"
              >
                Centrality
              </Label>
            </div>
            <div className="flex min-w-0 items-center">
              <RadioGroupItem
                value="both"
                id="both"
                className="cursor-pointer"
              />
              <Label
                htmlFor="both"
                className="cursor-pointer truncate overflow-hidden p-1 whitespace-nowrap"
              >
                Both
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      <div className="overflow-hidden whitespace-nowrap">
        <h2 className="mb-0 cursor-default truncate overflow-hidden text-lg whitespace-nowrap">
          Radial View Settings
        </h2>
        <div className="rounded-[4px] bg-card p-1">
          <RadialChartSettings />
        </div>
      </div>
      <div className="overflow-hidden whitespace-nowrap">
        <h2 className="mb-0 cursor-default truncate overflow-hidden text-lg whitespace-nowrap">
          Node Diagram Settings{" "}
        </h2>
        <div className="rounded-[4px] bg-card p-1">
          <NodeLinkDiagramSettings />
        </div>
      </div>
    </div>
  );
};

export default ChartSettings;
