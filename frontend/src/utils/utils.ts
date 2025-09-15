export function getNodeId(value: string | { id: string }): string {
  return typeof value === "string" ? value : value.id;
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
