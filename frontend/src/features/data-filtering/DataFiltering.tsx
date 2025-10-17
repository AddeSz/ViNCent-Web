import type { ViewType } from "@/App";
import DataSummary from "@/components/DataSummary";
import { TimestepSlider } from "@/components/TimeStepSlider";
import KeySelector from "@/features/data-filtering/components/KeySelector";
import { useKeys } from "@/hooks/useKeys";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import type { FullData, Network } from "@/types/network";
import NodeSelector from "./components/NodeSelector";
import SortingSelector from "./components/SortingSelector";

interface DataFilteringProps {
  view: ViewType;
  dataMap: Map<string, FullData>;
  filteredNetwork: Network;
}
const DataFiltering = ({
  view,
  dataMap,
  filteredNetwork,
}: DataFilteringProps) => {
  const displayMode = useChartSettings((s) => s.displaySettings.displayMode);
  const { sorting, setSorting, handleSortKeyChange } = useSortingLogic();
  const toggleCentralityKey = useCentralityStore((s) => s.toggleCentralityKey);
  const {
    attributeKeys: allAttributeKeys,
    enabledAttributeKeys,
    centralityKeys: allCentralityKeys,
    enabledCentralityKeys,
  } = useKeys();
  const toggleAttributeKey = useAttributeStore((s) => s.toggleAttributeKey);

  const isCentralityVisible =
    displayMode === "centrality" || displayMode === "both";
  const isAttributeVisible =
    (displayMode === "attributes" || displayMode === "both") &&
    allAttributeKeys.length > 0;
  return (
    <div className="flex flex-col gap-1">
      <h2 className="mb-0 w-full cursor-default truncate" title="Key Filtering">
        Key Filtering
      </h2>
      <div className="flex flex-wrap gap-2">
        {isCentralityVisible && (
          <div className="w-full flex-grow sm:flex-1">
            <KeySelector
              label="Centralities"
              options={allCentralityKeys}
              enabledKeys={enabledCentralityKeys}
              toggleKey={toggleCentralityKey}
              sorting={sorting}
              setSorting={setSorting}
            />
          </div>
        )}

        {isAttributeVisible && (
          <div className="w-full flex-grow sm:flex-1">
            <KeySelector
              label={"Attributes"}
              options={allAttributeKeys}
              enabledKeys={enabledAttributeKeys}
              toggleKey={toggleAttributeKey}
              sorting={sorting}
              setSorting={setSorting}
            />
          </div>
        )}
      </div>
      <h2 className="mb-0 w-full cursor-default truncate" title="Sorting">
        Sorting
      </h2>
      <SortingSelector
        sorting={sorting}
        onSortKeyChange={handleSortKeyChange}
        setSorting={setSorting}
      />

      <h2 className="mb-0 w-full cursor-default truncate" title="Nodes">
        Nodes
      </h2>
      <NodeSelector />
      {view === "data-table" && <TimestepSlider />}
      {view === "data-table" && (
        <DataSummary filteredNetwork={filteredNetwork} dataMap={dataMap} />
      )}
    </div>
  );
};

export default DataFiltering;
