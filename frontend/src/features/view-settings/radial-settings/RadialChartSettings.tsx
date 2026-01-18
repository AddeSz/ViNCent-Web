import LabelSettings from "../components/LabelSettings";
import EdgeSettings from "./EdgeSettings";
import LayoutSettings from "./LayoutSettings";

interface RadialChartSettingsProps {
  isOpenDisplay: boolean;
  isOpenEdge: boolean;
  isOpenLabel: boolean;
  setIsOpenDisplay: (open: boolean) => void;
  setIsOpenEdge: (open: boolean) => void;
  setIsOpenLabel: (open: boolean) => void;
}

const RadialChartSettings = ({
  isOpenDisplay,
  isOpenEdge,
  isOpenLabel,
  setIsOpenDisplay,
  setIsOpenEdge,
  setIsOpenLabel,
}: RadialChartSettingsProps) => {
  return (
    <div className="flex flex-col">
      <LayoutSettings isOpen={isOpenDisplay} setIsOpen={setIsOpenDisplay} />
      <EdgeSettings isOpen={isOpenEdge} setIsOpen={setIsOpenEdge} />
      <LabelSettings
        isOpen={isOpenLabel}
        setIsOpen={setIsOpenLabel}
        settingsType="radialSettings"
      />
    </div>
  );
};

export default RadialChartSettings;
