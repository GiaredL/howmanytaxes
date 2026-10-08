import fallbackSnapshot from "./__fixtures__/budget-snapshot-fy2025.json";
import { fetchBudgetSnapshotForFiscalYear } from "./mtsClient";
import type { FederalBudgetSnapshot, ProgramId } from "./types";

/** Default completed fiscal year for allocation denominators until UI selects FY. */
export const DEFAULT_FISCAL_YEAR = 2025;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let memoryCache: { snapshot: FederalBudgetSnapshot; expiresAt: number } | null = null;

export function isFederalBudgetSnapshot(value: unknown): value is FederalBudgetSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as FederalBudgetSnapshot;
  return (
    typeof v.meta?.fiscalYear === "number" &&
    typeof v.totalIndividualIncomeTaxReceipts === "number" &&
    typeof v.outlaysByProgram === "object"
  );
}

export function getFallbackBudgetSnapshot(): FederalBudgetSnapshot {
  if (!isFederalBudgetSnapshot(fallbackSnapshot)) {
    throw new Error("Invalid budget snapshot fixture");
  }
  return {
    ...fallbackSnapshot,
    subOutlaysByProgram: fallbackSnapshot.subOutlaysByProgram ?? {},
  };
}

export async function getFederalBudgetSnapshot(options?: {
  fiscalYear?: number;
  forceRefresh?: boolean;
}): Promise<FederalBudgetSnapshot> {
  const fiscalYear = options?.fiscalYear ?? DEFAULT_FISCAL_YEAR;
  const now = Date.now();

  if (
    !options?.forceRefresh &&
    memoryCache &&
    memoryCache.expiresAt > now &&
    memoryCache.snapshot.meta.fiscalYear === fiscalYear
  ) {
    return memoryCache.snapshot;
  }

  try {
    const snapshot = await fetchBudgetSnapshotForFiscalYear(fiscalYear);
    memoryCache = { snapshot, expiresAt: now + CACHE_TTL_MS };
    return snapshot;
  } catch {
    const fallback = getFallbackBudgetSnapshot();
    if (fallback.meta.fiscalYear !== fiscalYear) {
      // Still return fixture if live fetch fails; metadata shows vintage.
      return fallback;
    }
    memoryCache = { snapshot: fallback, expiresAt: now + CACHE_TTL_MS };
    return fallback;
  }
}

/** Legacy-shaped map for existing UI: program → outlay dollars. */
export function outlaysRecordFromSnapshot(
  snapshot: FederalBudgetSnapshot
): Record<ProgramId, number> {
  const record = {} as Record<ProgramId, number>;
  for (const [key, value] of Object.entries(snapshot.outlaysByProgram)) {
    if (typeof value === "number") {
      record[key as ProgramId] = value;
    }
  }
  return record;
}

export function totalIncomeTaxReceiptsFromSnapshot(snapshot: FederalBudgetSnapshot): number {
  return snapshot.totalIndividualIncomeTaxReceipts;
}
