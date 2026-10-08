import {
  getFederalBudgetSnapshot,
  outlaysRecordFromSnapshot,
  totalIncomeTaxReceiptsFromSnapshot,
} from "@/lib/fiscal/budgetSnapshot";
import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fiscalYearParam = searchParams.get("fiscalYear");
  const fiscalYear = fiscalYearParam ? Number.parseInt(fiscalYearParam, 10) : undefined;

  if (fiscalYearParam && (!Number.isFinite(fiscalYear) || fiscalYear! < 2000)) {
    return NextResponse.json({ error: "Invalid fiscalYear" }, { status: 400 });
  }

  const snapshot = await getFederalBudgetSnapshot({ fiscalYear });
  const budgets = outlaysRecordFromSnapshot(snapshot);
  const totalTaxDollars = totalIncomeTaxReceiptsFromSnapshot(snapshot);

  return NextResponse.json({
    meta: snapshot.meta,
    budgets,
    subBudgets: snapshot.subOutlaysByProgram ?? {},
    totalTaxDollars,
    totalFunctionOutlays: snapshot.totalFunctionOutlays,
  });
}
