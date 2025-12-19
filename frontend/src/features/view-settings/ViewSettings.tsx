import type { ViewType } from "@/App";
import FileUploader from "@/components/file-uploader/FileUploader";
import { TimestepSlider } from "@/components/TimeStepSlider";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import KeySelector from "../data-filtering/components/KeySelector";
import SortingSelector from "../data-filtering/components/SortingSelector";
import DisplaySettings from "./components/DisplaySettings";
import NodeLinkDiagramSettings from "./nodel-link-settings/NodeLinkDiagramSettings";
import RadialChartSettings from "./radial-settings/RadialChartSettings";

interface ViewSettingsProps {
  onLoadingStart?: () => void;
  onLoadingComplete?: () => void;
  onLoadingError?: (error: string) => void;
  view: ViewType;
}

const ViewSettings = ({
  onLoadingStart,
  onLoadingComplete,
  onLoadingError,
  view,
}: ViewSettingsProps) => {
  const [isOpenTime, setIsOpenTime] = useState(true);
  const [isOpenDisplay, setIsOpenDisplay] = useState(false);
  const [isOpenEdge, setIsOpenEdge] = useState(false);
  const [isOpenPhysics, setIsOpenPhysics] = useState(false);
  const [isOpenNode, setIsOpenNode] = useState(false);
  const [isOpenLink, setIsOpenLink] = useState(false);
  const [isOpenKeys, setIsOpenKeys] = useState(false);

  const { resetRadialSettings, resetNodeLinkSettings } = useSettingsStore();
  const timesteps = useMetricsStore((s) => s.timesteps);
  const {
    enabledNodeKeys,
    allNodeKeys,
    allEdgeKeys,
    enabledEdgeKeys,
    enabledNodeCommunityKeys,
  } = useKeys();

  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center border-b-2 bg-background px-2 py-2">
        <span className="truncate text-lg">ViNCent Web</span>
      </div>

      <div className="border-b-2 bg-background px-2 py-2">
        <FileUploader
          onLoadingStart={onLoadingStart}
          onLoadingComplete={onLoadingComplete}
          onLoadingError={onLoadingError}
        />
      </div>

      <DisplaySettings />

      {view === "radial" && (
        <RadialChartSettings
          isOpenDisplay={isOpenDisplay}
          isOpenEdge={isOpenEdge}
          setIsOpenDisplay={setIsOpenDisplay}
          setIsOpenEdge={setIsOpenEdge}
        />
      )}

      {view === "node-link" && (
        <NodeLinkDiagramSettings
          isOpenPhysics={isOpenPhysics}
          isOpenNode={isOpenNode}
          isOpenLink={isOpenLink}
          setIsOpenPhysics={setIsOpenPhysics}
          setIsOpenNode={setIsOpenNode}
          setIsOpenLink={setIsOpenLink}
        />
      )}

      {view === "data-table" && timesteps.length > 1 && (
        <Collapsible open={isOpenTime} onOpenChange={setIsOpenTime}>
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-1 transition-colors hover:bg-border/50">
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
                isOpenTime ? "rotate-0" : "-rotate-90"
              }`}
            />
            <p className="truncate pl-1">Time Settings</p>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 py-2">
            <TimestepSlider />
          </CollapsibleContent>
        </Collapsible>
      )}

      <Collapsible open={isOpenKeys} onOpenChange={setIsOpenKeys}>
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center border-b-2 px-1 py-1 transition-colors hover:bg-border/50">
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform duration-100 ${
              isOpenKeys ? "rotate-0" : "-rotate-90"
            }`}
          />
          <p className="truncate pl-1">Attribute Settings</p>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 border-b-2 bg-background px-2 py-2">
          <KeySelector
            label="Nodes"
            description="Toggle Node Attributes"
            options={allNodeKeys}
            enabledKeys={[...enabledNodeKeys, ...enabledNodeCommunityKeys]}
          />
          <KeySelector
            label="Edges"
            description="Toggle Edge Attributes"
            options={allEdgeKeys}
            enabledKeys={enabledEdgeKeys}
          />
          <SortingSelector />
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-2 px-2 py-2">
        <Button
          onClick={() => {
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
    </div>
  );
};

export default ViewSettings;
