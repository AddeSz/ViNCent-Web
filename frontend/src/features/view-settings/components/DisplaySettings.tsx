import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useKeys } from "@/hooks/useKeys";
import {
  useChartSettings,
  type DisplayMode,
} from "@/stores/useChartSettingsStore";

const DisplaySettings = () => {
  const { displaySettings, setDisplaySettings } = useChartSettings();
  const { keepPreviewNodes, keepStableView, displayMode } = displaySettings;
  const { attributeKeys } = useKeys();

  return (
    <>
      {attributeKeys.length > 0 && (
        <RadioGroup
          value={displayMode}
          onValueChange={(val: DisplayMode) =>
            setDisplaySettings({
              displayMode: val,
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
            <Label htmlFor="attributes" className="cursor-pointer truncate p-1">
              Attributes
            </Label>
          </div>
          <div className="flex min-w-0 items-center">
            <RadioGroupItem
              value="centrality"
              id="centrality"
              className="cursor-pointer"
            />
            <Label htmlFor="centrality" className="cursor-pointer truncate p-1">
              Centrality
            </Label>
          </div>
          <div className="flex min-w-0 items-center">
            <RadioGroupItem value="both" id="both" className="cursor-pointer" />
            <Label htmlFor="both" className="cursor-pointer truncate p-1">
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
    </>
  );
};

export default DisplaySettings;
