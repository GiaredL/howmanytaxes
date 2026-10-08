import type { CountryAidOutlay } from "@/lib/fiscal/foreignAidClient";
import { allocateCountryAidContributions } from "@/lib/tax/allocate";

const NON_COUNTRY =
  /^(world|global)|region|multi-country|worldwide|unspecified/i;

/** Prefer named countries over World / regional FA buckets. */
export function isNamedCountry(country: CountryAidOutlay): boolean {
  if (country.countryCode === "WLD") return false;
  if (NON_COUNTRY.test(country.label)) return false;
  return true;
}

export type TopCountryContribution = {
  id: string;
  label: string;
  countryCode: string;
  amount: number;
  disbursements: number;
};

export function topCountryContributions(options: {
  internationalAffairsUserAmount: number;
  countries: CountryAidOutlay[];
  totalDisbursements: number;
  limit?: number;
}): TopCountryContribution[] {
  const { internationalAffairsUserAmount, countries, totalDisbursements } =
    options;
  const limit = options.limit ?? 3;

  if (
    internationalAffairsUserAmount <= 0 ||
    !countries.length ||
    totalDisbursements <= 0
  ) {
    return [];
  }

  const allocated = allocateCountryAidContributions({
    internationalAffairsUserAmount,
    countries,
    totalDisbursements,
  });

  return allocated
    .filter((c) => isNamedCountry(c))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      label: c.label,
      countryCode: c.countryCode,
      amount: c.amount,
      disbursements: c.disbursements,
    }));
}
