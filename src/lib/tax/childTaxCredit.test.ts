import { describe, expect, it } from "vitest";
import { calculateChildTaxCredit } from "./childTaxCredit";
import { calculateFederalTaxes } from "./federalTaxes";
import { taxYear2025 } from "./taxYears/2025";

describe("calculateChildTaxCredit", () => {
  it("applies full nonrefundable CTC against tax when below phase-out", () => {
    const r = calculateChildTaxCredit({
      qualifyingChildrenUnder17: 2,
      adjustedGrossIncome: 90_000,
      earnedIncome: 90_000,
      incomeTaxBeforeCredits: 8_000,
      filingStatus: "married-jointly",
      config: taxYear2025,
    });
    expect(r.creditBeforeLimit).toBe(4_400);
    expect(r.nonrefundableApplied).toBe(4_400);
    expect(r.incomeTaxAfterCredits).toBe(3_600);
    expect(r.additionalChildTaxCredit).toBe(0);
  });

  it("creates ACTC when tax is too low to use the full credit", () => {
    const r = calculateChildTaxCredit({
      qualifyingChildrenUnder17: 1,
      adjustedGrossIncome: 40_000,
      earnedIncome: 40_000,
      incomeTaxBeforeCredits: 500,
      filingStatus: "single",
      config: taxYear2025,
    });
    expect(r.nonrefundableApplied).toBe(500);
    // unused 1700; ACTC capped at $1,700 and 15% of (40k-2500)=5625 → 1700
    expect(r.additionalChildTaxCredit).toBe(1_700);
    expect(r.incomeTaxAfterCredits).toBe(0);
  });

  it("phases out for high AGI", () => {
    const r = calculateChildTaxCredit({
      qualifyingChildrenUnder17: 1,
      adjustedGrossIncome: 210_000, // $10k over $200k → 10 × $50 = $500
      earnedIncome: 210_000,
      incomeTaxBeforeCredits: 30_000,
      filingStatus: "single",
      config: taxYear2025,
    });
    expect(r.creditBeforeLimit).toBe(1_700);
    expect(r.nonrefundableApplied).toBe(1_700);
  });
});

describe("calculateFederalTaxes with kids", () => {
  it("reduces MFJ income tax by CTC for two kids", () => {
    const noKids = calculateFederalTaxes({
      taxYear: 2025,
      filingStatus: "married-jointly",
      employmentType: "employee",
      income: 100_000,
    });
    const withKids = calculateFederalTaxes({
      taxYear: 2025,
      filingStatus: "married-jointly",
      employmentType: "employee",
      income: 100_000,
      qualifyingChildrenUnder17: 2,
    });
    expect(noKids.incomeTax.incomeTax).toBe(7_743);
    expect(withKids.incomeTax.incomeTaxBeforeCredits).toBe(7_743);
    expect(withKids.incomeTax.childTaxCredit).toBe(4_400);
    expect(withKids.incomeTax.incomeTax).toBe(3_343);
    expect(withKids.totalFederalTax).toBe(3_343 + 7_650);
  });
});
