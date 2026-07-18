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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useCurrentMetricsInfo } from "@/hooks/useCurrentMetricsInfo";
import { useGetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useKeys } from "@/hooks/useKeys";
import type { ScaleType } from "@/stores/useSettingsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { formatKeyLabel } from "@/utils/utils";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface LinkSettingsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const LinkSettings = ({ isOpen, setIsOpen }: LinkSettingsProps) => {
  const settings = useSettingsStore((s) => s.nodeLinkSettings);
  const setSettings = useSettingsStore((s) => s.setNodeLinkSettings);
  const metricsInfo = useCurrentMetricsInfo();
  const getColorForMetric = useGetColorForMetric();
  const { enabledEdgeKeys } = useKeys();
  const [linkOpen, setLinkOpen] = useState(false);

  useEffect(() => {
    if (
      settings.linkThicknessMode === "metric" &&
      (!settings.linkThicknessMetric ||
        !enabledEdgeKeys.includes(settings.linkThicknessMetric))
    ) {
      setSettings({ linkThicknessMetric: "fixed" });
    }
  }, [
    enabledEdgeKeys,
    settings.linkThicknessMode,
    settings.linkThicknessMetric,
  ]);

  const numericEdgeKeys = enabledEdgeKeys.filter(
    (key) => metricsInfo.get(key)?.isNumeric,
  );

  const getLinkCurrentValue = () => {
    if (settings.linkThicknessMode === "fixed") {
      return "fixed";
    }
    return settings.linkThicknessMetric;
  };

  const handleLinkThicknessChange = (value: string) => {
    if (value === "fixed") {
      setSettings({ linkThicknessMode: "fixed" });
    } else {
      setSettings({ linkThicknessMode: "metric", linkThicknessMetric: value });
    }
    setLinkOpen(false);
  };

  const getLinkDisplayLabel = () => {
    if (settings.linkThicknessMode === "fixed") {
      return "Fixed";
    }
    return formatKeyLabel(settings.linkThicknessMetric);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-border/50">
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="truncate pl-1">Links</p>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 py-2">
        <div className="space-y-1">
          <Label htmlFor="link-thickness-mode">Link Thickness Mode</Label>
          <Popover open={linkOpen} onOpenChange={setLinkOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`flex h-8 w-full cursor-pointer items-center justify-between px-2 text-sm`}
                id="link-thickness-mode"
              >
                <span
                  className="truncate"
                  style={{
                    color:
                      settings.linkThicknessMode === "fixed"
                        ? "var(--popover-foreground)"
                        : getColorForMetric(settings.linkThicknessMetric),
                  }}
                >
                  {getLinkDisplayLabel()}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Search..." className="h-9" />
                <CommandEmpty>No option found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      value="fixed"
                      onSelect={() => handleLinkThicknessChange("fixed")}
                      className="flex cursor-pointer items-center justify-between gap-2"
                    >
                      Fixed
                      {getLinkCurrentValue() === "fixed" && (
                        <Check className="h-4 w-4" />
                      )}
                      {getLinkCurrentValue() !== "fixed" && (
                        <span className="h-4 w-4" />
                      )}
                    </CommandItem>
                    {numericEdgeKeys.length > 0 && (
                      <>
                        {numericEdgeKeys.map((key) => (
                          <CommandItem
                            key={key}
                            value={key}
                            onSelect={() => handleLinkThicknessChange(key)}
                            className="flex cursor-pointer items-center justify-between gap-2"
                            style={{
                              color: getColorForMetric(key),
                            }}
                          >
                            {formatKeyLabel(key)}
                            {getLinkCurrentValue() === key && (
                              <Check className="h-4 w-4" />
                            )}
                            {getLinkCurrentValue() !== key && (
                              <span className="h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {settings.linkThicknessMode === "metric" && (
          <div className="space-y-1">
            <Label htmlFor="link-scale-type" className="text-sm">
              Scale Type
            </Label>
            <Select
              value={settings.linkScaleType}
              onValueChange={(value) =>
                setSettings({ linkScaleType: value as ScaleType })
              }
            >
              <SelectTrigger
                id="link-scale-type"
                className="w-full text-sm"
                size="sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="log">Logarithmic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {settings.linkThicknessMode === "fixed" ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="link-thickness" className="text-sm">
                Thickness
              </Label>
              <span className="text-xs text-muted-foreground">
                {settings.fixedLinkThickness}
              </span>
            </div>
            <Slider
              id="link-thickness"
              min={0.5}
              max={10}
              step={0.5}
              value={[settings.fixedLinkThickness]}
              onValueChange={([value]) =>
                setSettings({ fixedLinkThickness: value })
              }
              className="cursor-pointer"
            />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="min-link-thickness" className="text-sm">
                  Min Thickness
                </Label>
                <span className="text-xs text-muted-foreground">
                  {settings.minLinkThickness}
                </span>
              </div>
              <Slider
                id="min-link-thickness"
                min={0.5}
                max={10}
                step={0.5}
                value={[settings.minLinkThickness]}
                onValueChange={([value]) =>
                  setSettings({ minLinkThickness: value })
                }
                className="cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="max-link-thickness" className="text-sm">
                  Max Thickness
                </Label>
                <span className="text-xs text-muted-foreground">
                  {settings.maxLinkThickness}
                </span>
              </div>
              <Slider
                id="max-link-thickness"
                min={2}
                max={15}
                step={0.5}
                value={[settings.maxLinkThickness]}
                onValueChange={([value]) =>
                  setSettings({ maxLinkThickness: value })
                }
                className="cursor-pointer"
              />
            </div>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default LinkSettings;
