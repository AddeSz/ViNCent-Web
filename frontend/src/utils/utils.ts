export function getNodeId(value: string | { id: string }): string {
  return typeof value === "string" ? value : value.id;
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
    const trimmed = x.trim();
    if (!trimmed) return "N/A";

    const formatted = trimmed
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\./g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    return formatted || "N/A";
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

export const calculateRadialSettings = (
  numNodes: number,
  numMetrics: number,
) => {
  const bandwidth = calculateBandwidth(numNodes);
  let targetWidth: number;
  if (numNodes <= 100) {
    targetWidth = 7;
  } else if (numNodes <= 500) {
    const t = (numNodes - 100) / (500 - 100);
    targetWidth = 7 - t * 2;
  } else if (numNodes <= 1000) {
    const t = (numNodes - 500) / (1000 - 500);
    targetWidth = 5 - t * 2.5;
  } else {
    targetWidth = 2.5;
  }

  let targetHeight: number;
  if (numMetrics > 30) {
    targetHeight = 10;
  } else if (numMetrics > 20) {
    targetHeight = 15;
  } else {
    targetHeight = 20;
  }

  const calculatedInnerRadius = bandwidth > 0 ? targetWidth / bandwidth : 150;
  const innerRadius = Math.max(150, calculatedInnerRadius);

  const calculatedOuterRadius =
    numMetrics > 0
      ? innerRadius + targetHeight * numMetrics
      : innerRadius + targetHeight;
  const clampedOuterRadius = Math.min(4000, calculatedOuterRadius);

  const outerRadius = Math.max(clampedOuterRadius, innerRadius + 200);

  const snapTo10 = (value: number) => Math.round(value / 10) * 10;
  return {
    innerRadius: snapTo10(innerRadius),
    outerRadius: snapTo10(outerRadius),
  };
};
