import type { BinnedData } from "@/features/chart-filtering/components/createBinnedData";
import type { BrushRange } from "@/stores/useFilterStore";
import type { AttributeInfo, Attributes } from "@/types";

const EPSILON = 1e-9;

export type CategoryIndex = Map<string, Map<string, Set<string>>>;

// Rebuilt only on timestep switch or key toggle, not on every filter interaction
export function buildCategoryIndex(
  entities: Map<string, { attributes: Attributes }>,
  enabledKeys: string[],
  metricsInfo: Map<string, AttributeInfo>,
): CategoryIndex {
  const index: CategoryIndex = new Map();
  for (const key of enabledKeys) {
    const info = metricsInfo.get(key);
    if (!info?.isCategory) continue;

    const valueMap = new Map<string, Set<string>>();
    entities.forEach((entity, id) => {
      const value = entity.attributes[key];
      if (value === undefined || value === null) return;
      const strVal = String(value);
      let idSet = valueMap.get(strVal);
      if (!idSet) {
        idSet = new Set();
        valueMap.set(strVal, idSet);
      }
      idSet.add(id);
    });

    index.set(key, valueMap);
  }

  return index;
}

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  const result = new Set<string>();
  for (const id of small) {
    if (large.has(id)) result.add(id);
  }
  return result;
}

function getAllowedIdsForCategory(
  key: string,
  categoryIndex: CategoryIndex,
  disabledValues: Record<string, Set<number | string>>,
  selectedCategories: Record<string, string[]>,
  allIds: Set<string>,
): Set<string> | null {
  const valueMap = categoryIndex.get(key) ?? new Map<string, Set<string>>();
  let allowed: Set<string> | null = null;

  // Entities missing a value never match a selected category, so they are excluded by omission
  const selected = selectedCategories[key];
  if (selected && selected.length > 0) {
    const union = new Set<string>();
    for (const val of selected) {
      valueMap.get(val)?.forEach((id) => union.add(id));
    }
    allowed = union;
  }

  // Entities missing a value never match a disabled value either, so they fall back into allIds
  const disabledForKey = disabledValues[key];
  if (disabledForKey && disabledForKey.size > 0) {
    const disabledIds = new Set<string>();
    for (const rawVal of disabledForKey) {
      valueMap.get(String(rawVal))?.forEach((id) => disabledIds.add(id));
    }

    const base = allowed ?? allIds;
    const filtered = new Set<string>();
    for (const id of base) if (!disabledIds.has(id)) filtered.add(id);
    allowed = filtered;
  }

  return allowed;
}

function getAllowedIdsForNumeric(
  key: string,
  binnedDataByKey: Map<string, BinnedData>,
  disabledValues: Record<string, Set<number | string>>,
  brushRanges: Record<string, BrushRange | null>,
  allIds: Set<string>,
): Set<string> | null {
  const binnedData = binnedDataByKey.get(key);
  if (!binnedData) return null;

  let allowed: Set<string> | null = null;

  const rangeObj = brushRanges[key];
  if (rangeObj) {
    const [min, max] = rangeObj.range;
    const union = new Set<string>();
    const idsWithNumericValue = new Set<string>();

    // Brush ranges are bin-aligned, so a bin fully inside [min, max] is exactly "selected"
    for (const bin of binnedData.bins) {
      for (const id of bin.ids) idsWithNumericValue.add(id);
      if (bin.x0 >= min - EPSILON && bin.x1 <= max + EPSILON) {
        bin.ids.forEach((id) => union.add(id));
      }
    }

    // Entities without a numeric value are unaffected by the brush, so they still pass
    for (const id of allIds) {
      if (!idsWithNumericValue.has(id)) union.add(id);
    }

    allowed = union;
  }

  const disabledForKey = disabledValues[key];
  if (disabledForKey && disabledForKey.size > 0) {
    const disabledIds = new Set<string>();
    for (const binIndex of disabledForKey) {
      binnedData.bins[binIndex as number]?.ids.forEach((id) =>
        disabledIds.add(id),
      );
    }

    const base = allowed ?? allIds;
    const filtered = new Set<string>();
    for (const id of base) if (!disabledIds.has(id)) filtered.add(id);
    allowed = filtered;
  }

  return allowed;
}

// Returns null if no filter is active at all, meaning everyone passes
export function computeFilterMask(
  keys: string[],
  allIds: Set<string>,
  categoryIndex: CategoryIndex,
  binnedDataByKey: Map<string, BinnedData>,
  brushRanges: Record<string, BrushRange | null>,
  disabledValues: Record<string, Set<number | string>>,
  selectedCategories: Record<string, string[]>,
  metricsInfo: Map<string, AttributeInfo>,
): Set<string> | null {
  let passing: Set<string> | null = null;

  for (const key of keys) {
    const hasBrush = !!brushRanges[key];
    const hasDisabled = (disabledValues[key]?.size ?? 0) > 0;
    const hasSelected = (selectedCategories[key]?.length ?? 0) > 0;
    if (!hasBrush && !hasDisabled && !hasSelected) continue;

    const info = metricsInfo.get(key);
    const allowedForKey = info?.isCategory
      ? getAllowedIdsForCategory(
          key,
          categoryIndex,
          disabledValues,
          selectedCategories,
          allIds,
        )
      : getAllowedIdsForNumeric(
          key,
          binnedDataByKey,
          disabledValues,
          brushRanges,
          allIds,
        );

    if (allowedForKey === null) continue;

    passing =
      passing === null ? allowedForKey : intersect(passing, allowedForKey);
  }

  return passing;
}
