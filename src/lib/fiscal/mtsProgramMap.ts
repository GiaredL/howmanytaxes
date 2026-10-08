import type { ProgramId } from "./types";

/** Maps Treasury MTS Table 9 `classification_desc` to app program IDs. */
export const MTS_FUNCTION_TO_PROGRAM: Record<string, ProgramId> = {
  "National Defense": "nationalDefense",
  "International Affairs": "internationalAffairs",
  "General Science, Space, and Technology": "generalScienceSpaceTechnology",
  Energy: "energy",
  "Natural Resources and Environment": "naturalResourcesEnvironment",
  Agriculture: "agriculture",
  "Commerce and Housing Credit": "commerceHousingCredit",
  Transportation: "transportation",
  "Community and Regional Development": "communityRegionalDevelopment",
  "Education, Training, Employment, and Social Services": "education",
  Health: "health",
  Medicare: "medicare",
  "Income Security": "incomeSecurity",
  "Social Security": "socialSecurity",
  "Veterans Benefits and Services": "verteransBenefits",
  "Administration of Justice": "administrationOfJustice",
  "General Government": "generalGovernment",
  "Net Interest": "interest",
  "Undistributed Offsetting Receipts": "undistributedOffsettingReceipts",
};

export function programIdFromMtsDescription(description: string): ProgramId | undefined {
  return MTS_FUNCTION_TO_PROGRAM[description.trim()];
}
