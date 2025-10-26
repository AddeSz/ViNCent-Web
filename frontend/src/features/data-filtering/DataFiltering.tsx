import KeySelector from "@/features/data-filtering/components/KeySelector";
import { useKeys } from "@/hooks/useKeys";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import { useMetricsStore } from "@/stores/useMetricsStore";
import NodeSelector from "./components/NodeSelector";
import SortingSelector from "./components/SortingSelector";

const DataFiltering = () => {
  const displayMode = useChartSettings((s) => s.displaySettings.displayMode);
  const { sorting, setSorting, handleSortKeyChange } = useSortingLogic();
  const {
    attributeKeys: allAttributeKeys,
    enabledAttributeKeys,
    centralityKeys: allCentralityKeys,
    enabledCentralityKeys,
  } = useKeys();
  const toggleMetricsKey = useMetricsStore((s) => s.toggleMetricsKey);
  const isCentralityVisible =
    displayMode === "centrality" || displayMode === "both";
  const isAttributeVisible =
    (displayMode === "attributes" || displayMode === "both") &&
    allAttributeKeys.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-0 w-full cursor-default truncate" title="Key Filtering">
        Key Filtering
      </p>
      <div className="flex flex-wrap gap-2">
        {isCentralityVisible && (
          <div className="w-full grow sm:flex-1">
            <KeySelector
              label="Centralities"
              options={allCentralityKeys}
              enabledKeys={enabledCentralityKeys}
              toggleKey={toggleMetricsKey}
              sorting={sorting}
              setSorting={setSorting}
            />
          </div>
        )}

        {isAttributeVisible && (
          <div className="w-full grow sm:flex-1">
            <KeySelector
              label={"Attributes"}
              options={allAttributeKeys}
              enabledKeys={enabledAttributeKeys}
              toggleKey={toggleMetricsKey}
              sorting={sorting}
              setSorting={setSorting}
            />
          </div>
        )}
      </div>
      <p className="mb-0 w-full cursor-default truncate" title="Sorting">
        Sorting
      </p>
      <SortingSelector
        sorting={sorting}
        onSortKeyChange={handleSortKeyChange}
        setSorting={setSorting}
      />

      <p className="mb-0 w-full cursor-default truncate" title="Nodes">
        Nodes
      </p>
      <NodeSelector />
    </div>
  );
};

export default DataFiltering;
