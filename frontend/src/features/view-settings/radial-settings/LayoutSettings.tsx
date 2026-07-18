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
import SortingSelector from "@/features/view-settings/components/SortingSelector";
import { useCurrentMetricsInfo } from "@/hooks/useCurrentMetricsInfo";
import { useKeys } from "@/hooks/useKeys";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { formatKeyLabel } from "@/utils/utils";
import { ChevronDown } from "lucide-react";

interface LayoutSettingsProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const LayoutSettings = ({ isOpen, setIsOpen }: LayoutSettingsProps) => {
  const {
    radialSettings,
    setRadialSettings,
    displaySettings,
    setDisplaySettings,
  } = useSettingsStore();
  const { innerRadius, outerRadius, separateMetrics, communitiesInArcs } =
    radialSettings;
  const selectedCommunity = displaySettings.selectedCommunity;

  const {
    enabledNodeAttributeKeys,
    enabledNodeCentralityKeys,
    enabledNodeCommunityKeys,
    allNodeCommunityKeys,
  } = useKeys();

  const outerRadiusMin = innerRadius + 200;

  const metricsInfo = useCurrentMetricsInfo();

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
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-border/50">
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
            isOpen ? "rotate-0" : "-rotate-90"
          }`}
        />
        <p className="truncate pl-1">Layout</p>
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
        </div>

        {allNodeCommunityKeys.length > 0 && (
          <div className="flex items-center justify-between">
            <Label htmlFor="communities-in-arcs" className="text-sm">
              Include Communities
            </Label>
            <Switch
              id="communities-in-arcs"
              checked={communitiesInArcs}
              onCheckedChange={(checked) =>
                setRadialSettings({ communitiesInArcs: checked })
              }
            />
          </div>
        )}

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

        {allNodeCommunityKeys.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor={"community-select"} className="text-sm">
              Display Community
            </Label>
            <Select
              value={selectedCommunity ?? "none"}
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
                <SelectItem value="none" className="text-sm">
                  None
                </SelectItem>
                {enabledNodeCommunityKeys.map((communityName) => (
                  <SelectItem
                    key={communityName}
                    value={communityName}
                    className="text-sm"
                  >
                    {formatCommunityLabel(communityName)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <SortingSelector />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default LayoutSettings;
