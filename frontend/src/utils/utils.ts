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
    return x
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }

  return String(x);
}

export function scalePadding(
  value: number,
  maxItems: number,
  maxPadding: number,
): number {
  if (value <= 1) return 0;
  if (value <= 2) return 0.01;
  return Math.min(value / maxItems, 1) * maxPadding;
}

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
