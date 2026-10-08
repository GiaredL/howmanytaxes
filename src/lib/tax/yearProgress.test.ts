import { describe, expect, it } from "vitest";
import { yearElapsedFraction, yearToDateAmount } from "./yearProgress";

describe("yearElapsedFraction", () => {
  it("is 0 before the tax year", () => {
    expect(yearElapsedFraction(new Date(2024, 11, 31), 2025)).toBe(0);
  });

  it("is 1 after the tax year", () => {
    expect(yearElapsedFraction(new Date(2026, 0, 1), 2025)).toBe(1);
  });

  it("is ~0.5 at mid-year", () => {
    // July 2 is roughly halfway through a non-leap year
    const mid = new Date(2025, 6, 2, 12, 0, 0, 0);
    expect(yearElapsedFraction(mid, 2025)).toBeGreaterThan(0.49);
    expect(yearElapsedFraction(mid, 2025)).toBeLessThan(0.52);
  });
});

describe("yearToDateAmount", () => {
  it("scales annual contribution by elapsed fraction", () => {
    const start = new Date(2025, 0, 1);
    expect(yearToDateAmount(10_000, start, 2025)).toBe(0);

    const end = new Date(2026, 0, 1);
    expect(yearToDateAmount(10_000, end, 2025)).toBe(10_000);
  });

  it("does not round away sub-cent motion mid-year", () => {
    const mid = new Date(2025, 6, 2, 12, 0, 0, 0);
    const value = yearToDateAmount(100, mid, 2025);
    expect(value).toBeGreaterThan(49);
    expect(value).toBeLessThan(52);
    // Not snapped to 2 decimal places only
    expect(Number.isInteger(value * 100)).toBe(false);
  });
});
