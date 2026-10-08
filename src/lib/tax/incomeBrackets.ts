/**
 * Cumulative AGI brackets from IRS SOI “Individual statistical tables by size
 * of adjusted gross income” (tax year 2022 summary counts).
 * Source: https://www.irs.gov/statistics/soi-tax-stats-individual-statistical-tables-by-size-of-adjusted-gross-income
 *
 * Used only for a rough “income relative to other tax returns” estimate —
 * not a ranking of tax paid.
 */
export type AgiBracket = {
  /** Inclusive lower bound of AGI for this bracket. */
  minAgi: number;
  /** Exclusive upper bound; null = open-ended. */
  maxAgi: number | null;
  returns: number;
};

export const IRS_AGI_BRACKETS_TY2022: AgiBracket[] = [
  { minAgi: 1, maxAgi: 5_000, returns: 8_195_783 },
  { minAgi: 5_000, maxAgi: 10_000, returns: 8_747_727 },
  { minAgi: 10_000, maxAgi: 15_000, returns: 9_642_322 },
  { minAgi: 15_000, maxAgi: 20_000, returns: 9_058_382 },
  { minAgi: 20_000, maxAgi: 25_000, returns: 8_035_277 },
  { minAgi: 25_000, maxAgi: 30_000, returns: 8_005_289 },
  { minAgi: 30_000, maxAgi: 40_000, returns: 15_771_561 },
  { minAgi: 40_000, maxAgi: 50_000, returns: 13_255_063 },
  { minAgi: 50_000, maxAgi: 75_000, returns: 23_805_797 },
  { minAgi: 75_000, maxAgi: 100_000, returns: 15_181_035 },
  { minAgi: 100_000, maxAgi: 200_000, returns: 25_887_136 },
  { minAgi: 200_000, maxAgi: 500_000, returns: 10_017_626 },
  { minAgi: 500_000, maxAgi: 1_000_000, returns: 1_674_608 },
  { minAgi: 1_000_000, maxAgi: 1_500_000, returns: 360_882 },
  { minAgi: 1_500_000, maxAgi: 2_000_000, returns: 148_222 },
  { minAgi: 2_000_000, maxAgi: 5_000_000, returns: 208_129 },
  { minAgi: 5_000_000, maxAgi: 10_000_000, returns: 52_968 },
  { minAgi: 10_000_000, maxAgi: null, returns: 34_630 },
];

/** Total returns in the published AGI table (TY2022). */
export const IRS_TOTAL_RETURNS_TY2022 = IRS_AGI_BRACKETS_TY2022.reduce(
  (sum, b) => sum + b.returns,
  0
);

export const IRS_AGI_SOURCE = {
  taxYear: 2022,
  label: "IRS SOI, tax year 2022 (size of AGI)",
  url: "https://www.irs.gov/statistics/soi-tax-stats-individual-statistical-tables-by-size-of-adjusted-gross-income",
};

/**
 * Rough count of returns with AGI fully below / fully above the user's income.
 * Returns in the same bracket as the user are treated as a tie (neither side).
 */
export function estimateReturnsAroundIncome(income: number): {
  returnsBelow: number;
  returnsAbove: number;
  returnsTiedBracket: number;
  totalReturns: number;
} {
  const agi = Math.max(0, income);
  let returnsBelow = 0;
  let returnsAbove = 0;
  let returnsTiedBracket = 0;

  for (const bracket of IRS_AGI_BRACKETS_TY2022) {
    const aboveMax =
      bracket.maxAgi != null ? agi >= bracket.maxAgi : false;
    const belowMin = agi < bracket.minAgi;

    if (aboveMax) {
      returnsBelow += bracket.returns;
    } else if (belowMin) {
      returnsAbove += bracket.returns;
    } else {
      returnsTiedBracket += bracket.returns;
    }
  }

  return {
    returnsBelow,
    returnsAbove,
    returnsTiedBracket,
    totalReturns: IRS_TOTAL_RETURNS_TY2022,
  };
}
