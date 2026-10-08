/** Seconds / ms helpers for "contributions so far this year" tickers. */

export function getTaxYearBounds(taxYear: number): { start: Date; end: Date } {
  // Inclusive calendar year of the selected tax year
  const start = new Date(taxYear, 0, 1, 0, 0, 0, 0);
  const end = new Date(taxYear + 1, 0, 1, 0, 0, 0, 0);
  return { start, end };
}

/**
 * Fraction of the tax year elapsed at `now` (0..1).
 * Before the year starts → 0; after it ends → 1.
 */
export function yearElapsedFraction(now: Date, taxYear: number): number {
  const { start, end } = getTaxYearBounds(taxYear);
  const t = now.getTime();
  if (t <= start.getTime()) return 0;
  if (t >= end.getTime()) return 1;
  return (t - start.getTime()) / (end.getTime() - start.getTime());
}

/**
 * Accrue an annual dollar amount by exact year progress (no rounding).
 * Use this for the live ticker so sub-cent motion is visible every second.
 */
export function yearToDateAmount(annualAmount: number, now: Date, taxYear: number): number {
  const fraction = yearElapsedFraction(now, taxYear);
  return annualAmount * fraction;
}

/** Same as year-to-date, rounded to cents (for static “full year so far” copy if needed). */
export function yearToDateAmountCents(
  annualAmount: number,
  now: Date,
  taxYear: number
): number {
  return Math.round(yearToDateAmount(annualAmount, now, taxYear) * 100) / 100;
}

/** Per-second accrual rate for an annual amount. */
export function perSecondRate(annualAmount: number, taxYear: number): number {
  const { start, end } = getTaxYearBounds(taxYear);
  const seconds = (end.getTime() - start.getTime()) / 1000;
  return seconds > 0 ? annualAmount / seconds : 0;
}
