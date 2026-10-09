import { describe, expect, it } from "vitest";
import { formatShockQuantity, pickShockPurchases } from "./shockPurchases";

describe("formatShockQuantity", () => {
  it("uses 1/N for tiny fractions of expensive gear", () => {
    const r = formatShockQuantity(15_000 / 2_000_000);
    expect(r.useSingular).toBe(true);
    expect(r.quantityLabel.startsWith("1/")).toBe(true);
  });

  it("formats large ammo counts", () => {
    const r = formatShockQuantity(30_000);
    expect(r.useSingular).toBe(false);
    expect(r.quantityLabel).toBe("30,000");
  });
});

describe("pickShockPurchases", () => {
  it("returns a stable mix including tiny missile fractions", () => {
    const a = pickShockPurchases(18_000, 95_000);
    const b = pickShockPurchases(18_000, 95_000);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
    expect(a.length).toBeGreaterThanOrEqual(3);
    expect(a.some((x) => x.quantity < 1)).toBe(true);
  });
});
