import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const TimestepSlider = () => {
  const timestep = useTimelineStore((s) => s.timestep);
  const setCurrent = useTimelineStore((s) => s.setCurrent);
  const [isUpdating, setIsUpdating] = useState(false);
  const timesteps = useTimelineStore((s) => s.timesteps);

  const handlePrevious = () => {
    if (timestep.current > timestep.min && !isUpdating) {
      setIsUpdating(true);
      setCurrent(timestep.current - 1);
    }
  };

  const handleNext = () => {
    if (timestep.current < timestep.max && !isUpdating) {
      setIsUpdating(true);
      setCurrent(timestep.current + 1);
    }
  };

  useEffect(() => {
    if (isUpdating) {
      const timeout = setTimeout(() => setIsUpdating(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [isUpdating]);
  if (timesteps.length === 0) return null;

  return (
    <div className="space-y-2 pb-0">
      <h2 className="mb-0 cursor-default">Timestep: {timestep.current}</h2>
      <div className="flex gap-1 pb-0">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={handlePrevious}
          disabled={timestep.current <= timestep.min || isUpdating}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <div className="flex-1 space-y-1 pt-3">
          <Slider
            value={[timestep.current]}
            onValueChange={(value) => setCurrent(value[0])}
            min={timestep.min}
            max={timestep.max}
            step={1}
          />
          <div className="flex justify-between px-1 text-xs text-muted-foreground">
            <span>{timestep.min}</span>
            <span>{timestep.max}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="h-8 w-8 cursor-pointer"
          disabled={timestep.current >= timestep.max || isUpdating}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
