import { describe, expect, it } from "vitest";
import {
  IRS_TOTAL_RETURNS_TY2022,
  estimateReturnsAroundIncome,
} from "./incomeBrackets";

describe("estimateReturnsAroundIncome", () => {
  it("matches the published TY2022 return total", () => {
    expect(IRS_TOTAL_RETURNS_TY2022).toBe(158_082_437);
  });

  it("puts a mid income above lower brackets and below higher ones", () => {
    const r = estimateReturnsAroundIncome(55_000);
    // Below $50k brackets sum to 80,711,404
    expect(r.returnsBelow).toBe(80_711_404);
    expect(r.returnsTiedBracket).toBe(23_805_797);
    expect(r.returnsBelow + r.returnsAbove + r.returnsTiedBracket).toBe(
      IRS_TOTAL_RETURNS_TY2022
    );
  });

  it("treats very high income as above nearly all returns", () => {
    const r = estimateReturnsAroundIncome(20_000_000);
    expect(r.returnsAbove).toBe(0);
    expect(r.returnsTiedBracket).toBe(34_630);
    expect(r.returnsBelow).toBe(IRS_TOTAL_RETURNS_TY2022 - 34_630);
  });
});
