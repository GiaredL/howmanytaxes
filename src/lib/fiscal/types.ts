/** App program keys aligned with OMB/MTS budget functions where possible. */
export type ProgramId =
  | "nationalDefense"
  | "internationalAffairs"
  | "generalScienceSpaceTechnology"
  | "energy"
  | "naturalResourcesEnvironment"
  | "agriculture"
  | "commerceHousingCredit"
  | "transportation"
  | "communityRegionalDevelopment"
  | "education"
  | "health"
  | "medicare"
  | "incomeSecurity"
  | "socialSecurity"
  | "verteransBenefits"
  | "administrationOfJustice"
  | "generalGovernment"
  | "interest"
  | "undistributedOffsettingReceipts";

export type BudgetSourceMeta = {
  /** Federal fiscal year (e.g. 2025 for FY ending Sep 2025). */
  fiscalYear: number;
  /** MTS record date used (typically last month of the fiscal year). */
  recordDate: string;
  sourceUrl: string;
  dataset: "mts_table_9";
  retrievedAt: string;
};

/** OMB/MTS budget subfunction nested under a parent function. */
export type SubProgramOutlay = {
  id: string;
  label: string;
  /** Outlays in U.S. dollars (can be negative for offsetting receipts). */
  outlay: number;
};

export type FederalBudgetSnapshot = {
  meta: BudgetSourceMeta;
  /** Outlays in U.S. dollars (not millions). */
  outlaysByProgram: Partial<Record<ProgramId, number>>;
  /** Nested OMB subfunctions under each parent program (when available). */
  subOutlaysByProgram: Partial<Record<ProgramId, SubProgramOutlay[]>>;
  /** Individual income tax receipts (denominator for income-tax allocation). */
  totalIndividualIncomeTaxReceipts: number;
  /** Sum of function outlays from MTS (includes negative lines). */
  totalFunctionOutlays: number;
};

export type MtsTable9Row = {
  record_date: string;
  classification_desc: string;
  current_fytd_rcpt_outly_amt: string | null;
  data_type_cd: string;
  record_type_cd: string;
  record_fiscal_year: string;
  src_line_nbr: string;
};

export type MtsTable9Response = {
  data: MtsTable9Row[];
  meta: { "total-count"?: number; count?: number };
};
