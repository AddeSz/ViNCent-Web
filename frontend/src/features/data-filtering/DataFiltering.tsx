import KeySelector from "@/features/data-filtering/components/KeySelector";
import { useKeys } from "@/hooks/useKeys";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import { useMetricsStore } from "@/stores/useMetricsStore";
import NodeSelector from "./components/NodeSelector";
import SortingSelector from "./components/SortingSelector";

const DataFiltering = () => {
  const { sorting, setSorting, handleSortKeyChange } = useSortingLogic();
  const { allKeys, metricsKeys } = useKeys();
  const toggleMetricsKey = useMetricsStore((s) => s.toggleMetricsKey);

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-0 w-full cursor-default truncate" title="Key Filtering">
        Key Filtering
      </p>
      <div className="flex flex-wrap gap-2">
        <div className="w-full">
          <KeySelector
            label="Available Keys"
            options={metricsKeys}
            enabledKeys={allKeys}
            toggleKey={toggleMetricsKey}
            sorting={sorting}
            setSorting={setSorting}
          />
        </div>
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
