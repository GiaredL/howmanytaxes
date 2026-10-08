import type { TaxYearConfig } from "../types";

/**
 * Tax year 2026 parameters from IRS / SSA public tables.
 * IRS Rev. Proc. 2025-32 / IRS newsroom inflation adjustments.
 * OASDI wage base: https://www.ssa.gov/oact/cola/cbb.html ($184,500)
 */
export const taxYear2026: TaxYearConfig = {
  taxYear: 2026,
  sourceUrl: "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill",
  standardDeduction: {
    single: 16_100,
    "married-jointly": 32_200,
    "married-separately": 16_100,
    "head-of-household": 24_150,
  },
  brackets: {
    single: [
      { rate: 0.1, min: 0, max: 12_400 },
      { rate: 0.12, min: 12_400, max: 50_400 },
      { rate: 0.22, min: 50_400, max: 105_700 },
      { rate: 0.24, min: 105_700, max: 201_775 },
      { rate: 0.32, min: 201_775, max: 256_225 },
      { rate: 0.35, min: 256_225, max: 640_600 },
      { rate: 0.37, min: 640_600, max: null },
    ],
    "married-jointly": [
      { rate: 0.1, min: 0, max: 24_800 },
      { rate: 0.12, min: 24_800, max: 100_800 },
      { rate: 0.22, min: 100_800, max: 211_400 },
      { rate: 0.24, min: 211_400, max: 403_550 },
      { rate: 0.32, min: 403_550, max: 512_450 },
      { rate: 0.35, min: 512_450, max: 768_700 },
      { rate: 0.37, min: 768_700, max: null },
    ],
    "married-separately": [
      { rate: 0.1, min: 0, max: 12_400 },
      { rate: 0.12, min: 12_400, max: 50_400 },
      { rate: 0.22, min: 50_400, max: 105_700 },
      { rate: 0.24, min: 105_700, max: 201_775 },
      { rate: 0.32, min: 201_775, max: 256_225 },
      { rate: 0.35, min: 256_225, max: 384_350 },
      { rate: 0.37, min: 384_350, max: null },
    ],
    "head-of-household": [
      { rate: 0.1, min: 0, max: 17_700 },
      { rate: 0.12, min: 17_700, max: 67_450 },
      { rate: 0.22, min: 67_450, max: 105_700 },
      { rate: 0.24, min: 105_700, max: 201_750 },
      { rate: 0.32, min: 201_750, max: 256_200 },
      { rate: 0.35, min: 256_200, max: 640_600 },
      { rate: 0.37, min: 640_600, max: null },
    ],
  },
  oasdiWageBase: 184_500,
  oasdiEmployeeRate: 0.062,
  oasdiSelfEmployedRate: 0.124,
  hiEmployeeRate: 0.0145,
  hiSelfEmployedRate: 0.029,
  seNetEarningsMultiplier: 0.9235,
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: {
    single: 200_000,
    "married-jointly": 250_000,
    "married-separately": 125_000,
    "head-of-household": 200_000,
  },
};
