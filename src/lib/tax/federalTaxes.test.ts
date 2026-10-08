import { describe, expect, it } from "vitest";
import {
  allocateCountryAidContributions,
  allocateSubProgramContributions,
  calculateProgramContribution,
} from "./allocate";
import { calculateFederalTaxes } from "./federalTaxes";
import { taxOnTaxableIncome } from "./incomeTax";
import { taxYear2025 } from "./taxYears/2025";

describe("taxOnTaxableIncome", () => {
  it("applies progressive brackets without gaps", () => {
    // $23,850 @ 10% + $10,000 @ 12% = $2,385 + $1,200 = $3,585
    expect(taxOnTaxableIncome(33_850, taxYear2025.brackets["married-jointly"])).toBe(3585);
  });
});

describe("calculateFederalTaxes — MFJ $100k TY2025", () => {
  it("employee W-2: income tax + employee FICA (no employer share)", () => {
    const result = calculateFederalTaxes({
      taxYear: 2025,
      filingStatus: "married-jointly",
      employmentType: "employee",
      income: 100_000,
    });

    // Taxable = 100000 - 31500 = 68500
    // 10% × 23850 + 12% × 44650 = 2385 + 5358 = 7743
    expect(result.incomeTax.standardDeduction).toBe(31_500);
    expect(result.incomeTax.deductionTaken).toBe(31_500);
    expect(result.incomeTax.usedItemized).toBe(false);
    expect(result.incomeTax.taxableIncome).toBe(68_500);
    expect(result.incomeTax.incomeTax).toBe(7743);
    expect(result.payroll.oasdiTax).toBe(6200);
    expect(result.payroll.hiTax).toBe(1450);
    expect(result.payroll.additionalMedicareTax).toBe(0);
    expect(result.payroll.totalPayrollTax).toBe(7650);
    expect(result.payroll.deductibleHalfOfSeTax).toBe(0);
    expect(result.totalFederalTax).toBe(15_393);
  });

  it("self-employed: SECA on 92.35% base + half-SE deduction", () => {
    const result = calculateFederalTaxes({
      taxYear: 2025,
      filingStatus: "married-jointly",
      employmentType: "self-employed",
      income: 100_000,
    });

    expect(result.payroll.seTaxBase).toBe(92_350);
    expect(result.payroll.oasdiTax).toBe(11_451.4);
    expect(result.payroll.hiTax).toBe(2678.15);
    expect(result.payroll.totalPayrollTax).toBe(14_129.55);
    expect(result.payroll.deductibleHalfOfSeTax).toBe(7064.78);
    expect(result.incomeTax.taxableIncome).toBeCloseTo(61_435.22, 2);
    expect(result.incomeTax.incomeTax).toBe(6895.23);
  });
});

describe("itemized deductions", () => {
  it("uses itemized only when higher than the standard deduction", () => {
    const itemized = calculateFederalTaxes({
      taxYear: 2025,
      filingStatus: "married-jointly",
      employmentType: "employee",
      income: 100_000,
      itemizedDeductions: 40_000,
    });
    // Taxable = 100000 - 40000 = 60000
    // 10% × 23850 + 12% × 36150 = 2385 + 4338 = 6723
    expect(itemized.incomeTax.usedItemized).toBe(true);
    expect(itemized.incomeTax.deductionTaken).toBe(40_000);
    expect(itemized.incomeTax.taxableIncome).toBe(60_000);
    expect(itemized.incomeTax.incomeTax).toBe(6723);

    const belowStandard = calculateFederalTaxes({
      taxYear: 2025,
      filingStatus: "married-jointly",
      employmentType: "employee",
      income: 100_000,
      itemizedDeductions: 20_000,
    });
    expect(belowStandard.incomeTax.usedItemized).toBe(false);
    expect(belowStandard.incomeTax.deductionTaken).toBe(31_500);
    expect(belowStandard.incomeTax.incomeTax).toBe(7743);
  });
});

describe("Social Security wage base & MFJ dual earners", () => {
  it("caps OASDI at the annual wage base for one high earner", () => {
    const result = calculateFederalTaxes({
      taxYear: 2025,
      filingStatus: "single",
      employmentType: "employee",
      income: 250_000,
    });

    // 176100 × 6.2% = 10918.20 (not 250000 × 6.2%)
    expect(result.payroll.oasdiTax).toBe(10_918.2);
    expect(result.payroll.oasdiCapped).toBe(true);
    // Medicare HI has no wage base
    expect(result.payroll.hiTax).toBe(3625);
    // Additional Medicare 0.9% over $200k → $450
    expect(result.payroll.additionalMedicareTax).toBe(450);
  });

  it("applies a separate OASDI wage base to each MFJ spouse", () => {
    const result = calculateFederalTaxes({
      taxYear: 2025,
      filingStatus: "married-jointly",
      employmentType: "employee",
      income: 100_000,
      spouseIncome: 100_000,
    });

    // Each pays 6200 OASDI → 12400 (not one shared base on $200k)
    expect(result.payroll.oasdiTax).toBe(12_400);
    expect(result.incomeTax.grossIncome).toBe(200_000);
    expect(result.payroll.oasdiCapped).toBe(false);
  });
});

describe("calculateProgramContribution dual ledger", () => {
  const taxes = calculateFederalTaxes({
    taxYear: 2025,
    filingStatus: "married-jointly",
    employmentType: "employee",
    income: 100_000,
  });

  it("maps Social Security to OASDI payroll tax", () => {
    const c = calculateProgramContribution({
      taxes,
      programId: "socialSecurity",
      programOutlay: 1_580_685_783_033.83,
      totalIndividualIncomeTaxReceipts: 2_656_044_447_275.63,
    });
    expect(c.ledger).toBe("payroll-oasdi");
    expect(c.amount).toBe(6200);
  });

  it("maps Medicare to HI payroll tax", () => {
    const c = calculateProgramContribution({
      taxes,
      programId: "medicare",
      programOutlay: 996_719_243_004.76,
      totalIndividualIncomeTaxReceipts: 2_656_044_447_275.63,
    });
    expect(c.ledger).toBe("payroll-hi");
    expect(c.amount).toBe(1450);
  });

  it("maps defense to income-tax share of outlays", () => {
    const outlay = 916_648_676_662.05;
    const receipts = 2_656_044_447_275.63;
    const c = calculateProgramContribution({
      taxes,
      programId: "nationalDefense",
      programOutlay: outlay,
      totalIndividualIncomeTaxReceipts: receipts,
    });
    expect(c.ledger).toBe("income-tax");
    expect(c.amount).toBeCloseTo((7743 / receipts) * outlay, 5);
  });

  it("splits parent contribution across subfunctions by outlay share", () => {
    const children = allocateSubProgramContributions({
      parentUserAmount: 100,
      parentOutlay: 1000,
      children: [
        { id: "a", label: "A", outlay: 700 },
        { id: "b", label: "B", outlay: 300 },
      ],
    });
    expect(children[0].amount).toBeCloseTo(70, 5);
    expect(children[1].amount).toBeCloseTo(30, 5);
  });

  it("apportions International Affairs dollars by country aid shares", () => {
    const rows = allocateCountryAidContributions({
      internationalAffairsUserAmount: 100,
      totalDisbursements: 1000,
      countries: [
        { id: "ukraine", label: "Ukraine", countryCode: "UKR", disbursements: 600 },
        { id: "israel", label: "Israel", countryCode: "ISR", disbursements: 400 },
      ],
    });
    expect(rows[0].amount).toBeCloseTo(60, 5);
    expect(rows[1].amount).toBeCloseTo(40, 5);
  });
});
