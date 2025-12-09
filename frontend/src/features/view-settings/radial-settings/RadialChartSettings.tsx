import RadialDisplaySettings from "./RadialDisplaySettings";
import RadialEdgeSettings from "./RadialEdgeSettings";

interface RadialSettingsProps {
  isOpenDisplay: boolean;
  isOpenEdge: boolean;
  setIsOpenDisplay: (open: boolean) => void;
  setIsOpenEdge: (open: boolean) => void;
}

const RadialChartSettings = ({
  isOpenDisplay,
  isOpenEdge,
  setIsOpenDisplay,
  setIsOpenEdge,
}: RadialSettingsProps) => {
  return (
    <div className="flex flex-col">
      <RadialDisplaySettings
        isOpen={isOpenDisplay}
        setIsOpen={setIsOpenDisplay}
      />
      <RadialEdgeSettings isOpen={isOpenEdge} setIsOpen={setIsOpenEdge} />
    </div>
  );
};

export default RadialChartSettings;
