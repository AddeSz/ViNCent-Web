import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const TimestepSlider = () => {
  const timesteps = useNetworkStore((s) => s.timesteps);
  const currentTimestep = useNetworkStore((s) => s.currentTimestep);
  const setTimestep = useNetworkStore((s) => s.setTimestep);
  const [isUpdating, setIsUpdating] = useState(false);

  if (timesteps.length <= 1 || currentTimestep === null) return null;

  const currentIndex = timesteps.indexOf(currentTimestep);
  const minIndex = 0;
  const maxIndex = timesteps.length - 1;

  const handlePrevious = () => {
    if (currentIndex > minIndex && !isUpdating) {
      setIsUpdating(true);
      setTimestep(timesteps[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < maxIndex && !isUpdating) {
      setIsUpdating(true);
      setTimestep(timesteps[currentIndex + 1]);
    }
  };

  const handleSliderChange = (value: number[]) => {
    const index = value[0];
    setTimestep(timesteps[index]);
  };

  useEffect(() => {
    if (isUpdating) {
      const timeout = setTimeout(() => setIsUpdating(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [isUpdating]);

  return (
    <div className="space-y-2 pb-0">
      <h2 className="mb-0 cursor-default">Timestep: {currentTimestep}</h2>
      <div className="flex gap-1 pb-0">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={handlePrevious}
          disabled={currentIndex <= minIndex || isUpdating}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <div className="flex-1 space-y-1 pt-3">
          <Slider
            value={[currentIndex]}
            onValueChange={handleSliderChange}
            min={minIndex}
            max={maxIndex}
            step={1}
          />
          <div className="flex justify-between px-1 text-xs text-muted-foreground">
            <span>{timesteps[minIndex]}</span>
            <span>{timesteps[maxIndex]}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          className="h-8 w-8 cursor-pointer"
          disabled={currentIndex >= maxIndex || isUpdating}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
