import { describe, expect, it } from "vitest";
import { formatAltQuantity, pickAltPurchases } from "./altPurchases";

describe("pickAltPurchases", () => {
  it("returns a stable set for the same inputs", () => {
    const a = pickAltPurchases(18_000, 95_000);
    const b = pickAltPurchases(18_000, 95_000);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(a.length).toBe(5);
  });

  it("includes impact and gadget picks when the bill is large enough", () => {
    const picks = pickAltPurchases(25_000, 120_000);
    const ids = new Set(picks.map((p) => p.id));
    const hasImpact = [...ids].some((id) =>
      ["hot-meals", "food-weeks", "housing-months", "housing-years"].includes(id)
    );
    const hasGadget = [...ids].some((id) =>
      ["switch", "iphone", "ps5", "airpods"].includes(id)
    );
    expect(hasImpact).toBe(true);
    expect(hasGadget).toBe(true);
  });

  it("scales quantities to the tax bill", () => {
    const picks = pickAltPurchases(1_200, 50_000);
    expect(picks.every((p) => p.quantity >= 0.75)).toBe(true);
  });
});

describe("formatAltQuantity", () => {
  it("formats large and small quantities", () => {
    expect(formatAltQuantity(2400)).toBe("2,400");
    expect(formatAltQuantity(1.4)).toBe("1.4");
  });
});
