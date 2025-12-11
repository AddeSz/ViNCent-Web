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
import { Switch } from "@/components/ui/switch";
import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import type { ScaleType } from "@/stores/useSettingsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { formatKeyLabel } from "@/utils/utils";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

interface NodeSettingsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NodeSettings = ({ isOpen, setIsOpen }: NodeSettingsProps) => {
  const settings = useSettingsStore((s) => s.nodeLinkSettings);
  const setSettings = useSettingsStore((s) => s.setNodeLinkSettings);
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);
  const getColorForMetric = useMetricsStore((s) => s.getColorForMetric);
  const { enabledNodeKeys } = useKeys();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      !settings.nodeSizeMetric ||
      !enabledNodeKeys.includes(settings.nodeSizeMetric)
    ) {
      setSettings({ nodeSizeMetric: "fixed" });
    }
  }, [enabledNodeKeys, settings.nodeSizeMetric]);

  const numericKeys = enabledNodeKeys.filter(
    (key) => metricsInfo.get(key)?.isNumeric,
  );

  const getNodeCurrentValue = () => {
    if (settings.nodeSizeMode === "fixed") {
      return "fixed";
    }
    return settings.nodeSizeMetric || "";
  };

  const handleNodeSizeChange = (value: string) => {
    if (value === "fixed") {
      setSettings({ nodeSizeMode: "fixed" });
    } else {
      setSettings({ nodeSizeMode: "metric", nodeSizeMetric: value });
    }
    setOpen(false);
  };

  const getDisplayLabel = () => {
    if (settings.nodeSizeMode === "fixed") {
      return "Fixed Size";
    }
    return formatKeyLabel(settings.nodeSizeMetric || "");
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-1 transition-colors hover:bg-border/50">
        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-100 group-data-[state=closed]/collapsible:-rotate-90" />
        <p className="truncate pl-1">Node Settings</p>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 py-2">
        <div className="space-y-1">
          <Label htmlFor="node-size-mode">Node Size Mode</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`flex h-8 w-full cursor-pointer items-center justify-between px-2 text-sm`}
                id="node-size-mode"
              >
                <span
                  className="truncate"
                  style={{
                    color:
                      settings.nodeSizeMode === "fixed"
                        ? "var(--popover-foreground)"
                        : getColorForMetric(settings.nodeSizeMetric),
                  }}
                >
                  {getDisplayLabel()}
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
                      onSelect={() => handleNodeSizeChange("fixed")}
                      className="flex cursor-pointer items-center justify-between gap-2"
                    >
                      Fixed Size
                      {getNodeCurrentValue() === "fixed" && (
                        <Check className="h-4 w-4" />
                      )}
                      {getNodeCurrentValue() !== "fixed" && (
                        <span className="h-4 w-4" />
                      )}
                    </CommandItem>
                    {numericKeys.length > 0 && (
                      <>
                        {numericKeys.map((key) => (
                          <CommandItem
                            key={key}
                            value={key}
                            onSelect={() => handleNodeSizeChange(key)}
                            className="flex cursor-pointer items-center justify-between gap-2"
                            style={{
                              color: getColorForMetric(key),
                            }}
                          >
                            {formatKeyLabel(key)}
                            {getNodeCurrentValue() === key && (
                              <Check className="h-4 w-4" />
                            )}
                            {getNodeCurrentValue() !== key && (
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

        {settings.nodeSizeMode === "metric" && (
          <div className="space-y-1">
            <Label htmlFor="node-scale-type" className="text-sm">
              Scale Type
            </Label>
            <Select
              value={settings.nodeScaleType}
              onValueChange={(value) =>
                setSettings({ nodeScaleType: value as ScaleType })
              }
            >
              <SelectTrigger
                id="node-scale-type"
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

        {settings.nodeSizeMode === "fixed" ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="node-size" className="text-sm">
                Node Size
              </Label>
              <span className="text-xs text-muted-foreground">
                {settings.fixedNodeSize}
              </span>
            </div>
            <Slider
              id="node-size"
              min={3}
              max={30}
              step={1}
              value={[settings.fixedNodeSize]}
              onValueChange={([value]) => setSettings({ fixedNodeSize: value })}
              className="cursor-pointer"
            />
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="min-node-size" className="text-sm">
                  Min Size
                </Label>
                <span className="text-xs text-muted-foreground">
                  {settings.minNodeSize}
                </span>
              </div>
              <Slider
                id="min-node-size"
                min={3}
                max={20}
                step={1}
                value={[settings.minNodeSize]}
                onValueChange={([value]) => setSettings({ minNodeSize: value })}
                className="cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="max-node-size" className="text-sm">
                  Max Size
                </Label>
                <span className="text-xs text-muted-foreground">
                  {settings.maxNodeSize}
                </span>
              </div>
              <Slider
                id="max-node-size"
                min={10}
                max={50}
                step={1}
                value={[settings.maxNodeSize]}
                onValueChange={([value]) => setSettings({ maxNodeSize: value })}
                className="cursor-pointer"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="label-font-size" className="text-sm">
              Label Font Size
            </Label>
            <span className="text-xs text-muted-foreground">
              {settings.fontSize}px
            </span>
          </div>
          <Slider
            id="label-font-size"
            min={0}
            max={100}
            step={1}
            value={[settings.fontSize]}
            onValueChange={([value]) => setSettings({ fontSize: value })}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-labels" className="text-sm">
            Show All Labels
          </Label>
          <Switch
            id="show-labels"
            checked={settings.showLabels}
            onCheckedChange={(checked) => setSettings({ showLabels: checked })}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NodeSettings;
