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
    <ToggleGroup
      type="single"
      value={dataType}
      onValueChange={(value) => {
        if (value) setDataType(value as "nodes" | "edges" | "attributes");
      }}
      variant="outline"
      className="justify-start"
    >
      <ToggleGroupItem
        value="nodes"
        size="default"
        className="cursor-pointer px-3"
      >
        Nodes ({tableCounts.nodes})
      </ToggleGroupItem>
      <ToggleGroupItem
        value="edges"
        size="default"
        className="cursor-pointer px-3"
      >
        Edges ({tableCounts.edges})
      </ToggleGroupItem>
      <ToggleGroupItem
        value="attributes"
        size="default"
        className="cursor-pointer px-3"
      >
        Attributes ({tableCounts.attributes})
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

export default TableTypeToggle;
