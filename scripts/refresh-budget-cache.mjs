#!/usr/bin/env node
/**
 * Fetches the latest MTS Table 9 snapshot for a fiscal year and writes JSON to stdout.
 * Usage: node scripts/refresh-budget-cache.mjs [fiscalYear]
 */
const fiscalYear = Number.parseInt(process.argv[2] ?? "2025", 10);
const recordDates = [`${fiscalYear}-09-30`, `${fiscalYear}-08-31`];

const base =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/mts/mts_table_9";

for (const recordDate of recordDates) {
  const filter = encodeURIComponent(`record_date:eq:${recordDate},data_type_cd:eq:D`);
  const url = `${base}?filter=${filter}&sort=src_line_nbr&page%5Bsize%5D=100`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed ${recordDate}: ${res.status}`);
    continue;
  }
  const body = await res.json();
  if (!body.data?.length) {
    console.error(`Empty ${recordDate}`);
    continue;
  }
  process.stdout.write(JSON.stringify({ recordDate, fiscalYear, mts: body }, null, 2));
  process.exit(0);
}

console.error(`No MTS data found for FY${fiscalYear}`);
process.exit(1);
