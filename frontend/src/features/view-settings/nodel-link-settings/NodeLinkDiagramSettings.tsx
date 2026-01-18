import LabelSettings from "../components/LabelSettings";
import LinkSettings from "./LinkSettings";
import NodeSettings from "./NodeSettings";
import PhysicsSettings from "./PhysicsSettings";

interface NodeLinkDiagramSettingsProps {
  isOpenPhysics: boolean;
  isOpenNode: boolean;
  isOpenLink: boolean;
  isOpenLabel: boolean;
  setIsOpenPhysics: (open: boolean) => void;
  setIsOpenNode: (open: boolean) => void;
  setIsOpenLink: (open: boolean) => void;
  setIsOpenLabel: (open: boolean) => void;
}

const NodeLinkDiagramSettings = ({
  isOpenPhysics,
  isOpenNode,
  isOpenLink,
  isOpenLabel,
  setIsOpenPhysics,
  setIsOpenNode,
  setIsOpenLink,
  setIsOpenLabel,
}: NodeLinkDiagramSettingsProps) => {
  return (
    <div className="flex flex-col">
      <PhysicsSettings isOpen={isOpenPhysics} setIsOpen={setIsOpenPhysics} />
      <NodeSettings isOpen={isOpenNode} setIsOpen={setIsOpenNode} />
      <LinkSettings isOpen={isOpenLink} setIsOpen={setIsOpenLink} />
      <LabelSettings
        isOpen={isOpenLabel}
        setIsOpen={setIsOpenLabel}
        settingsType="nodeLinkSettings"
      />
    </div>
  );
};

export default NodeLinkDiagramSettings;
