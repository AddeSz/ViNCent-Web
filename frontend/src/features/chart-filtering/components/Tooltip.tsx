import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  isVisible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  margin: { top: number; right: number; bottom: number; left: number };
  targetX: number;
  targetWidth?: number;
  children: React.ReactNode;
}

export const Tooltip = ({
  isVisible,
  containerRef,
  margin,
  targetX,
  targetWidth = 0,
  children,
}: TooltipProps) => {
  const estimatedTooltipWidth = 120;
  const estimatedTooltipHeight = 60;
  const [tooltipWidth, setTooltipWidth] = useState<number>(
    estimatedTooltipWidth,
  );
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipWidth(tooltipRef.current.offsetWidth);
    }
  }, [children, isVisible]);

  if (!isVisible || !containerRef.current) return null;

  const rect = containerRef.current.getBoundingClientRect();
  const tooltipX = rect.left + margin.left + targetX + targetWidth / 2;
  let tooltipY = rect.top + margin.top - 6;
  const minLeft = rect.left;
  const maxLeft = rect.right;
  let offsetX = "-50%";
  let offsetY = "-100%";
  let left = tooltipX;
  let showArrowBelow = true;
  let arrowLeft = "50%";

  if (tooltipX - tooltipWidth / 2 < minLeft + 4) {
    left = minLeft;
    offsetX = "0";
    arrowLeft = `${tooltipX - minLeft - 1}px`;
  } else if (tooltipX + tooltipWidth / 2 > maxLeft - 4) {
    left = maxLeft;
    offsetX = "-100%";
    arrowLeft = `${tooltipX - maxLeft + tooltipWidth}px`;
  }

  if (tooltipY - estimatedTooltipHeight < 4) {
    tooltipY = rect.bottom - margin.bottom + 6;
    offsetY = "0";
    showArrowBelow = false;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed z-50"
      style={{
        left,
        top: tooltipY,
        transform: `translate(${offsetX}, ${offsetY})`,
      }}
    >
      <div
        ref={tooltipRef}
        className="relative rounded bg-popover px-2 py-1 text-xs whitespace-nowrap shadow-md"
        style={{
          maxWidth: 200,
          border: "1px solid var(--border)",
        }}
      >
        {children}
        {showArrowBelow ? (
          <div
            className="absolute -translate-x-1/2"
            style={{
              left: arrowLeft,
              bottom: "-6px",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid var(--border)",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "1px",
                left: "-6px",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid var(--popover)",
              }}
            />
          </div>
        ) : (
          <div
            className="absolute -translate-x-1/2"
            style={{
              left: arrowLeft,
              top: "-6px",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "6px solid var(--border)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "1px",
                left: "-6px",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderBottom: "6px solid var(--popover)",
              }}
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
