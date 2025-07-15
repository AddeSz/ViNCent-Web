import { Slider } from "@/components/shadcnUI/slider";
import { useChartSettings } from "@/hooks/useChartSettings";

const RadialChartSettings = () => {
  const { radialSettings, setRadialSettings } = useChartSettings();
  const { innerRadius, outerRadius, arcPadding } = radialSettings;

  const outerRadiusMin = innerRadius + 200;
  const arcPaddingMax = Math.floor((outerRadius - innerRadius) / 10);

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
            const newArcPadding = Math.min(
              arcPadding,
              (newOuter - newInner) / 10,
            );
            setRadialSettings({
              innerRadius: newInner,
              outerRadius: newOuter,
              arcPadding: Math.floor(newArcPadding),
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
          max={1600}
          step={10}
          value={[outerRadius]}
          onValueChange={([val]) => {
            const newOuter = val;
            const newArcPadding = Math.min(
              arcPadding,
              (newOuter - innerRadius) / 10,
            );
            setRadialSettings({
              outerRadius: newOuter,
              arcPadding: Math.floor(newArcPadding),
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
          Arc Padding: {arcPadding}px
        </label>
        <Slider
          min={0}
          max={arcPaddingMax}
          step={1}
          value={[arcPadding]}
          onValueChange={([val]) => {
            setRadialSettings({ arcPadding: val });
          }}
        />
        <span className="mt-0.5 flex w-full justify-between text-xs">
          <span>0</span>
          <span>{arcPaddingMax}</span>
        </span>
      </div>
    </div>
  );
};

export default RadialChartSettings;
