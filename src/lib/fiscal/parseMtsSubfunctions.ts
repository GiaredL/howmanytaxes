import { programIdFromMtsDescription } from "./mtsProgramMap";
import { parseCurrencyField } from "./parseMtsTable9";
import type { ProgramId, SubProgramOutlay } from "./types";

export type MtsSubfunctionRow = {
  function_desc: string | null;
  sub_function_desc: string | null;
  current_fytd_outly_amt: string | null;
};

export type MtsSubfunctionResponse = {
  data: MtsSubfunctionRow[];
};

export function slugifySubProgram(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/**
 * Group MTS Table 9A function/subfunction outlays under app program IDs.
 * Official OMB budget subfunctions (e.g. Defense → DoD-Military, Atomic energy…).
 */
export function parseMtsSubfunctions(
  response: MtsSubfunctionResponse
): Partial<Record<ProgramId, SubProgramOutlay[]>> {
  const byProgram: Partial<Record<ProgramId, SubProgramOutlay[]>> = {};

  for (const row of response.data) {
    if (!row.function_desc || !row.sub_function_desc) continue;
    const amount = parseCurrencyField(row.current_fytd_outly_amt);
    if (amount == null) continue;

    const programId = programIdFromMtsDescription(row.function_desc);
    if (!programId) continue;

    const label = row.sub_function_desc.trim();
    const child: SubProgramOutlay = {
      id: slugifySubProgram(label),
      label,
      outlay: amount,
    };

    const list = byProgram[programId] ?? [];
    list.push(child);
    byProgram[programId] = list;
  }

  for (const programId of Object.keys(byProgram) as ProgramId[]) {
    byProgram[programId] = [...(byProgram[programId] ?? [])].sort(
      (a, b) => Math.abs(b.outlay) - Math.abs(a.outlay)
    );
  }

  return byProgram;
}
