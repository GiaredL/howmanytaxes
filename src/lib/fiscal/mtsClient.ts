import { parseMtsSubfunctions, type MtsSubfunctionResponse } from "./parseMtsSubfunctions";
import { parseMtsTable9ToSnapshot } from "./parseMtsTable9";
import type { FederalBudgetSnapshot, MtsTable9Response } from "./types";

/**
 * Official public Treasury Fiscal Data API — no auth required.
 * License: free, unrestricted for commercial/non-commercial use
 * (https://fiscaldata.treasury.gov/api-documentation/). Cache responses; cite source.
 */
export const FISCAL_DATA_BASE =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service";

export const MTS_TABLE_9_PATH = "/v1/accounting/mts/mts_table_9";
export const MTS_SUBFUNCTIONS_PATH =
  "/v1/accounting/mts/mts_table_9_outlays_functions_subfunctions";

export type FetchMtsTable9Params = {
  recordDate: string;
  pageSize?: number;
};

export function buildMtsTable9Url(params: FetchMtsTable9Params): string {
  const pageSize = params.pageSize ?? 100;
  const filter = encodeURIComponent(
    `record_date:eq:${params.recordDate},data_type_cd:eq:D`
  );
  return (
    `${FISCAL_DATA_BASE}${MTS_TABLE_9_PATH}` +
    `?filter=${filter}&sort=src_line_nbr&page%5Bsize%5D=${pageSize}`
  );
}

/** Latest month-end dates to try when resolving a completed fiscal year snapshot. */
export function fiscalYearEndRecordDates(fiscalYear: number): string[] {
  return [`${fiscalYear}-09-30`, `${fiscalYear}-08-31`, `${fiscalYear}-10-31`];
}

export async function fetchMtsTable9(
  params: FetchMtsTable9Params,
  fetchImpl: typeof fetch = fetch
): Promise<MtsTable9Response> {
  const url = buildMtsTable9Url(params);
  const res = await fetchImpl(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`Treasury Fiscal Data request failed (${res.status}): ${url}`);
  }

  return (await res.json()) as MtsTable9Response;
}

export function buildMtsSubfunctionsUrl(recordDate: string, pageSize = 200): string {
  const filter = encodeURIComponent(`record_date:eq:${recordDate}`);
  return (
    `${FISCAL_DATA_BASE}${MTS_SUBFUNCTIONS_PATH}` +
    `?filter=${filter}&sort=src_line_nbr&page%5Bsize%5D=${pageSize}`
  );
}

export async function fetchMtsSubfunctions(
  recordDate: string,
  fetchImpl: typeof fetch = fetch
): Promise<MtsSubfunctionResponse> {
  const url = buildMtsSubfunctionsUrl(recordDate);
  const res = await fetchImpl(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`Treasury Fiscal Data subfunctions failed (${res.status}): ${url}`);
  }
  return (await res.json()) as MtsSubfunctionResponse;
}

export async function fetchBudgetSnapshotForRecordDate(
  recordDate: string,
  fetchImpl: typeof fetch = fetch
): Promise<FederalBudgetSnapshot> {
  const [response, subResponse] = await Promise.all([
    fetchMtsTable9({ recordDate }, fetchImpl),
    fetchMtsSubfunctions(recordDate, fetchImpl).catch(() => ({ data: [] })),
  ]);
  const snapshot = parseMtsTable9ToSnapshot(response, {
    retrievedAt: new Date().toISOString(),
  });
  snapshot.subOutlaysByProgram = parseMtsSubfunctions(subResponse);
  return snapshot;
}

/**
 * Load FY actuals from MTS Table 9 for a completed fiscal year.
 * Tries standard year-end record dates until a parseable snapshot is returned.
 */
export async function fetchBudgetSnapshotForFiscalYear(
  fiscalYear: number,
  fetchImpl: typeof fetch = fetch
): Promise<FederalBudgetSnapshot> {
  const errors: string[] = [];

  for (const recordDate of fiscalYearEndRecordDates(fiscalYear)) {
    try {
      const snapshot = await fetchBudgetSnapshotForRecordDate(recordDate, fetchImpl);
      if (!Object.keys(snapshot.outlaysByProgram).length) {
        errors.push(`${recordDate}: empty response`);
        continue;
      }
      if (snapshot.meta.fiscalYear === fiscalYear) {
        return snapshot;
      }
      errors.push(`${recordDate}: fiscal year mismatch (${snapshot.meta.fiscalYear})`);
    } catch (e) {
      errors.push(`${recordDate}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(
    `Could not load MTS Table 9 snapshot for FY${fiscalYear}. Attempts: ${errors.join("; ")}`
  );
}
