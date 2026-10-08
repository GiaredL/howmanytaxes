import { describe, expect, it } from "vitest";
import expectedSnapshot from "./__fixtures__/budget-snapshot-fy2025.json";
import fullResponse from "./__fixtures__/mts_table_9_fy2025_full.json";
import sampleResponse from "./__fixtures__/mts_table_9_fy2025_sample.json";
import { parseCurrencyField, parseMtsTable9ToSnapshot } from "./parseMtsTable9";
import type { MtsTable9Response } from "./types";

describe("parseCurrencyField", () => {
  it("parses numeric strings", () => {
    expect(parseCurrencyField("916648676662.05")).toBe(916648676662.05);
  });

  it("returns null for missing values", () => {
    expect(parseCurrencyField(null)).toBeNull();
    expect(parseCurrencyField("null")).toBeNull();
  });
});

describe("parseMtsTable9ToSnapshot", () => {
  it("parses individual income tax receipts and function outlays from sample rows", () => {
    const snapshot = parseMtsTable9ToSnapshot(sampleResponse as MtsTable9Response, {
      retrievedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(snapshot.meta.fiscalYear).toBe(2025);
    expect(snapshot.meta.recordDate).toBe("2025-09-30");
    expect(snapshot.totalIndividualIncomeTaxReceipts).toBe(2656044447275.63);
    expect(snapshot.outlaysByProgram.nationalDefense).toBe(916648676662.05);
    expect(snapshot.outlaysByProgram.transportation).toBe(145804369616.67);
    expect(snapshot.outlaysByProgram.interest).toBe(970358886994.32);
  });

  it("parses the full FY2025 Treasury fixture into expected program outlays", () => {
    const snapshot = parseMtsTable9ToSnapshot(fullResponse as MtsTable9Response, {
      retrievedAt: expectedSnapshot.meta.retrievedAt,
    });

    expect(snapshot.meta.fiscalYear).toBe(expectedSnapshot.meta.fiscalYear);
    expect(snapshot.meta.recordDate).toBe(expectedSnapshot.meta.recordDate);
    expect(snapshot.totalIndividualIncomeTaxReceipts).toBe(
      expectedSnapshot.totalIndividualIncomeTaxReceipts
    );
    expect(snapshot.totalFunctionOutlays).toBeCloseTo(expectedSnapshot.totalFunctionOutlays, 2);

    for (const [programId, amount] of Object.entries(expectedSnapshot.outlaysByProgram)) {
      expect(snapshot.outlaysByProgram[programId as keyof typeof snapshot.outlaysByProgram]).toBe(
        amount
      );
    }
  });
});
