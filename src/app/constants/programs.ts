import type { ProgramId } from "@/lib/fiscal/types";
import type { AllocationLedger } from "@/lib/tax/allocate";

export type ProgramOption = {
  label: string;
  value: ProgramId;
  ledger: AllocationLedger;
  /** Short note shown when expanding (optional). */
  expandHint?: string;
};

/** Programs shown in the breakdown UI (Phase 3). */
export const PROGRAM_OPTIONS: ProgramOption[] = [
  { label: "Social Security", value: "socialSecurity", ledger: "payroll-oasdi" },
  { label: "Medicare (HI)", value: "medicare", ledger: "payroll-hi" },
  {
    label: "National Defense",
    value: "nationalDefense",
    ledger: "income-tax",
    expandHint: "OMB subfunctions (DoD-Military, atomic energy defense, etc.)",
  },
  {
    label: "International Affairs",
    value: "internationalAffairs",
    ledger: "income-tax",
    expandHint:
      "OMB subfunctions plus country aid from ForeignAssistance.gov disbursements",
  },
  { label: "Interest on Debt", value: "interest", ledger: "income-tax" },
  { label: "Veterans Benefits", value: "verteransBenefits", ledger: "income-tax" },
  { label: "Transportation", value: "transportation", ledger: "income-tax" },
  {
    label: "Energy",
    value: "energy",
    ledger: "income-tax",
    expandHint: "Energy supply, conservation, preparedness, and regulation",
  },
  { label: "Education", value: "education", ledger: "income-tax" },
  { label: "Agriculture", value: "agriculture", ledger: "income-tax" },
  { label: "Health", value: "health", ledger: "income-tax" },
  { label: "Income Security", value: "incomeSecurity", ledger: "income-tax" },
  {
    label: "Commerce & Housing",
    value: "commerceHousingCredit",
    ledger: "income-tax",
    expandHint:
      "Some years this category collects more than it spends (for example through insurance programs), so the total can look negative.",
  },
];
