import type { FilingStatus, TaxYearConfig } from "./types";

export type ChildTaxCreditResult = {
  qualifyingChildren: number;
  /** Credit before comparing to tax liability (after AGI phase-out). */
  creditBeforeLimit: number;
  /** Nonrefundable CTC applied against income tax (≤ tax before credits). */
  nonrefundableApplied: number;
  /** Simplified Additional Child Tax Credit (refundable); informational. */
  additionalChildTaxCredit: number;
  /** Income tax after nonrefundable CTC (≥ 0). */
  incomeTaxAfterCredits: number;
};

/**
 * Simplified Schedule 8812 CTC / ACTC for the estimator.
 * Assumes each counted child is a qualifying child under 17 with a valid SSN.
 * Omits ODC, Form 2555 exclusion, and other edge cases.
 */
export function calculateChildTaxCredit(options: {
  qualifyingChildrenUnder17: number;
  adjustedGrossIncome: number;
  /** W-2 wages and/or SE net profit used for ACTC earned-income test. */
  earnedIncome: number;
  incomeTaxBeforeCredits: number;
  filingStatus: FilingStatus;
  config: TaxYearConfig;
}): ChildTaxCreditResult {
  const kids = Math.max(
    0,
    Math.min(20, Math.floor(options.qualifyingChildrenUnder17 || 0))
  );
  const taxBefore = Math.max(0, options.incomeTaxBeforeCredits);

  if (kids === 0 || !options.config.childTaxCredit) {
    return {
      qualifyingChildren: kids,
      creditBeforeLimit: 0,
      nonrefundableApplied: 0,
      additionalChildTaxCredit: 0,
      incomeTaxAfterCredits: taxBefore,
    };
  }

  const ctc = options.config.childTaxCredit;
  const maxCredit = kids * ctc.amountPerChild;
  const threshold =
    options.filingStatus === "married-jointly"
      ? ctc.phaseOutThresholdMarriedJointly
      : ctc.phaseOutThresholdOther;

  const over = Math.max(0, options.adjustedGrossIncome - threshold);
  // IRS: round up to next $1,000, then × $50
  const phaseOutUnits = over > 0 ? Math.ceil(over / 1_000) : 0;
  const phaseOut = phaseOutUnits * ctc.phaseOutPerThousand;
  const creditBeforeLimit = Math.max(0, maxCredit - phaseOut);

  const nonrefundableApplied = Math.min(creditBeforeLimit, taxBefore);
  const unused = creditBeforeLimit - nonrefundableApplied;

  let additionalChildTaxCredit = 0;
  if (unused > 0) {
    const refundableCap = kids * ctc.refundablePerChild;
    const earnedOverFloor = Math.max(
      0,
      options.earnedIncome - ctc.actcEarnedIncomeFloor
    );
    const earnedIncomeLimit = earnedOverFloor * ctc.actcEarnedIncomeRate;
    additionalChildTaxCredit = Math.min(unused, refundableCap, earnedIncomeLimit);
  }

  return {
    qualifyingChildren: kids,
    creditBeforeLimit,
    nonrefundableApplied,
    additionalChildTaxCredit: Math.round(additionalChildTaxCredit * 100) / 100,
    incomeTaxAfterCredits: Math.round((taxBefore - nonrefundableApplied) * 100) / 100,
  };
}
