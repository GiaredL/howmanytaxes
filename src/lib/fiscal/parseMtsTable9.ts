import { programIdFromMtsDescription } from "./mtsProgramMap";
import type { FederalBudgetSnapshot, MtsTable9Response } from "./types";

const INDIVIDUAL_INCOME_TAX_RECEIPT_LABEL = "Individual Income Taxes";
const MTS_TABLE_9_DATASET_URL =
  "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/";

export function parseCurrencyField(value: string | null | undefined): number | null {
  if (value == null || value === "null" || value === "") {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Build a budget snapshot from MTS Table 9 rows (receipts + outlays by function).
 * Uses FYTD amounts on function rows (`record_type_cd` = F) and the RSG row for individual income tax.
 */
export function parseMtsTable9ToSnapshot(
  response: MtsTable9Response,
  options: { retrievedAt?: string } = {}
): FederalBudgetSnapshot {
  const rows = response.data;
  if (rows.length === 0) {
    throw new Error("MTS Table 9 response contained no rows");
  }

  const recordDate = rows[0].record_date;
  const fiscalYear = Number.parseInt(rows[0].record_fiscal_year, 10);

  const outlaysByProgram: FederalBudgetSnapshot["outlaysByProgram"] = {};
  let totalIndividualIncomeTaxReceipts = 0;
  let totalFunctionOutlays = 0;

  for (const row of rows) {
    const amount = parseCurrencyField(row.current_fytd_rcpt_outly_amt);
    if (amount == null) {
      continue;
    }

    if (
      row.record_type_cd === "RSG" &&
      row.classification_desc.trim() === INDIVIDUAL_INCOME_TAX_RECEIPT_LABEL
    ) {
      totalIndividualIncomeTaxReceipts = amount;
      continue;
    }

    if (row.record_type_cd !== "F" || row.data_type_cd !== "D") {
      continue;
    }

    const programId = programIdFromMtsDescription(row.classification_desc);
    if (!programId) {
      continue;
    }

    outlaysByProgram[programId] = amount;
    totalFunctionOutlays += amount;
  }

  if (totalIndividualIncomeTaxReceipts <= 0) {
    throw new Error("MTS Table 9 snapshot missing Individual Income Taxes receipts");
  }

  if (Object.keys(outlaysByProgram).length === 0) {
    throw new Error("MTS Table 9 snapshot missing function outlay rows");
  }

  return {
    meta: {
      fiscalYear,
      recordDate,
      sourceUrl: MTS_TABLE_9_DATASET_URL,
      dataset: "mts_table_9",
      retrievedAt: options.retrievedAt ?? new Date().toISOString(),
    },
    outlaysByProgram,
    subOutlaysByProgram: {},
    totalIndividualIncomeTaxReceipts,
    totalFunctionOutlays,
  };
}
