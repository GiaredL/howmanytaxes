import { calculateIncomeTaxFromAgi } from "./incomeTax";
import { calculatePayrollTax } from "./payrollTax";
import { getTaxYearConfig } from "./taxYears";
import type { FederalTaxInput, FederalTaxResult } from "./types";

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Estimate federal income tax + payroll/SE taxes for a simple profile.
 * Omits credits, AMT, NIIT, capital gains stacking, etc.
 * Deduction: standard by default; optional itemized if higher than standard.
 *
 * MFJ: pass your wages + spouse wages separately so OASDI wage bases apply per person,
 * while income tax uses combined household income.
 */
export function calculateFederalTaxes(input: FederalTaxInput): FederalTaxResult {
  const config = getTaxYearConfig(input.taxYear);
  const income = Math.max(0, input.income);
  const spouseIncome =
    input.filingStatus === "married-jointly" && input.employmentType === "employee"
      ? Math.max(0, input.spouseIncome ?? 0)
      : 0;

  const payroll = calculatePayrollTax({
    income,
    spouseIncome,
    employmentType: input.employmentType,
    filingStatus: input.filingStatus,
    config,
  });

  const householdGross = income + spouseIncome;
  const adjustedGrossIncome = Math.max(0, householdGross - payroll.deductibleHalfOfSeTax);
  const incomeParts = calculateIncomeTaxFromAgi(
    adjustedGrossIncome,
    input.filingStatus,
    config,
    input.itemizedDeductions
  );

  const incomeTax = {
    grossIncome: householdGross,
    deductibleHalfOfSeTax: payroll.deductibleHalfOfSeTax,
    standardDeduction: incomeParts.standardDeduction,
    deductionTaken: incomeParts.deductionTaken,
    usedItemized: incomeParts.usedItemized,
    taxableIncome: incomeParts.taxableIncome,
    incomeTax: roundCents(incomeParts.incomeTax),
  };

  return {
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    employmentType: input.employmentType,
    income,
    spouseIncome,
    incomeTax,
    payroll,
    totalFederalTax: roundCents(incomeTax.incomeTax + payroll.totalPayrollTax),
  };
}
