import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { ScaleType } from "@/stores/useSettingsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { formatKeyLabel } from "@/utils/utils";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

const NodeLinkDiagramSettings = () => {
  const settings = useSettingsStore((s) => s.nodeLinkSettings);
  const setSettings = useSettingsStore((s) => s.setNodeLinkSettings);
  const resetSettings = useSettingsStore((s) => s.resetNodeLinkSettings);
  const setRestartFlag = useNetworkStore((s) => s.setRestartSimulationFlag);
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);
  const getColorForMetric = useMetricsStore((s) => s.getColorForMetric);
  const { enabledNodeKeys, enabledEdgeKeys } = useKeys();
  const [open, setOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  useEffect(() => {
    if (
      !settings.nodeSizeMetric ||
      !enabledNodeKeys.includes(settings.nodeSizeMetric)
    ) {
      setSettings({ nodeSizeMetric: "fixed" });
    }
  }, [enabledNodeKeys, settings.nodeSizeMetric]);

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

  const numericKeys = enabledNodeKeys.filter(
    (key) => metricsInfo.get(key)?.isNumeric,
  );
  const numericEdgeKeys = enabledEdgeKeys.filter(
    (key) => metricsInfo.get(key)?.isNumeric,
  );

  const handleRestart = () => {
    setRestartFlag(true);
  };

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
    <div className="flex flex-col gap-2">
      <div className="space-y-2">
        <p className="mb-1 text-sm font-semibold">Physics</p>
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
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="mb-1 text-sm font-semibold">Nodes</p>

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
          <div>
            <Label htmlFor="node-scale-type" className="pb-0.5 text-sm">
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
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="show-labels" className="text-sm">
            Show Labels
          </Label>
          <Switch
            id="show-labels"
            checked={settings.showLabels}
            onCheckedChange={(checked) => setSettings({ showLabels: checked })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="mb-1 text-sm font-semibold">Links</p>

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
            <Label htmlFor="link-scale-type">Scale Type</Label>
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
              min={0}
              max={10}
              step={0.5}
              value={[settings.fixedLinkThickness]}
              onValueChange={([value]) =>
                setSettings({ fixedLinkThickness: value })
              }
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
                min={0}
                max={10}
                step={0.5}
                value={[settings.minLinkThickness]}
                onValueChange={([value]) =>
                  setSettings({ minLinkThickness: value })
                }
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
              />
            </div>
          </>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Button onClick={handleRestart} size="sm" className="w-full">
          <span className="flex-wrap truncate">Restart Simulation</span>
        </Button>
        <Button
          onClick={resetSettings}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <span className="flex-wrap truncate">Reset Settings</span>
        </Button>
      </div>
    </div>
  );
};

export default NodeLinkDiagramSettings;
