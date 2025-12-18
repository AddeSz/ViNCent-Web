import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
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
import { useSettingsStore } from "@/stores/useSettingsStore";
import { formatKeyLabel } from "@/utils/utils";
import { ChevronDown } from "lucide-react";

interface RadialDisplaySettingsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const RadialDisplaySettings = ({
  isOpen,
  setIsOpen,
}: RadialDisplaySettingsProps) => {
  const { radialSettings, setRadialSettings } = useSettingsStore();
  const {
    innerRadius,
    outerRadius,
    fontSize,
    truncateLabels,
    showLabels,
    maxLabelWidth,
    separateMetrics,
    communitiesInArcs,
  } = radialSettings;
  const {
    enabledNodeAttributeKeys,
    enabledNodeCentralityKeys,
    enabledNodeCommunityKeys,
  } = useKeys();
  const outerRadiusMin = innerRadius + 200;

  const metricsInfo = useMetricsStore((s) => s.currentMetricsInfo);

  const handleCommunityChange = (value: string) => {
    if (!enabledNodeCommunityKeys.includes(value)) {
      setRadialSettings({ selectedRingCommunity: "none" });
    } else {
      setRadialSettings({ selectedRingCommunity: value });
    }
  };

  const getCommunityCount = (communityName: string) => {
    if (!metricsInfo.get(communityName)) return 0;
    return metricsInfo.get(communityName)?.values.size;
  };

  const formatCommunityLabel = (communityName: string) => {
    const count = getCommunityCount(communityName);
    return `${formatKeyLabel(communityName)} (${count})`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-1 transition-colors hover:bg-border/50">
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="truncate pl-1">Display Settings</p>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 pt-2 pb-3">
        <div className="space-y-1">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="inner-radius" className="text-sm">
                Inner Radius
              </Label>
              <span className="text-xs text-muted-foreground">
                {innerRadius}px
              </span>
            </div>
            <Slider
              id="inner-radius"
              min={100}
              max={outerRadius - 200}
              step={10}
              value={[innerRadius]}
              onValueChange={([val]) => {
                const newInner = val;
                const newOuter = Math.max(outerRadius, newInner + 200);
                setRadialSettings({
                  innerRadius: newInner,
                  outerRadius: newOuter,
                });
              }}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="outer-radius" className="text-sm">
                Outer Radius
              </Label>
              <span className="text-xs text-muted-foreground">
                {outerRadius}px
              </span>
            </div>
            <Slider
              id="outer-radius"
              min={outerRadiusMin}
              max={Math.min(Math.max(outerRadius + 400, 1600), 4000)}
              step={10}
              value={[outerRadius]}
              onValueChange={([val]) => {
                setRadialSettings({
                  outerRadius: val,
                });
              }}
              className="cursor-pointer"
            />
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
                setRadialSettings({ fontSize: val });
              }}
              className="cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="show-label" className="text-sm">
            Show All Labels
          </Label>
          <Switch
            id="show-label"
            checked={showLabels}
            onCheckedChange={(checked) =>
              setRadialSettings({ showLabels: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="truncate-label" className="text-sm">
            Truncate Labels
          </Label>
          <Switch
            id="truncate-label"
            checked={truncateLabels}
            onCheckedChange={(checked) =>
              setRadialSettings({ truncateLabels: checked })
            }
          />
        </div>

        {truncateLabels && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="label-width" className="text-sm">
                Truncate Length
              </Label>
              <span className="text-xs text-muted-foreground">
                {maxLabelWidth}px
              </span>
            </div>
            <Slider
              id="label-width"
              min={0}
              max={500}
              step={10}
              value={[maxLabelWidth]}
              onValueChange={([val]) => {
                setRadialSettings({ maxLabelWidth: val });
              }}
              className="cursor-pointer"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="communities-in-arcs" className="text-sm">
            Include Communities
          </Label>
          <Switch
            id="communities-in-arcs"
            checked={radialSettings.communitiesInArcs}
            onCheckedChange={(checked) =>
              setRadialSettings({ communitiesInArcs: checked })
            }
          />
        </div>

        {(enabledNodeCentralityKeys.length > 0 &&
          enabledNodeAttributeKeys.length > 0) ||
        (enabledNodeCentralityKeys.length > 0 &&
          communitiesInArcs &&
          enabledNodeCommunityKeys.length > 0) ||
        (enabledNodeAttributeKeys.length > 0 &&
          communitiesInArcs &&
          enabledNodeCommunityKeys.length > 0) ? (
          <div className="flex items-center justify-between">
            <Label htmlFor="separate-metrics" className="text-sm">
              Separate Metric Types
            </Label>
            <Switch
              id="separate-metrics"
              checked={separateMetrics}
              onCheckedChange={(checked) =>
                setRadialSettings({ separateMetrics: checked })
              }
            />
          </div>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor="community-select" className="text-sm">
            Display Community Ring
          </Label>
          <Select
            value={radialSettings.selectedRingCommunity ?? "none"}
            onValueChange={handleCommunityChange}
          >
            <SelectTrigger
              id="community-select"
              className="w-full text-sm"
              size="sm"
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

export default RadialDisplaySettings;
