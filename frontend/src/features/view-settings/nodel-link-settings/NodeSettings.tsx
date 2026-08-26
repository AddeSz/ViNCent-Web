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
  const setNodeLinkSettings = useSettingsStore((s) => s.setNodeLinkSettings);
  const setDisplaySettings = useSettingsStore((s) => s.setDisplaySettings);
  const selectedCommunity = useSettingsStore(
    (s) => s.displaySettings.selectedCommunity,
  );
  const metricsInfo = useCurrentMetricsInfo();
  const getColorForMetric = useGetColorForMetric();
  const { enabledNodeKeys, enabledNodeCommunityKeys } = useKeys();
  const [open, setOpen] = useState(false);

  const getCommunityCount = (communityName: string) => {
    if (!metricsInfo.get(communityName)) return 0;
    return metricsInfo.get(communityName)?.values.size;
  };

  const formatCommunityLabel = (communityName: string) => {
    const count = getCommunityCount(communityName);
    return `${formatKeyLabel(communityName)} (${count})`;
  };

  useEffect(() => {
    if (
      !settings.nodeSizeMetric ||
      !enabledNodeKeys.includes(settings.nodeSizeMetric)
    ) {
      setNodeLinkSettings({ nodeSizeMetric: "fixed" });
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
      setNodeLinkSettings({ nodeSizeMode: "fixed" });
    } else {
      setNodeLinkSettings({ nodeSizeMode: "metric", nodeSizeMetric: value });
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-border/50">
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="truncate pl-1">Nodes</p>
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
              onValueChange={([value]) =>
                setNodeLinkSettings({ fixedNodeSize: value })
              }
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
                onValueChange={([value]) =>
                  setNodeLinkSettings({ minNodeSize: value })
                }
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
                onValueChange={([value]) =>
                  setNodeLinkSettings({ maxNodeSize: value })
                }
                className="cursor-pointer"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <Label htmlFor="community-select" className="text-sm">
            Community Coloring
          </Label>
          <Select
            value={selectedCommunity}
            onValueChange={(value) =>
              setDisplaySettings({ selectedCommunity: value })
            }
          >
            <SelectTrigger
              id="community-select"
              className="w-full text-sm"
              size="sm"
              defaultValue="none"
            >
              <SelectValue placeholder="Select community" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {enabledNodeCommunityKeys.map((communityName) => (
                <SelectItem key={communityName} value={communityName}>
                  {formatCommunityLabel(communityName)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NodeSettings;
