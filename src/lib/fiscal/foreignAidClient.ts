/**
 * ForeignAssistance.gov public API — U.S. Government Work, free of copyright.
 * Cite “ForeignAssistance.gov”. No API key.
 * Docs: https://foreignassistance.gov/api-docs
 * License note: https://foreignassistance.gov/about
 */

export const FOREIGN_AID_BY_COUNTRY_URL =
  "https://foreignassistance.gov/api/data-api/by-country.json";

export type ForeignAidCountryRow = {
  country_code: string;
  country_name: string;
  transaction_type_name: string;
  fiscal_year: string;
  current_amount: number | null;
};

export type ForeignAidByCountryResponse = {
  data: ForeignAidCountryRow[];
  page_info?: {
    current_page: number;
    per_page: number;
    total_pages: number;
    total_records: number;
  };
};

export type CountryAidOutlay = {
  id: string;
  label: string;
  countryCode: string;
  /** Disbursements in current dollars for the fiscal year. */
  disbursements: number;
};

export type CountryAidSnapshot = {
  fiscalYear: number;
  sourceUrl: string;
  retrievedAt: string;
  /** Sum of disbursements for countries/regions included below. */
  totalDisbursements: number;
  countries: CountryAidOutlay[];
};

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function buildForeignAidByCountryUrl(options: {
  fiscalYear: number;
  page?: number;
  perPage?: number;
}): string {
  const params = new URLSearchParams({
    fiscal_year: String(options.fiscalYear),
    per_page: String(options.perPage ?? 500),
    page: String(options.page ?? 1),
  });
  return `${FOREIGN_AID_BY_COUNTRY_URL}?${params.toString()}`;
}

/**
 * Aggregate Disbursements by country for a fiscal year.
 * Drops empty names; keeps regional buckets; sorts by amount desc.
 */
export function parseCountryAidDisbursements(
  response: ForeignAidByCountryResponse,
  options: { fiscalYear: number; topN?: number; retrievedAt?: string } 
): CountryAidSnapshot {
  const totals = new Map<string, { code: string; name: string; amount: number }>();

  for (const row of response.data) {
    if (row.transaction_type_name !== "Disbursements") continue;
    if (String(row.fiscal_year) !== String(options.fiscalYear)) continue;
    const name = (row.country_name ?? "").trim();
    if (!name) continue;
    const amount = Number(row.current_amount ?? 0);
    if (!Number.isFinite(amount) || amount === 0) continue;

    const existing = totals.get(name);
    if (existing) {
      existing.amount += amount;
    } else {
      totals.set(name, {
        code: row.country_code || slugify(name),
        name,
        amount,
      });
    }
  }

  const sorted = [...totals.values()].sort((a, b) => b.amount - a.amount);
  const topN = options.topN ?? 25;
  // Prefer named countries/regions; keep "World" only if it ranks in topN (global programs)
  const top = sorted.slice(0, topN);
  const totalDisbursements = top.reduce((s, c) => s + c.amount, 0);

  return {
    fiscalYear: options.fiscalYear,
    sourceUrl: "https://foreignassistance.gov/",
    retrievedAt: options.retrievedAt ?? new Date().toISOString(),
    totalDisbursements,
    countries: top.map((c) => ({
      id: slugify(c.name),
      label: c.name === "World" ? "Global / multi-country (reported as World)" : c.name,
      countryCode: c.code,
      disbursements: c.amount,
    })),
  };
}

export async function fetchCountryAidSnapshot(
  fiscalYear: number,
  fetchImpl: typeof fetch = fetch
): Promise<CountryAidSnapshot> {
  const url = buildForeignAidByCountryUrl({ fiscalYear, perPage: 500 });
  const res = await fetchImpl(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "HowManyTaxes/0.1 (educational estimator; cites ForeignAssistance.gov)",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`ForeignAssistance.gov request failed (${res.status}): ${url}`);
  }

  const body = (await res.json()) as ForeignAidByCountryResponse;
  return parseCountryAidDisbursements(body, {
    fiscalYear,
    topN: 25,
    retrievedAt: new Date().toISOString(),
  });
}
