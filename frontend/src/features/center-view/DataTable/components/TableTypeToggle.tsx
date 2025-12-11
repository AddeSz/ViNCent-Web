import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface TableTypeToggleProps {
  dataType: "nodes" | "edges" | "attributes";
  setDataType: (type: "nodes" | "edges" | "attributes") => void;
  tableCounts: { nodes: number; edges: number; attributes: number };
}

const TableTypeToggle = ({
  dataType,
  setDataType,
  tableCounts,
}: TableTypeToggleProps) => {
  return (
    <div className="pt-2">
      <ToggleGroup
        type="single"
        value={dataType}
        onValueChange={(value) => {
          if (value) setDataType(value as "nodes" | "edges" | "attributes");
        }}
        variant="outline"
        className="justify-start"
      >
        <ToggleGroupItem value="nodes" size="default">
          Nodes ({tableCounts.nodes})
        </ToggleGroupItem>
        <ToggleGroupItem value="edges" size="default">
          Edges ({tableCounts.edges})
        </ToggleGroupItem>
        <ToggleGroupItem value="attributes" size="default">
          Attributes ({tableCounts.attributes})
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default TableTypeToggle;
