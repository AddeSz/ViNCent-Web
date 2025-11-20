import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  useSettingsStore,
  type LinkRenderingMode,
} from "@/stores/useSettingsStore";
import FDEBSettings from "./FDEBSettings";

const RadialChartSettings = () => {
  const {
    radialSettings,
    setRadialSettings,
    resetRadialSettings,
    displaySettings,
  } = useSettingsStore();
  const {
    innerRadius,
    outerRadius,
    fontSize,
    truncateLabels,
    showLabels,
    maxLabelWidth,
    separateMetrics,
    linkRenderingMode,
  } = radialSettings;
  const { displayMode } = displaySettings;

  const outerRadiusMin = innerRadius + 200;

  return (
    <div className="flex flex-col gap-2">
      {displayMode === "both" && (
        <>
          <div className="space-y-2">
            <p className="mb-1 text-sm font-semibold">Display</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="separate-metrics" className="text-sm">
                Separate Metrics
              </Label>
              <Switch
                id="separate-metrics"
                checked={separateMetrics}
                onCheckedChange={(checked) =>
                  setRadialSettings({ separateMetrics: checked })
                }
              />
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-2">
        <p className="mb-1 text-sm font-semibold">Display</p>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="inner-radius" className="text-sm">
              Inner Radius
            </Label>
            <span className="text-xs text-muted-foreground">
              {innerRadius}px
            </span>
          </div>
          <Slider
            id="inner-radius"
            min={100}
            max={outerRadius - 200}
            step={10}
            value={[innerRadius]}
            onValueChange={([val]) => {
              const newInner = val;
              const newOuter = Math.max(outerRadius, newInner + 200);
              setRadialSettings({
                innerRadius: newInner,
                outerRadius: newOuter,
              });
            }}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="outer-radius" className="text-sm">
              Outer Radius
            </Label>
            <span className="text-xs text-muted-foreground">
              {outerRadius}px
            </span>
          </div>
          <Slider
            id="outer-radius"
            min={outerRadiusMin}
            max={Math.min(Math.max(outerRadius + 400, 1600), 4000)}
            step={10}
            value={[outerRadius]}
            onValueChange={([val]) => {
              setRadialSettings({
                outerRadius: val,
              });
            }}
          />
        </div>

        <div className="flex items-center justify-between space-y-0 p-0">
          <Label htmlFor="show-label" className="text-sm">
            Show All Labels
          </Label>
          <Switch
            id="show-label"
            checked={showLabels}
            onCheckedChange={(checked) =>
              setRadialSettings({ showLabels: checked })
            }
          />
        </div>
        {showLabels && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-size" className="text-sm">
                  Label Size
                </Label>
                <span className="text-xs text-muted-foreground">
                  {fontSize}px
                </span>
              </div>
              <Slider
                id="font-size"
                min={0}
                max={100}
                step={1}
                value={[fontSize]}
                onValueChange={([val]) => {
                  setRadialSettings({ fontSize: val });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="truncate-label" className="text-sm">
                Truncate Labels
              </Label>
              <Switch
                id="truncate-label"
                checked={truncateLabels}
                onCheckedChange={(checked) =>
                  setRadialSettings({ truncateLabels: checked })
                }
              />
            </div>
          </>
        )}
        {truncateLabels && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="label-width" className="text-sm">
                Label Width
              </Label>
              <span className="text-xs text-muted-foreground">
                {maxLabelWidth}px
              </span>
            </div>
            <Slider
              id="label-width"
              min={0}
              max={500}
              step={10}
              value={[maxLabelWidth]}
              onValueChange={([val]) => {
                setRadialSettings({ maxLabelWidth: val });
              }}
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="mb-1 text-sm font-semibold">Links</p>

        <div className="space-y-1">
          <Label htmlFor="link-rendering">Link Rendering Mode</Label>
          <Select
            value={linkRenderingMode}
            onValueChange={(val: LinkRenderingMode) =>
              setRadialSettings({ linkRenderingMode: val })
            }
          >
            <SelectTrigger
              id="link-rendering"
              className="w-full text-sm"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fdeB">FDEB</SelectItem>
              <SelectItem value="bezier">Bézier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {linkRenderingMode === "fdeB" && <FDEBSettings />}
      </div>

      <Separator />

      <div className="space-y-2">
        <Button
          onClick={resetRadialSettings}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <span className="flex-wrap truncate">Reset Settings</span>
        </Button>
      </div>
    </div>
  );
};

export default RadialChartSettings;
