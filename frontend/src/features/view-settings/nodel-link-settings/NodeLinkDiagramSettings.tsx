import LinkSettings from "./LinkSettings";
import NodeSettings from "./NodeSettings";
import PhysicsSettings from "./PhysicsSettings";

interface NodeLinkDiagramSettingsProps {
  isOpenPhysics: boolean;
  isOpenNode: boolean;
  isOpenLink: boolean;
  setIsOpenPhysics: (open: boolean) => void;
  setIsOpenNode: (open: boolean) => void;
  setIsOpenLink: (open: boolean) => void;
}

const NodeLinkDiagramSettings = ({
  isOpenPhysics,
  isOpenNode,
  isOpenLink,
  setIsOpenPhysics,
  setIsOpenNode,
  setIsOpenLink,
}: NodeLinkDiagramSettingsProps) => {
  return (
    <div className="flex flex-col">
      <PhysicsSettings isOpen={isOpenPhysics} setIsOpen={setIsOpenPhysics} />
      <NodeSettings isOpen={isOpenNode} setIsOpen={setIsOpenNode} />
      <LinkSettings isOpen={isOpenLink} setIsOpen={setIsOpenLink} />
    </div>
  );
};

export default NodeLinkDiagramSettings;
