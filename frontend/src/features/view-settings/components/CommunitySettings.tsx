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
import { Switch } from "@/components/ui/switch";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { formatKeyLabel } from "@/utils/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const CommunitySettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const currentCommunities = useMetricsStore((s) => s.currentCommunities);
  const radialSettings = useSettingsStore((s) => s.radialSettings);
  const setRadialSettings = useSettingsStore((s) => s.setRadialSettings);
  const metricsInfo = useMetricsStore((s) => s.currentMetricsInfo);

  const communityOptions = currentCommunities
    ? Object.keys(currentCommunities)
    : [];

  const handleCommunityChange = (value: string) => {
    setRadialSettings({ selectedRingCommunity: value });
  };

  const getCommunityCount = (communityName: string) => {
    if (
      !currentCommunities ||
      !currentCommunities[communityName] ||
      !metricsInfo.get(communityName)
    )
      return 0;
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
        <p className="truncate pl-1">Community Settings</p>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 border-b-2 bg-background p-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="communities-in-arcs" className="text-sm">
            Render In Chart
          </Label>
          <Switch
            id="communities-in-arcs"
            checked={radialSettings.communitiesInArcs}
            onCheckedChange={(checked) =>
              setRadialSettings({ communitiesInArcs: checked })
            }
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="community-select" className="text-sm">
            Community Ring
          </Label>
          <Select
            value={radialSettings.selectedRingCommunity}
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
              {communityOptions.map((communityName) => (
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

export default CommunitySettings;
