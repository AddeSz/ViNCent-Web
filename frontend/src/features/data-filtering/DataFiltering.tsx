import KeySelector from "@/features/data-filtering/components/KeySelector";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useChartSettings } from "@/stores/useChartSettingsStore";
import SortDirectionSelector from "./components/SortDirectionSelector";
import SortingSelector from "./components/SortingSelector";

const DataFiltering = () => {
  const displayMode = useChartSettings((s) => s.displayMode);
  const { sorting, setSorting, handleSortKeyChange } = useSortingLogic();

  const allCentralityKeys = useCentralityStore((s) => s.centralityKeys);
  const enabledCentralityKeys = useCentralityStore(
    (s) => s.enabledCentralityKeys,
  );
  const toggleCentralityKey = useCentralityStore((s) => s.toggleCentralityKey);

  const allAttributeKeys = useAttributeStore((s) => s.attributeKeys);
  const enabledAttributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const toggleAttributeKey = useAttributeStore((s) => s.toggleAttributeKey);

  const isCentralityVisible =
    displayMode === "centrality" || displayMode === "both";
  const isAttributeVisible =
    displayMode === "attributes" || displayMode === "both";

  return (
    <>
      <h2 className="mb-0 cursor-default">Key Filtering</h2>
      <div className="flex flex-wrap gap-2">
        {isCentralityVisible && (
          <div className="w-full flex-grow sm:w-auto sm:flex-1">
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
          <div className="w-full flex-grow sm:w-auto sm:flex-1">
            <KeySelector
              label="Attributes"
              options={allAttributeKeys}
              enabledKeys={enabledAttributeKeys}
              toggleKey={toggleAttributeKey}
              sorting={sorting}
              setSorting={setSorting}
            />
          </div>
        )}
      </div>

      <h2 className="mb-0 cursor-default">Sorting</h2>
      <div className="flex flex-wrap gap-2">
        <div className="w-full flex-grow sm:w-auto sm:flex-1">
          <SortingSelector
            sorting={sorting}
            onSortKeyChange={handleSortKeyChange}
          />
        </div>
        <div className="w-full flex-grow sm:w-auto sm:flex-1">
          <SortDirectionSelector sorting={sorting} setSorting={setSorting} />
        </div>
      </div>
    </>
  );
};

export default DataFiltering;
