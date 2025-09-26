import { Button } from "@/components/shadcnUI/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcnUI/popover";
import { RadioGroup, RadioGroupItem } from "@/components/shadcnUI/radio-group";
import type { SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface SortDirectionSelectorProps {
  sorting: SortingState;
  setSorting: (sorting: SortingState) => void;
}

const SortDirectionSelector = ({
  sorting,
  setSorting,
}: SortDirectionSelectorProps) => {
  const isDisabled = sorting.length === 0;
  const currentDirection = sorting[0]?.desc ? "desc" : "asc";

  const handleDirectionChange = (direction: string) => {
    if (sorting.length > 0) {
      setSorting([{ id: sorting[0].id, desc: direction === "desc" }]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={isDisabled}
          className="w-full cursor-pointer"
        >
          Direction
          {!isDisabled &&
            (sorting[0].desc ? <ArrowDown size={14} /> : <ArrowUp size={14} />)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <RadioGroup
          value={isDisabled ? "" : currentDirection}
          onValueChange={handleDirectionChange}
          disabled={isDisabled}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="asc" id="asc" disabled={isDisabled} />
              <label
                htmlFor="asc"
                className={`flex items-center gap-2 text-sm ${isDisabled ? "text-muted-foreground" : ""}`}
              >
                <ArrowUp size={14} />
                Ascending
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="desc" id="desc" disabled={isDisabled} />
              <label
                htmlFor="desc"
                className={`flex items-center gap-2 text-sm ${isDisabled ? "text-muted-foreground" : ""}`}
              >
                <ArrowDown size={14} />
                Descending
              </label>
            </div>
          </div>
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
};

export default SortDirectionSelector;
