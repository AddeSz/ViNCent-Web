import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const DisplaySettings = () => {
  const { displaySettings, setDisplaySettings } = useSettingsStore();
  const { previewChanges, showForeshadowing, stickyHover } = displaySettings;
  const timesteps = useNetworkStore((s) => s.timesteps);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-sidebar-border/50">
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="truncate pl-1">Global Settings</p>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 py-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="preview-nodes" className="text-sm">
              Enable Change Preview
            </Label>
            <Switch
              id="preview-nodes"
              checked={previewChanges}
              onCheckedChange={(checked) =>
                setDisplaySettings({ previewChanges: checked })
              }
            />
          </div>
          {timesteps.length > 1 && (
            <div className="flex items-center justify-between">
              <Label htmlFor="stable-view" className="text-sm">
                Enable Stable View
              </Label>
              <Switch
                id="stable-view"
                checked={showForeshadowing}
                onCheckedChange={(checked) =>
                  setDisplaySettings({ showForeshadowing: checked })
                }
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="sticky-hover" className="text-sm">
              Enable Sticky Hover
            </Label>
            <Switch
              id="sticky-hover"
              checked={stickyHover}
              onCheckedChange={(checked) =>
                setDisplaySettings({ stickyHover: checked })
              }
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DisplaySettings;
