import { Button } from "@/components/shadcnUI/button";
import { Checkbox } from "@/components/shadcnUI/checkbox";
import { Label } from "@/components/shadcnUI/label";
import { Slider } from "@/components/shadcnUI/slider";
import { useChartSettings } from "@/stores/useChartSettingsStore";

const RadialChartSettings = () => {
  const { radialSettings, setRadialSettings, resetRadialSettings } =
    useChartSettings();
  const { innerRadius, outerRadius, fontSize, groupGapEnabled } =
    radialSettings;

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

      <div className="flex items-center gap-2">
        <Checkbox
          id="group-gap"
          checked={groupGapEnabled}
          onCheckedChange={(checked) =>
            setRadialSettings({ groupGapEnabled: !!checked })
          }
          className="cursor-pointer"
        />
        <Label htmlFor="group-gap" className="cursor-pointer text-sm">
          Group Gap
        </Label>
      </div>

      <Button className="cursor-pointer" onClick={resetRadialSettings}>
        <span className="flex-wrap truncate overflow-hidden">
          Reset to Defaults{" "}
        </span>
      </Button>
    </div>
  );
};

export default RadialChartSettings;
