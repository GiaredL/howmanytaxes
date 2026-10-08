import { describe, expect, it } from "vitest";
import {
  isNamedCountry,
  topCountryContributions,
} from "./countryAidInsights";

describe("isNamedCountry", () => {
  it("drops World and regional buckets", () => {
    expect(
      isNamedCountry({
        id: "world",
        label: "Global / multi-country (reported as World)",
        countryCode: "WLD",
        disbursements: 1,
      })
    ).toBe(false);
    expect(
      isNamedCountry({
        id: "ssn",
        label: "Sub-Saharan Africa Region",
        countryCode: "SSN",
        disbursements: 1,
      })
    ).toBe(false);
    expect(
      isNamedCountry({
        id: "ukraine",
        label: "Ukraine",
        countryCode: "UKR",
        disbursements: 1,
      })
    ).toBe(true);
  });
});

describe("topCountryContributions", () => {
  it("returns the top named countries by user amount", () => {
    const top = topCountryContributions({
      internationalAffairsUserAmount: 100,
      totalDisbursements: 1000,
      countries: [
        {
          id: "world",
          label: "World",
          countryCode: "WLD",
          disbursements: 500,
        },
        {
          id: "ukraine",
          label: "Ukraine",
          countryCode: "UKR",
          disbursements: 300,
        },
        {
          id: "israel",
          label: "Israel",
          countryCode: "ISR",
          disbursements: 150,
        },
        {
          id: "jordan",
          label: "Jordan",
          countryCode: "JOR",
          disbursements: 50,
        },
      ],
      limit: 3,
    });
    expect(top.map((c) => c.id)).toEqual(["ukraine", "israel", "jordan"]);
    expect(top[0]!.amount).toBeCloseTo(30);
  });
});
