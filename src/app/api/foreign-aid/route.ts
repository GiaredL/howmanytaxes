import { getCountryAidSnapshot } from "@/lib/fiscal/countryAidSnapshot";
import { DEFAULT_FISCAL_YEAR } from "@/lib/fiscal/budgetSnapshot";
import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fiscalYearParam = searchParams.get("fiscalYear");
  const fiscalYear = fiscalYearParam
    ? Number.parseInt(fiscalYearParam, 10)
    : DEFAULT_FISCAL_YEAR;

  if (!Number.isFinite(fiscalYear) || fiscalYear < 2000) {
    return NextResponse.json({ error: "Invalid fiscalYear" }, { status: 400 });
  }

  const snapshot = await getCountryAidSnapshot({ fiscalYear });
  return NextResponse.json(snapshot);
}
