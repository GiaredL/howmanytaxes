import type { EmploymentType, FilingStatus, PayrollTaxResult, TaxYearConfig } from "./types";

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function employeeShareForWages(
  wages: number,
  config: TaxYearConfig
): { oasdiTax: number; hiTax: number } {
  const earnings = Math.max(0, wages);
  const oasdiBase = Math.min(earnings, config.oasdiWageBase);
  return {
    oasdiTax: roundCents(oasdiBase * config.oasdiEmployeeRate),
    hiTax: roundCents(earnings * config.hiEmployeeRate),
  };
}

export function calculatePayrollTax(options: {
  income: number;
  /** Second earner W-2 wages (MFJ). Each earner gets their own OASDI wage base. */
  spouseIncome?: number;
  employmentType: EmploymentType;
  filingStatus: FilingStatus;
  config: TaxYearConfig;
}): PayrollTaxResult {
  const { income, employmentType, filingStatus, config } = options;
  const spouseIncome = Math.max(0, options.spouseIncome ?? 0);
  const earnings = Math.max(0, income);

  if (employmentType === "employee") {
    const self = employeeShareForWages(earnings, config);
    const spouse = employeeShareForWages(spouseIncome, config);
    const oasdiTax = roundCents(self.oasdiTax + spouse.oasdiTax);
    const hiTax = roundCents(self.hiTax + spouse.hiTax);
    const combinedWages = earnings + spouseIncome;
    const threshold = config.additionalMedicareThreshold[filingStatus];
    const additionalMedicareTax = roundCents(
      Math.max(0, combinedWages - threshold) * config.additionalMedicareRate
    );

    return {
      oasdiTax,
      hiTax,
      additionalMedicareTax,
      totalPayrollTax: roundCents(oasdiTax + hiTax + additionalMedicareTax),
      deductibleHalfOfSeTax: 0,
      socialSecurityWageBaseUsed: config.oasdiWageBase,
      seTaxBase: 0,
      oasdiCapped: earnings > config.oasdiWageBase || spouseIncome > config.oasdiWageBase,
    };
  }

  // Self-employed (Schedule SE): tax on 92.35% of net earnings (primary earner for now)
  const seTaxBase = roundCents(earnings * config.seNetEarningsMultiplier);
  const oasdiBase = Math.min(seTaxBase, config.oasdiWageBase);
  const oasdiTax = roundCents(oasdiBase * config.oasdiSelfEmployedRate);
  const hiTax = roundCents(seTaxBase * config.hiSelfEmployedRate);
  const threshold = config.additionalMedicareThreshold[filingStatus];
  const additionalMedicareTax = roundCents(
    Math.max(0, seTaxBase - threshold) * config.additionalMedicareRate
  );
  const totalPayrollTax = roundCents(oasdiTax + hiTax + additionalMedicareTax);
  const deductibleHalfOfSeTax = roundCents(totalPayrollTax / 2);

  return {
    oasdiTax,
    hiTax,
    additionalMedicareTax,
    totalPayrollTax,
    deductibleHalfOfSeTax,
    socialSecurityWageBaseUsed: config.oasdiWageBase,
    seTaxBase,
    oasdiCapped: seTaxBase > config.oasdiWageBase,
  };
}
