import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/fa_by_country_fy2025.json";
import { parseCountryAidDisbursements } from "./foreignAidClient";

describe("parseCountryAidDisbursements", () => {
  it("ranks FY2025 disbursements with Ukraine and Israel near the top", () => {
    const snap = parseCountryAidDisbursements(fixture, {
      fiscalYear: 2025,
      topN: 10,
      retrievedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(snap.fiscalYear).toBe(2025);
    expect(snap.countries.length).toBe(10);
    const labels = snap.countries.map((c) => c.label);
    expect(labels.some((l) => /Ukraine/i.test(l))).toBe(true);
    expect(labels.some((l) => /Israel/i.test(l))).toBe(true);
    expect(snap.countries[0].disbursements).toBeGreaterThan(
      snap.countries[1].disbursements
    );
  });
});
