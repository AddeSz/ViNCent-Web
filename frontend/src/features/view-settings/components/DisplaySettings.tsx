import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useSettingsStore, type DisplayMode } from "@/stores/useSettingsStore";

const DisplaySettings = () => {
  const { displaySettings, setDisplaySettings } = useSettingsStore();
  const { previewChanges, showForeshadowing, displayMode, stickyHover } =
    displaySettings;
  const { allNodeAttributeKeys } = useKeys();
  const timesteps = useMetricsStore((s) => s.timesteps);

  return (
    <>
      {allNodeAttributeKeys.length > 0 && (
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
            checked={previewChanges}
            onCheckedChange={(checked) =>
              setDisplaySettings({ previewChanges: !!checked })
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

        {timesteps.length > 1 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="stable-view"
              checked={showForeshadowing}
              onCheckedChange={(checked) =>
                setDisplaySettings({ showForeshadowing: !!checked })
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
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            id="sticky-hover"
            checked={stickyHover}
            onCheckedChange={(checked) =>
              setDisplaySettings({ stickyHover: !!checked })
            }
            className="cursor-pointer"
          />
          <Label
            title="Enable Sticky Hover"
            htmlFor="sticky-hover"
            className="cursor-pointer text-sm"
          >
            Enable Sticky Hover
          </Label>
        </div>
      </div>
    </>
  );
};

export default DisplaySettings;
