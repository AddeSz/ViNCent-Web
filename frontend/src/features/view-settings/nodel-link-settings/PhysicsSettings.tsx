import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useInteractionStore } from "@/stores/useInteractionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { ChevronDown } from "lucide-react";

interface PhysicsSettingsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const PhysicsSettings = ({ isOpen, setIsOpen }: PhysicsSettingsProps) => {
  const settings = useSettingsStore((s) => s.nodeLinkSettings);
  const setSettings = useSettingsStore((s) => s.setNodeLinkSettings);
  const setRestartFlag = useInteractionStore((s) => s.setRestartSimulationFlag);

  const handleRestart = () => {
    setRestartFlag(true);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-border/50">
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="truncate pl-1">Physics</p>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 py-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="link-distance" className="text-sm">
              Link Distance
            </Label>
            <span className="text-xs text-muted-foreground">
              {settings.linkDistance}
            </span>
          </div>
          <Slider
            id="link-distance"
            min={20}
            max={300}
            step={10}
            value={[settings.linkDistance]}
            onValueChange={([value]) => setSettings({ linkDistance: value })}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="charge-strength" className="text-sm">
              Charge Strength
            </Label>
            <span className="text-xs text-muted-foreground">
              {settings.chargeStrength}
            </span>
          </div>
          <Slider
            id="charge-strength"
            min={-1000}
            max={-50}
            step={10}
            value={[settings.chargeStrength]}
            onValueChange={([value]) => setSettings({ chargeStrength: value })}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="collision" className="text-sm">
            Collision Detection
          </Label>
          <Switch
            id="collision"
            checked={settings.collisionEnabled}
            onCheckedChange={(checked) =>
              setSettings({ collisionEnabled: checked })
            }
          />
        </div>

        <Button
          onClick={handleRestart}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <span className="flex-wrap truncate">Run Simulation</span>
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PhysicsSettings;
