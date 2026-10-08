import type { ProgramId, SubProgramOutlay } from "@/lib/fiscal/types";
import type { FederalTaxResult } from "./types";

export type AllocationLedger = "income-tax" | "payroll-oasdi" | "payroll-hi";

export type ProgramContribution = {
  programId: ProgramId;
  amount: number;
  ledger: AllocationLedger;
  /** Short explanation for UI footnotes. */
  method: string;
};

export type SubProgramContribution = {
  id: string;
  label: string;
  /** User's estimated dollars for this subfunction. */
  amount: number;
  parentOutlayShare: number;
  outlay: number;
};

/**
 * Dual-ledger allocation (PROJECT_BRIEF Model A):
 * - Social Security ← user's OASDI payroll/SE tax
 * - Medicare ← user's HI + Additional Medicare payroll/SE tax
 * - Other programs ← share of user's income tax × program outlays / total individual income tax receipts
 */
export function calculateProgramContribution(options: {
  taxes: FederalTaxResult;
  programId: ProgramId;
  programOutlay: number;
  totalIndividualIncomeTaxReceipts: number;
}): ProgramContribution {
  const { taxes, programId, programOutlay, totalIndividualIncomeTaxReceipts } = options;

  if (programId === "socialSecurity") {
    return {
      programId,
      amount: taxes.payroll.oasdiTax,
      ledger: "payroll-oasdi",
      method: "Your Social Security (OASDI) payroll / self-employment tax",
    };
  }

  if (programId === "medicare") {
    const amount = taxes.payroll.hiTax + taxes.payroll.additionalMedicareTax;
    return {
      programId,
      amount,
      ledger: "payroll-hi",
      method:
        "Your Medicare Hospital Insurance (HI) payroll / self-employment tax (Parts B/D are largely general-fund financed and not included here)",
    };
  }

  if (totalIndividualIncomeTaxReceipts <= 0) {
    return {
      programId,
      amount: 0,
      ledger: "income-tax",
      method: "Unavailable — missing individual income tax receipt total",
    };
  }

  const amount =
    (taxes.incomeTax.incomeTax / totalIndividualIncomeTaxReceipts) * programOutlay;

  return {
    programId,
    amount,
    ledger: "income-tax",
    method:
      "(Your income tax ÷ total individual income tax receipts) × program outlays (Treasury MTS)",
  };
}

/**
 * Split a parent's user contribution across OMB/MTS subfunctions
 * in proportion to each child's share of parent outlays.
 */
export function allocateSubProgramContributions(options: {
  parentUserAmount: number;
  parentOutlay: number;
  children: SubProgramOutlay[];
}): SubProgramContribution[] {
  const { parentUserAmount, parentOutlay, children } = options;
  if (!children.length || parentOutlay === 0) {
    return [];
  }

  return children.map((child) => {
    const parentOutlayShare = child.outlay / parentOutlay;
    return {
      id: child.id,
      label: child.label,
      amount: parentUserAmount * parentOutlayShare,
      parentOutlayShare,
      outlay: child.outlay,
    };
  });
}

export type CountryAidContribution = {
  id: string;
  label: string;
  countryCode: string;
  amount: number;
  shareOfAid: number;
  disbursements: number;
};

/**
 * Apportion the user's International Affairs contribution across countries
 * using ForeignAssistance.gov disbursement shares (illustrative; FA totals
 * are not identical to MTS International Affairs outlays).
 */
export function allocateCountryAidContributions(options: {
  internationalAffairsUserAmount: number;
  countries: { id: string; label: string; countryCode: string; disbursements: number }[];
  totalDisbursements: number;
}): CountryAidContribution[] {
  const { internationalAffairsUserAmount, countries, totalDisbursements } = options;
  if (!countries.length || totalDisbursements <= 0) {
    return [];
  }

  return countries.map((c) => {
    const shareOfAid = c.disbursements / totalDisbursements;
    return {
      id: c.id,
      label: c.label,
      countryCode: c.countryCode,
      amount: internationalAffairsUserAmount * shareOfAid,
      shareOfAid,
      disbursements: c.disbursements,
    };
  });
}
