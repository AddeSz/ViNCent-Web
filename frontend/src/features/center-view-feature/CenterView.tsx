import { useRef, useState, useEffect } from "react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/shadcnUI/toggle-group";
import { Button } from "@/components/shadcnUI/button";
import RadialChart from "./components/RadialChart/RadialChart";
import NodeLinkDiagram from "./components/NodeLinkDiagram/NodeLinkDiagram";

const VIEW_KEY = "center-view-mode";

const CenterView = () => {
  const [view, setView] = useState<"radial" | "node-link">("radial");
  const [isViewLoaded, setIsViewLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const radialResetRef = useRef<() => void>(null);
  const nodeLinkResetRef = useRef<() => void>(null);

  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_KEY);
    if (savedView === "radial" || savedView === "node-link") {
      setView(savedView);
    }
    setIsViewLoaded(true);
  }, []);

  useEffect(() => {
    if (isViewLoaded) {
      localStorage.setItem(VIEW_KEY, view);
    }
  }, [view, isViewLoaded]);

  if (!isViewLoaded) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b-2 border-border">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(val) => {
            if (val) setView(val as "radial" | "node-link");
          }}
          className="rounded-l-none border-r-2 bg-card"
        >
          <ToggleGroupItem
            value="radial"
            className="w-30 data-[state=on]:rounded-l-none"
            aria-label="Toggle radial view"
          >
            <div>Radial View</div>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="node-link"
            className="w-30"
            aria-label="Toggle node-link view"
          >
            <div>Node-Link View</div>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div ref={containerRef} className="flex-grow overflow-hidden bg-card">
        <div className="relative h-full w-full">
          <Button
            onClick={() => {
              if (view === "radial") radialResetRef.current?.();
              else if (view === "node-link") nodeLinkResetRef.current?.();
            }}
            className="absolute bottom-2 left-2 z-10 cursor-pointer rounded px-4 py-2 shadow"
          >
            Reset Zoom
          </Button>
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              view === "radial"
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <RadialChart containerRef={containerRef} ref={radialResetRef} />
          </div>

          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              view === "node-link"
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <NodeLinkDiagram
              containerRef={containerRef}
              ref={nodeLinkResetRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CenterView;
