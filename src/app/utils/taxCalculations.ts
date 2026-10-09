/**
 * Compatibility shims — prefer `@/lib/tax/*` for new code.
 */
import {
  allocateCountryAidContributions,
  allocateSubProgramContributions,
  calculateProgramContribution,
} from "@/lib/tax/allocate";
import type { CountryAidOutlay } from "@/lib/fiscal/foreignAidClient";
import { calculateFederalTaxes } from "@/lib/tax/federalTaxes";
import { taxOnTaxableIncome } from "@/lib/tax/incomeTax";
import { DEFAULT_TAX_YEAR, getTaxYearConfig } from "@/lib/tax/taxYears";
import type { FederalTaxResult, FilingStatus } from "@/lib/tax/types";
import type { ProgramId, SubProgramOutlay } from "@/lib/fiscal/types";

export type { FilingStatus, TaxBracket } from "@/lib/tax/types";
export type { ProgramId as BudgetStatus };

/** @deprecated Prefer calculateFederalTaxes — income tax only, employee assumption, default tax year. */
export const getStandardDeduction = (
  filingStatus: FilingStatus,
  taxYear: number = DEFAULT_TAX_YEAR
): number => getTaxYearConfig(taxYear).standardDeduction[filingStatus];

/** @deprecated Prefer calculateFederalTaxes. */
export const calculateTax = (
  income: number,
  filingStatus: FilingStatus,
  { applyStandardDeduction = true }: { applyStandardDeduction?: boolean } = {}
): number => {
  if (!applyStandardDeduction) {
    const config = getTaxYearConfig(DEFAULT_TAX_YEAR);
    return taxOnTaxableIncome(Math.max(0, income), config.brackets[filingStatus]);
  }
  return calculateFederalTaxes({
    taxYear: DEFAULT_TAX_YEAR,
    filingStatus,
    employmentType: "employee",
    income,
  }).incomeTax.incomeTax;
};

/** @deprecated Prefer calculateProgramContribution. */
export const calculateTaxContribution = (
  taxPaid: number,
  totalTaxDollars: number,
  budgetTaxDollars: number
): number => {
  if (totalTaxDollars <= 0) return 0;
  return (taxPaid / totalTaxDollars) * budgetTaxDollars;
};

export function estimateTaxesForUi(options: {
  income: number;
  spouseIncome?: number;
  filingStatus: FilingStatus;
  employmentType: "employee" | "self-employed";
  taxYear?: number;
  itemizedDeductions?: number;
  qualifyingChildrenUnder17?: number;
}): FederalTaxResult {
  return calculateFederalTaxes({
    taxYear: options.taxYear ?? DEFAULT_TAX_YEAR,
    filingStatus: options.filingStatus,
    employmentType: options.employmentType,
    income: options.income,
    spouseIncome: options.spouseIncome,
    itemizedDeductions: options.itemizedDeductions,
    qualifyingChildrenUnder17: options.qualifyingChildrenUnder17,
  });
}

export function estimateProgramContributionForUi(options: {
  taxes: FederalTaxResult;
  programId: ProgramId;
  programOutlay: number;
  totalIndividualIncomeTaxReceipts: number;
}) {
  return calculateProgramContribution(options);
}

export function estimateSubProgramContributionsForUi(options: {
  parentUserAmount: number;
  parentOutlay: number;
  children: SubProgramOutlay[];
}) {
  return allocateSubProgramContributions(options);
}

export function estimateCountryAidContributionsForUi(options: {
  internationalAffairsUserAmount: number;
  countries: CountryAidOutlay[];
  totalDisbursements: number;
}) {
  return allocateCountryAidContributions(options);
}
