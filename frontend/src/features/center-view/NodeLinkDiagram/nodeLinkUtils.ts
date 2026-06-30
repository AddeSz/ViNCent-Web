import type { ScaleType, SizeMode } from "@/stores/useSettingsStore";
import type { Edge, FullData, Node } from "@/types";
import type { InteractionProps } from "../Tooltips/useTooltip";

export const calculateNodeSizes = (
  nodes: Node[],
  dataMap: Map<string, FullData>,
  mode: SizeMode,
  metricKey: string,
  fixedSize: number,
  minSize: number,
  maxSize: number,
  scaleType: ScaleType,
): Map<string, number> => {
  const sizes = new Map<string, number>();

  if (mode === "fixed" || !metricKey) {
    nodes.forEach((node) => sizes.set(node.id, fixedSize));
    return sizes;
  }

  const values: number[] = [];

  nodes.forEach((node) => {
    const nodeData = dataMap.get(node.id);
    if (!nodeData) return;

    const value = nodeData[metricKey];
    if (typeof value === "number" && !isNaN(value)) {
      values.push(value);
    }
  });

  if (values.length === 0) {
    nodes.forEach((node) => sizes.set(node.id, fixedSize));
    return sizes;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;

  nodes.forEach((node) => {
    const nodeData = dataMap.get(node.id);
    if (!nodeData) {
      sizes.set(node.id, fixedSize);
      return;
    }

    const value = nodeData[metricKey];
    if (typeof value !== "number" || isNaN(value) || range === 0) {
      sizes.set(node.id, fixedSize);
      return;
    }

    let normalized: number;
    if (scaleType === "log") {
      const logMin = Math.log(Math.max(minValue, 0.0001));
      const logMax = Math.log(Math.max(maxValue, 0.0001));
      const logValue = Math.log(Math.max(value, 0.0001));
      const logRange = logMax - logMin;
      normalized = logRange === 0 ? 0 : (logValue - logMin) / logRange;
    } else {
      normalized = (value - minValue) / range;
    }

    const size = minSize + normalized * (maxSize - minSize);
    sizes.set(node.id, size);
  });

  return sizes;
};

export const calculateLinkWeights = (
  links: Edge[],
  edgeDataMap: Map<string, FullData>,
  mode: SizeMode,
  metricKey: string,
  fixedThickness: number,
  minThickness: number,
  maxThickness: number,
  scaleType: ScaleType,
): Map<string, number> => {
  const weights = new Map<string, number>();

  if (mode === "fixed" || !metricKey) {
    links.forEach((link) => {
      weights.set(link.id, fixedThickness);
    });
    return weights;
  }

  const values: number[] = [];

  links.forEach((link) => {
    const edgeData = edgeDataMap.get(link.id);
    if (!edgeData) return;

    const value = edgeData[metricKey];
    if (typeof value === "number" && !isNaN(value)) {
      values.push(value);
    }
  });

  if (values.length === 0) {
    links.forEach((link) => {
      weights.set(link.id, fixedThickness);
    });
    return weights;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;

  links.forEach((link) => {
    const edgeData = edgeDataMap.get(link.id);

    if (!edgeData) {
      weights.set(link.id, fixedThickness);
      return;
    }

    const value = edgeData[metricKey];
    if (typeof value !== "number" || isNaN(value) || range === 0) {
      weights.set(link.id, fixedThickness);
      return;
    }

    let normalized: number;
    if (scaleType === "log") {
      const logMin = Math.log(Math.max(minValue, 0.0001));
      const logMax = Math.log(Math.max(maxValue, 0.0001));
      const logValue = Math.log(Math.max(value, 0.0001));
      const logRange = logMax - logMin;
      normalized = logRange === 0 ? 0 : (logValue - logMin) / logRange;
    } else {
      normalized = (value - minValue) / range;
    }

    const thickness = minThickness + normalized * (maxThickness - minThickness);
    weights.set(link.id, thickness);
  });

  return weights;
};

export const getNodeLabel = (node: Node): string => {
  return node.label || node.id;
};

export const setupNodeEvents = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  interactionProps: InteractionProps,
  isDraggingRef: { current: boolean },
) => {
  const { onNodeHover, onContextMenu, onTooltipShow, onTooltipHide } =
    interactionProps;
  svg
    .select(".nodes-group")
    .selectAll<SVGCircleElement, Node>(".node")
    .on("mousemove", function (event, d) {
      const [x, y] = [event.clientX, event.clientY];
      onNodeHover(d.id);
      onTooltipShow({ type: "node", nodeId: d.id, x, y });
    })
    .on("mouseleave", () => {
      if (!isDraggingRef.current) {
        onTooltipHide();
        onNodeHover(null);
      }
    })
    .on("contextmenu", (event, d) => {
      event._handledByChild = true;
      onContextMenu("node", d.id);
    });
};
