import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import { formatKeyLabel } from "@/utils/utils";

const FDEBSettings = () => {
  const { setRadialSettings, resetRadialSettings, radialSettings } =
    useChartSettings();
  const { fdebSettings } = radialSettings;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Delete",
    ];

    if (
      allowedKeys.includes(e.key) ||
      (e.key === "." && !e.currentTarget.value.includes("."))
    ) {
      return;
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (
    key: string,
    value: string,
    min: number,
    max: number,
  ) => {
    if (value === "" || isNaN(Number(value))) return;
    let num = parseFloat(value);
    if (num < min) num = min;
    if (num > max) num = max;

    setRadialSettings({
      fdebSettings: { ...fdebSettings, [key]: num },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">Link Bundler Settings</p>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(fdebSettings).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <Label
              htmlFor={`fdeb-${key}`}
              className="text-xs"
              title={formatKeyLabel(key)}
            >
              {formatKeyLabel(key)}
            </Label>
            <Input
              id={`fdeb-${key}`}
              type="number"
              step={0.1}
              min={0}
              max={1}
              value={value as number}
              onKeyDown={handleKeyDown}
              onChange={(e) => handleChange(key, e.target.value, 0.01, 1)}
              className="h-7 text-sm"
            />
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={resetRadialSettings}
        className="flex w-full cursor-pointer items-center px-2"
        title="Reset Link Bundler Settings"
      >
        <p className="w-fit truncate">Reset Bundler</p>
      </Button>
    </div>
  );
};

export default FDEBSettings;
