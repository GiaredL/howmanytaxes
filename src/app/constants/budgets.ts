import { getFallbackBudgetSnapshot, outlaysRecordFromSnapshot, totalIncomeTaxReceiptsFromSnapshot } from "@/lib/fiscal/budgetSnapshot";
import type { ProgramId, SubProgramOutlay } from "@/lib/fiscal/types";

export type { ProgramId };

/** Static fallback for SSR/build; prefer `/api/budget` or `getFederalBudgetSnapshot()`. */
const fallback = getFallbackBudgetSnapshot();

export const budgets: Record<ProgramId, number> = outlaysRecordFromSnapshot(fallback);

export const subBudgets: Partial<Record<ProgramId, SubProgramOutlay[]>> =
  fallback.subOutlaysByProgram ?? {};

/** Individual income tax receipts (FY actuals from Treasury MTS Table 9). */
export const totalTaxDollars = totalIncomeTaxReceiptsFromSnapshot(fallback);

/** Sum of MTS function outlays for the spending FY. */
export const totalFunctionOutlays = fallback.totalFunctionOutlays;

export const budgetMeta = fallback.meta;
