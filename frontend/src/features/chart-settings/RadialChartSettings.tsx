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
import { Slider } from "@/components/ui/slider";
import { useChartSettings } from "@/stores/useChartSettingsStore";
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
      <div className="flex flex-col">
        <label className="mb-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          Inner Radius: {innerRadius}px
        </label>
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
        <label className="mb-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          Outer Radius: {outerRadius}px
        </label>
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
        <label className="mb-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          Label Size: {fontSize}px
        </label>
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

      {displayMode === "both" && (
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
      )}

      <div className="flex flex-col">
        <Label htmlFor="link-rendering" className="mb-1 text-sm">
          Link Rendering
        </Label>
        <Select
          value={linkRenderingMode}
          onValueChange={(val) =>
            setRadialSettings({ linkRenderingMode: val as any })
          }
        >
          <SelectTrigger
            id="link-rendering"
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

      <Button
        variant={"outline"}
        className="cursor-pointer"
        onClick={() => resetRadialSettings()}
        title="Reset Settings to Default"
      >
        <span className="flex-wrap truncate overflow-hidden">
          Reset Settings
        </span>
      </Button>
    </div>
  );
};

export default RadialChartSettings;
