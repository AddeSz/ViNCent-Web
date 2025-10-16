import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { ChevronsUpDown, EyeOff, RotateCcw } from "lucide-react";
import { useMemo } from "react";

const NodeSelector = () => {
  const hiddenNodes = useNetworkStore((s) => s.hiddenNodes);
  const nodeMap = useNetworkStore((s) => s.nodeMap);
  const restoreNode = useNetworkStore((s) => s.restoreNode);
  const restoreAllNodes = useNetworkStore((s) => s.restoreAllNodes);

  const hiddenNodesList = useMemo(() => {
    return Array.from(hiddenNodes)
      .map((id) => {
        const node = nodeMap.get(id);
        return node ? { id, label: node.label || id } : null;
      })
      .filter((n) => n !== null)
      .sort((a, b) => a!.label.localeCompare(b!.label));
  }, [hiddenNodes, nodeMap]);

  const isDisabled = hiddenNodes.size === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-full flex-grow sm:flex-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              title="Hidden Nodes"
              className="flex w-full cursor-pointer items-center justify-center gap-2 px-2"
              disabled={isDisabled}
            >
              <div className="flex w-full items-center justify-center gap-2">
                <p className="w-fit truncate">
                  Hidden Nodes ({hiddenNodes.size})
                </p>

                <ChevronsUpDown className="h-4 w-4" />
              </div>
            </Button>
          </PopoverTrigger>

          {!isDisabled && (
            <PopoverContent className="scrollbar-thin max-h-64 w-46 overflow-y-auto p-1">
              <div className="flex flex-col space-y-1">
                {hiddenNodesList.map((node) => (
                  <div
                    key={node!.id}
                    className="flex w-full cursor-pointer items-center justify-between rounded p-1 px-2 text-sm hover:bg-accent"
                    onClick={() => restoreNode(node!.id)}
                    title={node!.label}
                  >
                    <Label className="flex-1 cursor-pointer truncate">
                      {node!.label}
                    </Label>
                    <EyeOff size={16} className="ml-2 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>

      <div className="w-full flex-grow sm:flex-1">
        <Button
          variant="outline"
          title="Restore All Nodes"
          onClick={() => restoreAllNodes()}
          disabled={hiddenNodes.size === 0}
          className="flex w-full cursor-pointer items-center justify-center gap-2 px-2"
        >
          <div className="flex w-full items-center justify-center gap-2">
            <p className="w-fit truncate">Restore All</p>
            <RotateCcw className="h-4 w-4" />
          </div>
        </Button>
      </div>
    </div>
  );
};

export default NodeSelector;
