import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { ChevronsUpDown, EyeOff, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NodeSelector = () => {
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (hiddenNodes.size === 0 && open) {
      setOpen(false);
    }
  }, [hiddenNodes.size, open]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-full grow sm:flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              title="Restore Hidden Nodes"
              className="flex w-full cursor-pointer items-center px-2"
              disabled={isDisabled}
            >
              <p className="w-fit truncate">
                Restore Node (
                <span className="tabular-nums">{hiddenNodes.size}</span>)
              </p>
              <ChevronsUpDown />
            </Button>
          </PopoverTrigger>
          {!isDisabled && (
            <PopoverContent className="w-54 p-0" align="start" side="top">
              <Command>
                <CommandInput placeholder="Search nodes..." className="h-9" />
                <CommandEmpty>No nodes found.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {hiddenNodesList.map((node) => (
                      <CommandItem
                        key={node!.id}
                        value={node!.label}
                        onSelect={() => {
                          restoreNode(node!.id);
                        }}
                        className="flex cursor-pointer items-center justify-between"
                        title={`Restore ${node!.label}`}
                      >
                        <p className="flex-1 truncate">{node!.label}</p>
                        <EyeOff />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
      </div>
      <div className="w-full grow sm:flex-1">
        <Button
          variant="outline"
          title="Restore All Nodes"
          onClick={() => restoreAllNodes()}
          disabled={isDisabled}
          className="flex w-full cursor-pointer items-center justify-center gap-2 px-2"
        >
          <div className="flex w-full items-center justify-center gap-2">
            <p className="w-fit truncate">Restore All</p>
            <RotateCcw />
          </div>
        </Button>
      </div>
    </div>
  );
};

export default NodeSelector;
