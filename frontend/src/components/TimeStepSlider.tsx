import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const TimestepSlider = () => {
  const timesteps = useMetricsStore((s) => s.timesteps);
  const currentTimestep = useMetricsStore((s) => s.currentTimestep);
  const setTimestep = useMetricsStore((s) => s.setTimestep);
  const [isUpdating, setIsUpdating] = useState(false);

  if (timesteps.length <= 1 || currentTimestep === null) return null;

  const min = Math.min(...timesteps);
  const max = Math.max(...timesteps);
  const current = currentTimestep;

  const handlePrevious = () => {
    if (current > min && !isUpdating) {
      setIsUpdating(true);
      setTimestep(current - 1);
    }
  };

  const handleNext = () => {
    if (current < max && !isUpdating) {
      setIsUpdating(true);
      setTimestep(current + 1);
    }
  };

  useEffect(() => {
    if (isUpdating) {
      const timeout = setTimeout(() => setIsUpdating(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [isUpdating]);

  return (
    <div className="space-y-2 pb-0">
      <h2 className="mb-0 cursor-default">Timestep: {current}</h2>
      <div className="flex gap-1 pb-0">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={handlePrevious}
          disabled={current <= min || isUpdating}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <div className="flex-1 space-y-1 pt-3">
          <Slider
            value={[current]}
            onValueChange={(value) => setTimestep(value[0])}
            min={min}
            max={max}
            step={1}
          />
          <div className="flex justify-between px-1 text-xs text-muted-foreground">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="h-8 w-8 cursor-pointer"
          disabled={current >= max || isUpdating}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
