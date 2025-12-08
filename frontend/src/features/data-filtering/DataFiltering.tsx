import KeySelector from "@/features/data-filtering/components/KeySelector";
import { useKeys } from "@/hooks/useKeys";
import { useSortingLogic } from "@/hooks/useSortingLogic";
import { useMetricsStore } from "@/stores/useMetricsStore";
import NodeSelector from "./components/NodeSelector";
import SortingSelector from "./components/SortingSelector";

const DataFiltering = () => {
  const { sorting, setSorting, handleSortKeyChange } = useSortingLogic();
  const { enabledNodeKeys, allNodeKeys, allEdgeKeys, enabledEdgeKeys } =
    useKeys();
  const toggleMetricsKey = useMetricsStore((s) => s.toggleMetricsKey);

  return (
    <div className="flex flex-col gap-1">
      <p className="mb-0 w-full cursor-default truncate" title="Key Filtering">
        Key Filtering
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full grow sm:flex-1">
          <KeySelector
            label="Node Keys"
            options={allNodeKeys}
            enabledKeys={enabledNodeKeys}
            toggleKey={toggleMetricsKey}
            sorting={sorting}
            setSorting={setSorting}
          />
        </div>
        <div className="w-full grow sm:flex-1">
          <KeySelector
            label="Edge Keys"
            options={allEdgeKeys}
            enabledKeys={enabledEdgeKeys}
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
