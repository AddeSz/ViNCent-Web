import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useKeys } from "@/hooks/useKeys";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import FileUploader from "./FileUploader";
import NodeLinkDiagramSettings from "./NodeLinkDiagramSettings";
import RadialChartSettings from "./RadialChartSettings";

interface ChartSettingsProps {
  datasets: Record<string, any>;
  onLoadData: (data: any) => void;
}

const ChartSettings = ({ datasets, onLoadData }: ChartSettingsProps) => {
  const { displaySettings, setDisplaySettings } = useChartSettings();
  const { keepPreviewNodes, keepStableView, displayMode } = displaySettings;
  const { attributeKeys } = useKeys();

  return (
    <div className="flex flex-col gap-2">
      <FileUploader datasets={datasets} onLoadData={onLoadData} />

      <>
        <h2 className="mb-0 cursor-default overflow-hidden text-lg text-ellipsis whitespace-nowrap">
          Display Mode
        </h2>
        <div className="rounded-[4px] bg-card p-1">
          {attributeKeys.length > 0 && (
            <RadioGroup
              value={displayMode}
              onValueChange={(val) =>
                setDisplaySettings({
                  displayMode: val as "attributes" | "centrality" | "both",
                })
              }
              className="flex flex-wrap gap-2 pb-2"
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
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="preview-nodes"
                checked={keepPreviewNodes}
                onCheckedChange={(checked) =>
                  setDisplaySettings({ keepPreviewNodes: !!checked })
                }
                className="cursor-pointer"
              />
              <Label
                title="Enable Change Preview"
                htmlFor="preview-nodes"
                className="cursor-pointer text-sm"
              >
                Enable Change Preview
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="stable-view"
                checked={keepStableView}
                onCheckedChange={(checked) =>
                  setDisplaySettings({ keepStableView: !!checked })
                }
                className="cursor-pointer"
              />
              <Label
                title="Enable Stable View"
                htmlFor="stable-view"
                className="cursor-pointer text-sm"
              >
                Enable Stable View
              </Label>
            </div>
          </div>
        </div>
      </>

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
          Node Diagram Settings
        </h2>
        <div className="rounded-[4px] bg-card p-1">
          <NodeLinkDiagramSettings />
        </div>
      </div>
    </div>
  );
};

export default ChartSettings;
