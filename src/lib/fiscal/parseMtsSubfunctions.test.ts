import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/mts_subfunctions_fy2025.json";
import { parseMtsSubfunctions } from "./parseMtsSubfunctions";

describe("parseMtsSubfunctions", () => {
  it("nests National Defense subfunctions from the FY2025 fixture", () => {
    const byProgram = parseMtsSubfunctions(fixture);
    const defense = byProgram.nationalDefense ?? [];
    expect(defense.length).toBeGreaterThanOrEqual(3);
    expect(defense[0].label).toBe("Department of Defense-Military");
    expect(defense[0].outlay).toBeGreaterThan(800_000_000_000);
  });

  it("includes International Affairs and Energy children", () => {
    const byProgram = parseMtsSubfunctions(fixture);
    expect(byProgram.internationalAffairs?.length).toBeGreaterThan(0);
    expect(byProgram.energy?.some((c) => /energy supply/i.test(c.label))).toBe(true);
  });
});
