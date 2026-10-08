import type { TaxYearConfig } from "../types";

/**
 * Tax year 2025 parameters from IRS / SSA public tables.
 * Brackets: https://www.irs.gov/filing/federal-income-tax-rates-and-brackets
 * Standard deduction (OBBB TY2025): IRS newsroom Rev. Proc. figures
 * OASDI wage base: https://www.ssa.gov/oact/cola/cbb.html ($176,100)
 */
export const taxYear2025: TaxYearConfig = {
  taxYear: 2025,
  sourceUrl: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets",
  standardDeduction: {
    single: 15_750,
    "married-jointly": 31_500,
    "married-separately": 15_750,
    "head-of-household": 23_625,
  },
  brackets: {
    single: [
      { rate: 0.1, min: 0, max: 11_925 },
      { rate: 0.12, min: 11_925, max: 48_475 },
      { rate: 0.22, min: 48_475, max: 103_350 },
      { rate: 0.24, min: 103_350, max: 197_300 },
      { rate: 0.32, min: 197_300, max: 250_525 },
      { rate: 0.35, min: 250_525, max: 626_350 },
      { rate: 0.37, min: 626_350, max: null },
    ],
    "married-jointly": [
      { rate: 0.1, min: 0, max: 23_850 },
      { rate: 0.12, min: 23_850, max: 96_950 },
      { rate: 0.22, min: 96_950, max: 206_700 },
      { rate: 0.24, min: 206_700, max: 394_600 },
      { rate: 0.32, min: 394_600, max: 501_050 },
      { rate: 0.35, min: 501_050, max: 751_600 },
      { rate: 0.37, min: 751_600, max: null },
    ],
    "married-separately": [
      { rate: 0.1, min: 0, max: 11_925 },
      { rate: 0.12, min: 11_925, max: 48_475 },
      { rate: 0.22, min: 48_475, max: 103_350 },
      { rate: 0.24, min: 103_350, max: 197_300 },
      { rate: 0.32, min: 197_300, max: 250_525 },
      { rate: 0.35, min: 250_525, max: 375_800 },
      { rate: 0.37, min: 375_800, max: null },
    ],
    "head-of-household": [
      { rate: 0.1, min: 0, max: 17_000 },
      { rate: 0.12, min: 17_000, max: 64_850 },
      { rate: 0.22, min: 64_850, max: 103_350 },
      { rate: 0.24, min: 103_350, max: 197_300 },
      { rate: 0.32, min: 197_300, max: 250_500 },
      { rate: 0.35, min: 250_500, max: 626_350 },
      { rate: 0.37, min: 626_350, max: null },
    ],
  },
  oasdiWageBase: 176_100,
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
