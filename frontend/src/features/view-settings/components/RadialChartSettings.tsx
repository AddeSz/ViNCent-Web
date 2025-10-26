import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  useChartSettings,
  type LinkRenderingMode,
} from "@/stores/useChartSettingsStore";
import FDEBSettings from "./FDEBSettings";

const RadialChartSettings = () => {
  const {
    radialSettings,
    setRadialSettings,
    resetRadialSettings,
    displaySettings,
  } = useChartSettings();
  const {
    innerRadius,
    outerRadius,
    fontSize,
    separateMetrics,
    linkRenderingMode,
  } = radialSettings;
  const { displayMode } = displaySettings;

  const outerRadiusMin = innerRadius + 200;
  const fontSizeMax = 45;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-col gap-1.5 rounded-lg bg-card p-1">
        {displayMode === "both" && (
          <>
            <div className="flex items-center gap-2">
              <Checkbox
                id="group-gap"
                checked={separateMetrics}
                onCheckedChange={(checked) =>
                  setRadialSettings({ separateMetrics: !!checked })
                }
                className="cursor-pointer"
              />
              <Label
                htmlFor="group-gap"
                title="Separate Centrality from Attributes"
                className="cursor-pointer text-sm"
              >
                Separate Metrics
              </Label>
            </div>
            <Separator orientation="horizontal" />
          </>
        )}

        <div className="flex flex-col">
          <p className="mb-1 truncate text-sm">Inner Radius: {innerRadius}px</p>
          <Slider
            min={50}
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
          <span className="mt-0.5 flex w-full justify-between text-xs">
            <span>{50}</span>
            <span>{outerRadius - 200}</span>
          </span>
        </div>

        <div className="flex flex-col">
          <p className="mb-1 truncate text-sm">Outer Radius: {outerRadius}px</p>
          <Slider
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
          <span className="mt-0.5 flex w-full justify-between text-xs">
            <span>{outerRadiusMin}</span>
            <span>{outerRadius}</span>
          </span>
        </div>

        <div className="flex flex-col">
          <p className="mb-1 truncate text-sm">Label Size: {fontSize}px</p>
          <Slider
            min={0}
            max={fontSizeMax}
            step={1}
            value={[fontSize]}
            onValueChange={([val]) => {
              setRadialSettings({ fontSize: val });
            }}
          />
          <span className="mt-0.5 flex w-full justify-between text-xs">
            <span>0</span>
            <span>{fontSizeMax}</span>
          </span>
        </div>
        <Separator orientation="horizontal" />

        <div className="flex flex-col">
          <p className="mb-1 cursor-default text-sm">Link Rendering</p>
          <Select
            value={linkRenderingMode}
            onValueChange={(val: LinkRenderingMode) =>
              setRadialSettings({ linkRenderingMode: val })
            }
          >
            <SelectTrigger
              className="w-full cursor-pointer"
              title="Link Rendering"
            >
              <SelectValue placeholder="Select link mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bezier" title="Bézier Curves">
                Bézier
              </SelectItem>
              <SelectItem value="hierarchy" title="Hierarchy Bundling">
                Hierarchy
              </SelectItem>
              <SelectItem value="fdeB" title="Force-Directed Edge Bundling">
                FDEB
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {linkRenderingMode === "fdeB" && <FDEBSettings />}
        <Separator orientation="horizontal" />
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => resetRadialSettings()}
          title="Reset Radial Settings to Default"
        >
          <span className="flex-wrap truncate">Reset Radial Settings</span>
        </Button>
      </div>
    </div>
  );
};

export default RadialChartSettings;
