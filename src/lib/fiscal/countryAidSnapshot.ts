import fallbackAid from "./__fixtures__/country-aid-snapshot-fy2025.json";
import {
  fetchCountryAidSnapshot,
  type CountryAidSnapshot,
} from "./foreignAidClient";
import { DEFAULT_FISCAL_YEAR } from "./budgetSnapshot";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let memoryCache: { snapshot: CountryAidSnapshot; expiresAt: number } | null =
  null;

export function isCountryAidSnapshot(value: unknown): value is CountryAidSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as CountryAidSnapshot;
  return (
    typeof v.fiscalYear === "number" &&
    Array.isArray(v.countries) &&
    typeof v.totalDisbursements === "number"
  );
}

export function getFallbackCountryAidSnapshot(): CountryAidSnapshot {
  if (!isCountryAidSnapshot(fallbackAid)) {
    throw new Error("Invalid country aid fixture");
  }
  return fallbackAid;
}

export async function getCountryAidSnapshot(options?: {
  fiscalYear?: number;
  forceRefresh?: boolean;
}): Promise<CountryAidSnapshot> {
  const fiscalYear = options?.fiscalYear ?? DEFAULT_FISCAL_YEAR;
  const now = Date.now();

  if (
    !options?.forceRefresh &&
    memoryCache &&
    memoryCache.expiresAt > now &&
    memoryCache.snapshot.fiscalYear === fiscalYear
  ) {
    return memoryCache.snapshot;
  }

  try {
    const snapshot = await fetchCountryAidSnapshot(fiscalYear);
    if (!snapshot.countries.length) {
      throw new Error("Empty country aid response");
    }
    memoryCache = { snapshot, expiresAt: now + CACHE_TTL_MS };
    return snapshot;
  } catch {
    const fallback = getFallbackCountryAidSnapshot();
    memoryCache = { snapshot: fallback, expiresAt: now + CACHE_TTL_MS };
    return fallback;
  }
}
