import type { FilingStatus, TaxBracket, TaxYearConfig } from "./types";

export function taxOnTaxableIncome(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) {
    return 0;
  }

  let total = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) {
      break;
    }
    const upper = bracket.max ?? Infinity;
    const amountInBracket = Math.min(taxableIncome, upper) - bracket.min;
    if (amountInBracket > 0) {
      total += amountInBracket * bracket.rate;
    }
    if (bracket.max == null || taxableIncome <= bracket.max) {
      break;
    }
  }
  return total;
}

export function calculateIncomeTaxFromAgi(
  adjustedGrossIncome: number,
  filingStatus: FilingStatus,
  config: TaxYearConfig,
  /** When set, we take the greater of this and the standard deduction (IRS rule). */
  itemizedDeductions?: number
): {
  standardDeduction: number;
  deductionTaken: number;
  usedItemized: boolean;
  taxableIncome: number;
  incomeTax: number;
} {
  const standardDeduction = config.standardDeduction[filingStatus];
  const itemized =
    itemizedDeductions != null && Number.isFinite(itemizedDeductions)
      ? Math.max(0, itemizedDeductions)
      : null;
  const usedItemized = itemized != null && itemized > standardDeduction;
  const deductionTaken = usedItemized ? itemized! : standardDeduction;
  const taxableIncome = Math.max(0, adjustedGrossIncome - deductionTaken);
  const incomeTax = taxOnTaxableIncome(
    taxableIncome,
    config.brackets[filingStatus]
  );
  return {
    standardDeduction,
    deductionTaken,
    usedItemized,
    taxableIncome,
    incomeTax,
  };
}
