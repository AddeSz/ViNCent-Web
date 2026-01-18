import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  useSettingsStore,
  type EdgeRenderingMode,
} from "@/stores/useSettingsStore";
import throttle from "lodash.throttle";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const fdebParamConfig: Record<
  string,
  { min: number; max: number; step: number; label: string }
> = {
  bundlingStiffness: { min: 0.01, max: 2, step: 0.01, label: "Stiffness" },
  stepSize: { min: 0.01, max: 0.5, step: 0.01, label: "Step Size" },
  cycles: { min: 1, max: 10, step: 1, label: "Cycles" },
  iterations: { min: 10, max: 150, step: 1, label: "Iterations" },
  iterationsRate: { min: 0.1, max: 1, step: 0.01, label: "Iteration Rate" },
  compatibilityThreshold: {
    min: 0,
    max: 1,
    step: 0.01,
    label: "Compatibility",
  },
};

const THROTTLE_MS = 100;

interface EdgeSettingsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const EdgeSettings = ({ isOpen, setIsOpen }: EdgeSettingsProps) => {
  const { radialSettings, setRadialSettings, resetFDEBSettings } =
    useSettingsStore();
  const { edgeRenderingMode, fdebSettings } = radialSettings;
  const [localValues, setLocalValues] = useState<Record<string, number>>({});

  const throttledUpdate = useRef(
    throttle(
      (key: string, value: number, currentSettings: typeof fdebSettings) => {
        setRadialSettings({
          fdebSettings: { ...currentSettings, [key]: value },
        });
      },
      THROTTLE_MS,
    ),
  ).current;

  useEffect(() => {
    return () => {
      throttledUpdate.cancel();
    };
  }, [throttledUpdate]);

  const handleSliderChange = (key: string, value: number[]) => {
    const newValue = value[0];
    setLocalValues((prev) => ({ ...prev, [key]: newValue }));
    throttledUpdate(key, newValue, fdebSettings);
  };

  const handleSliderCommit = (key: string, value: number[]) => {
    throttledUpdate.flush();
    setRadialSettings({
      fdebSettings: { ...fdebSettings, [key]: value[0] },
    });
    setLocalValues((prev) => {
      const newLocal = { ...prev };
      delete newLocal[key];
      return newLocal;
    });
  };

  const formatValue = (value: number, step: number): string => {
    if (step >= 1) return value.toFixed(0);
    if (step >= 0.1) return value.toFixed(1);
    return value.toFixed(2);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-border/50">
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="truncate pl-1">Edges</p>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 pt-2 pb-3">
        <div className="space-y-1">
          <Label htmlFor="edge-rendering" className="text-sm">
            Edge Rendering Mode
          </Label>
          <Select
            value={edgeRenderingMode}
            onValueChange={(val: EdgeRenderingMode) =>
              setRadialSettings({ edgeRenderingMode: val })
            }
          >
            <SelectTrigger
              id="edge-rendering"
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

        {edgeRenderingMode === "fdeB" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col space-y-1">
              {Object.entries(fdebSettings).map(([key, value]) => {
                const config = fdebParamConfig[key];
                const currentValue = localValues[key] ?? (value as number);
                const displayValue = formatValue(currentValue, config.step);
                return (
                  <div key={key} className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`fdeb-${key}`} className="text-sm">
                        {config.label}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {displayValue}
                      </span>
                    </div>
                    <Slider
                      id={`fdeb-${key}`}
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={[currentValue]}
                      onValueChange={(val) => handleSliderChange(key, val)}
                      onValueCommit={(val) => handleSliderCommit(key, val)}
                      className="cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFDEBSettings}
              className="flex w-full cursor-pointer items-center px-2"
              title="Reset Link Bundler Settings to Default Values"
            >
              <p className="w-fit truncate">Reset Values</p>
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default EdgeSettings;
