import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useGetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useKeys } from "@/hooks/useKeys";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { formatKeyLabel } from "@/utils/utils";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

interface LabelSettingsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  settingsType: "radialSettings" | "nodeLinkSettings";
}

const LabelSettings = ({
  isOpen,
  setIsOpen,
  settingsType,
}: LabelSettingsProps) => {
  const [open, setOpen] = useState(false);
  const {
    radialSettings,
    setRadialSettings,
    nodeLinkSettings,
    setNodeLinkSettings,
    displaySettings,
    setDisplaySettings,
  } = useSettingsStore();

  const settings =
    settingsType === "radialSettings" ? radialSettings : nodeLinkSettings;
  const setSettings =
    settingsType === "radialSettings" ? setRadialSettings : setNodeLinkSettings;
  const { fontSize, showLabels } = settings;

  const { enabledNodeKeys } = useKeys();
  const getColorForMetric = useGetColorForMetric();
  const enabledKeys = ["label", ...enabledNodeKeys];

  const currentLabel = displaySettings.displayLabel || "label";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-border/50">
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="truncate pl-1">Labels</p>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 pt-2 pb-3">
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="label-select" className="text-sm">
              Display Label
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="label-select"
                  variant="outline"
                  className="flex w-full cursor-pointer items-center justify-between px-2 text-sm"
                  size="sm"
                >
                  <span
                    className="truncate"
                    style={{ color: getColorForMetric(currentLabel) }}
                  >
                    {formatKeyLabel(currentLabel)}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search labels..."
                    className="h-9"
                  />
                  <CommandEmpty>No labels found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {enabledKeys.map((key) => (
                        <CommandItem
                          key={key}
                          value={key}
                          onSelect={() => {
                            setDisplaySettings({ displayLabel: key });
                            setOpen(false);
                          }}
                          className="flex cursor-pointer items-center justify-between gap-2"
                          style={{ color: getColorForMetric(key) }}
                        >
                          <span className="truncate">
                            {formatKeyLabel(key)}
                          </span>
                          {currentLabel === key && (
                            <Check className="h-4 w-4 shrink-0" />
                          )}
                          {currentLabel !== key && (
                            <span className="h-4 w-4 shrink-0" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size" className="text-sm">
                Label Size
              </Label>
              <span className="text-xs text-muted-foreground">
                {fontSize}px
              </span>
            </div>
            <Slider
              id="font-size"
              min={0}
              max={100}
              step={1}
              value={[fontSize]}
              onValueChange={([val]) => {
                setSettings({ fontSize: val });
              }}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-label" className="text-sm">
              Show All Labels
            </Label>
            <Switch
              id="show-label"
              checked={showLabels}
              onCheckedChange={(checked) =>
                setSettings({ showLabels: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="truncate-label" className="text-sm">
              Truncate Labels
            </Label>
            <Switch
              id="truncate-label"
              checked={displaySettings.truncateLabels}
              onCheckedChange={(checked) =>
                setDisplaySettings({ truncateLabels: checked })
              }
            />
          </div>

          {displaySettings.truncateLabels && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="label-width" className="text-sm">
                  Truncate Length
                </Label>
                <span className="text-xs text-muted-foreground">
                  {displaySettings.maxLabelWidth}px
                </span>
              </div>
              <Slider
                id="label-width"
                min={0}
                max={500}
                step={10}
                value={[displaySettings.maxLabelWidth]}
                onValueChange={([val]) => {
                  setDisplaySettings({ maxLabelWidth: val });
                }}
                className="cursor-pointer"
              />
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default LabelSettings;
