import type { Link } from "@/types/network";

export function getNodeId(value: string | { id: string }): string {
  return typeof value === "string" ? value : value.id;
}

export function getEdgeId(link: Link): string {
  const s = getNodeId(link.source);
  const t = getNodeId(link.target);
  const edgeId = link.directed ? `${s}|${t}` : [s, t].sort().join("|");
  return edgeId;
}

export function formatKeyLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\./g, ": ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function formatValue(x: any): string {
  if (x === undefined || x === null) return "N/A";

  if (typeof x === "number") {
    if (isNaN(x)) return "N/A";

    if (Math.abs(x) >= 1000) {
      return Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(x);
    }
    if (Math.abs(x) < 1) {
      return Intl.NumberFormat("en", {
        maximumFractionDigits: 4,
      }).format(x);
    }

    if (Math.abs(x) <= 100) {
      return Intl.NumberFormat("en", {
        maximumFractionDigits: 3,
      }).format(x);
    }

    return Intl.NumberFormat("en", {
      maximumFractionDigits: 2,
    }).format(x);
  }

  if (typeof x === "string") {
    return x
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }

  return String(x);
}

export const calculateBandwidth = (numNodes: number): number => {
  if (numNodes === 0) return 0;
  if (numNodes === 1) return 2 * Math.PI;

  const gapProportion = calculateGapProportion(numNodes);
  const arcProportion = 1 - gapProportion;
  const arcSize = (2 * Math.PI * arcProportion) / numNodes;

  return arcSize;
};

export const calculateGapProportion = (dataLength: number): number => {
  if (dataLength <= 100) return 0.5;
  if (dataLength >= 1000) return 0;
  if (dataLength <= 500) {
    const t = (dataLength - 100) / (500 - 100);
    return 0.5 - t * 0.3;
  }
  const t = (dataLength - 500) / (1000 - 500);
  return 0.3 - t * 0.3;
};

export function truncateText(
  textEl: SVGTextElement,
  label: string,
  maxWidth: number,
): string {
  if (maxWidth === 0) return "";
  const ellipsis = "…";
  textEl.textContent = label;

  if (textEl.getSubStringLength(0, label.length) <= maxWidth) {
    return label;
  }

  let i = label.length;
  while (i > 0 && textEl.getSubStringLength(0, i) > maxWidth - 10) {
    i--;
  }

  return label.slice(0, i) + ellipsis;
}
