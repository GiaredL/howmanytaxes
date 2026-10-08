import type { TaxYearConfig } from "../types";
import { taxYear2025 } from "./2025";
import { taxYear2026 } from "./2026";

/** Prefer the current filing/parameter year available in configs. */
export const DEFAULT_TAX_YEAR = 2026;

const TAX_YEARS: Record<number, TaxYearConfig> = {
  2025: taxYear2025,
  2026: taxYear2026,
};

export function getTaxYearConfig(taxYear: number = DEFAULT_TAX_YEAR): TaxYearConfig {
  const config = TAX_YEARS[taxYear];
  if (!config) {
    throw new Error(`Unsupported tax year: ${taxYear}. Supported: ${Object.keys(TAX_YEARS).join(", ")}`);
  }
  return config;
}

export function listSupportedTaxYears(): number[] {
  return Object.keys(TAX_YEARS)
    .map(Number)
    .sort((a, b) => a - b);
}

export { taxYear2025, taxYear2026 };
