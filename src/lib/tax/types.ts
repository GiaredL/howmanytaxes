export type FilingStatus =
  | "single"
  | "married-jointly"
  | "married-separately"
  | "head-of-household";

export type EmploymentType = "employee" | "self-employed";

export type TaxBracket = {
  rate: number;
  /** Inclusive lower bound of taxable income for this bracket. */
  min: number;
  /** Exclusive upper bound; null = no upper limit. */
  max: number | null;
};

/** Simplified Child Tax Credit / ACTC parameters (Schedule 8812). */
export type ChildTaxCreditConfig = {
  /** Max CTC per qualifying child under 17. */
  amountPerChild: number;
  /** Max refundable ACTC per qualifying child. */
  refundablePerChild: number;
  phaseOutThresholdMarriedJointly: number;
  phaseOutThresholdOther: number;
  /** Reduction per full (or partial) $1,000 of MAGI over the threshold. */
  phaseOutPerThousand: number;
  actcEarnedIncomeFloor: number;
  actcEarnedIncomeRate: number;
  sourceUrl: string;
};

export type TaxYearConfig = {
  taxYear: number;
  sourceUrl: string;
  standardDeduction: Record<FilingStatus, number>;
  brackets: Record<FilingStatus, TaxBracket[]>;
  oasdiWageBase: number;
  oasdiEmployeeRate: number;
  oasdiSelfEmployedRate: number;
  hiEmployeeRate: number;
  hiSelfEmployedRate: number;
  /** SECA applies to this fraction of net self-employment earnings. */
  seNetEarningsMultiplier: number;
  additionalMedicareRate: number;
  additionalMedicareThreshold: Record<FilingStatus, number>;
  childTaxCredit: ChildTaxCreditConfig;
};

export type FederalTaxInput = {
  taxYear: number;
  filingStatus: FilingStatus;
  employmentType: EmploymentType;
  /**
   * Primary earner: W-2 wages (employee) or net SE profit (self-employed).
   * For MFJ income tax, combined with `spouseIncome`.
   */
  income: number;
  /**
   * Spouse W-2 wages when filing jointly (each person has their own OASDI wage base).
   * Ignored for self-employed profiles for now.
   */
  spouseIncome?: number;
  /**
   * Optional Schedule A total. If greater than the standard deduction for the
   * filing status, that amount is used; otherwise the standard deduction applies.
   */
  itemizedDeductions?: number;
  /**
   * Qualifying children under age 17 (simplified CTC). Assumed to meet SSN /
   * residency / relationship tests — disclosed in the UI.
   */
  qualifyingChildrenUnder17?: number;
};

export type PayrollTaxResult = {
  oasdiTax: number;
  hiTax: number;
  additionalMedicareTax: number;
  /** OASDI + HI + Additional Medicare (employee-paid / SECA). */
  totalPayrollTax: number;
  /** Half of SE tax deductible against income tax; 0 for employees. */
  deductibleHalfOfSeTax: number;
  socialSecurityWageBaseUsed: number;
  seTaxBase: number;
  /** True when any earner's OASDI wages hit the annual wage base. */
  oasdiCapped: boolean;
};

export type IncomeTaxResult = {
  grossIncome: number;
  deductibleHalfOfSeTax: number;
  /** IRS standard deduction for this filing status / tax year. */
  standardDeduction: number;
  /** Deduction actually subtracted (standard or itemized, whichever is higher). */
  deductionTaken: number;
  usedItemized: boolean;
  taxableIncome: number;
  /** Tax on taxable income before credits. */
  incomeTaxBeforeCredits: number;
  qualifyingChildrenUnder17: number;
  /** Nonrefundable Child Tax Credit applied. */
  childTaxCredit: number;
  /**
   * Simplified Additional Child Tax Credit (refundable). Shown for context;
   * not subtracted from payroll or treated as negative program funding.
   */
  additionalChildTaxCredit: number;
  /** Income tax after nonrefundable CTC (≥ 0). Used for allocation. */
  incomeTax: number;
};

export type FederalTaxResult = {
  taxYear: number;
  filingStatus: FilingStatus;
  employmentType: EmploymentType;
  income: number;
  spouseIncome: number;
  incomeTax: IncomeTaxResult;
  payroll: PayrollTaxResult;
  /** Income tax + employee/SE payroll taxes. */
  totalFederalTax: number;
};
