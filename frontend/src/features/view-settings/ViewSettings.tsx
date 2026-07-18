import type { ViewType } from "@/App";
import { TimestepSlider } from "@/components/TimeStepSlider";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useKeys } from "@/hooks/useKeys";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import DisplaySettings from "./components/DisplaySettings";
import KeySelector from "./components/KeySelector";
import NodeLinkDiagramSettings from "./nodel-link-settings/NodeLinkDiagramSettings";
import RadialChartSettings from "./radial-settings/RadialChartSettings";

interface ViewSettingsProps {
  view: ViewType;
}

const ViewSettings = ({ view }: ViewSettingsProps) => {
  const [isOpenTime, setIsOpenTime] = useState(true);
  const [isOpenDisplay, setIsOpenDisplay] = useState(false);
  const [isOpenEdge, setIsOpenEdge] = useState(false);
  const [isOpenPhysics, setIsOpenPhysics] = useState(false);
  const [isOpenNode, setIsOpenNode] = useState(false);
  const [isOpenLink, setIsOpenLink] = useState(false);
  const [isOpenKeys, setIsOpenKeys] = useState(false);
  const [isOpenLabel, setIsOpenLabel] = useState(false);

  const { resetRadialSettings, resetNodeLinkSettings, resetDisplaySettings } =
    useSettingsStore();
  const timesteps = useNetworkStore((s) => s.timesteps);
  const {
    allEdgeKeys,
    allNodeAttributeKeys,
    allNodeCentralityKeys,
    allNodeCommunityKeys,
    enabledEdgeKeys,
    enabledNodeAttributeKeys,
    enabledNodeCentralityKeys,
    enabledNodeCommunityKeys,
  } = useKeys();

  return (
    <>
      <DisplaySettings />

      {view === "radial" && (
        <RadialChartSettings
          isOpenDisplay={isOpenDisplay}
          isOpenEdge={isOpenEdge}
          isOpenLabel={isOpenLabel}
          setIsOpenDisplay={setIsOpenDisplay}
          setIsOpenEdge={setIsOpenEdge}
          setIsOpenLabel={setIsOpenLabel}
        />
      )}

      {view === "node-link" && (
        <NodeLinkDiagramSettings
          isOpenPhysics={isOpenPhysics}
          isOpenNode={isOpenNode}
          isOpenLink={isOpenLink}
          isOpenLabel={isOpenLabel}
          setIsOpenPhysics={setIsOpenPhysics}
          setIsOpenNode={setIsOpenNode}
          setIsOpenLink={setIsOpenLink}
          setIsOpenLabel={setIsOpenLabel}
        />
      )}

      {view === "data-table" && timesteps.length > 1 && (
        <Collapsible open={isOpenTime} onOpenChange={setIsOpenTime}>
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-border/50">
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
                isOpenTime ? "rotate-0" : "-rotate-90"
              }`}
            />
            <p className="truncate pl-1">Time Controls</p>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 py-2">
            <TimestepSlider />
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible open={isOpenKeys} onOpenChange={setIsOpenKeys}>
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-0.5 transition-colors hover:bg-border/50">
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
              isOpenKeys ? "rotate-0" : "-rotate-90"
            }`}
          />
          <p className="truncate pl-1">Data Keys</p>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 py-2">
          {allNodeCentralityKeys.length + allNodeAttributeKeys.length > 0 && (
            <KeySelector
              label="Nodes..."
              description="Toggle Node Attributes"
              options={[...allNodeCentralityKeys, ...allNodeAttributeKeys]}
              enabledKeys={[
                ...enabledNodeCentralityKeys,
                ...enabledNodeAttributeKeys,
              ]}
              type="node"
            />
          )}
          {allNodeCommunityKeys.length > 0 && (
            <KeySelector
              label="Communities..."
              description="Toggle Communities"
              options={allNodeCommunityKeys}
              enabledKeys={enabledNodeCommunityKeys}
              type="community"
            />
          )}
          {allEdgeKeys.length > 0 && (
            <KeySelector
              label="Edges..."
              description="Toggle Edge Attributes"
              options={allEdgeKeys}
              enabledKeys={enabledEdgeKeys}
              type="edge"
            />
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-2 px-2 py-2">
        <Button
          onClick={() => {
            resetDisplaySettings();
            if (view === "radial") {
              resetRadialSettings();
            } else if (view === "node-link") {
              resetNodeLinkSettings();
            }
          }}
          variant="outline"
          className="w-full"
        >
          <span className="flex-wrap truncate">Reset Settings</span>
        </Button>
      </div>
    </>
  );
};

export default ViewSettings;
