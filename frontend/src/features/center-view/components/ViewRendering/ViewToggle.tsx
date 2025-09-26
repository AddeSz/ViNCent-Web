import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnUI/toggle-group";
import type { ViewType } from "@/features/center-view/CenterView";

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="border-b-2 border-border">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(val) => val && onViewChange(val as ViewType)}
        className="rounded-l-none border-r-2 bg-card"
      >
        <ToggleGroupItem
          value="radial"
          className="w-30"
          aria-label="Toggle radial view"
        >
          Radial View
        </ToggleGroupItem>
        <ToggleGroupItem
          value="node-link"
          className="w-30"
          aria-label="Toggle node-link view"
        >
          Node-Link View
        </ToggleGroupItem>
        <ToggleGroupItem
          value="data-table"
          className="w-30"
          aria-label="Toggle data-table view"
        >
          Data Table View
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default ViewToggle;
