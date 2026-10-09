"use client";

import type { CountryAidSnapshot } from "@/lib/fiscal/foreignAidClient";
import {
  formatAltQuantity,
  pickAltPurchases,
} from "@/lib/insights/altPurchases";
import { pickShockPurchases } from "@/lib/insights/shockPurchases";
import { topCountryContributions } from "@/lib/insights/countryAidInsights";
import type { FederalTaxResult } from "@/lib/tax/types";
import {
  IRS_AGI_SOURCE,
  estimateReturnsAroundIncome,
} from "@/lib/tax/incomeBrackets";
import { useCountUp } from "../hooks/useCountUp";
import { useScrollReveal } from "../hooks/useScrollReveal";
import {
  formatCurrencyWithSymbol,
  formatNumber,
  formatPercentage,
} from "../utils/formatters";
import styles from "./ContributionStats.module.scss";

const FULL_TIME_HOURS_PER_YEAR = 2_080;

type Props = {
  taxes: FederalTaxResult;
  /** Individual income tax receipts (Treasury MTS). */
  totalIndividualIncomeTaxReceipts: number;
  /** Sum of MTS function outlays for the spending FY. */
  totalFunctionOutlays: number;
  spendingFiscalYear: number;
  /** User's International Affairs contribution (income-tax ledger). */
  internationalAffairsAmount: number;
  countryAid: CountryAidSnapshot | null;
};

/** Full decimal percent — never scientific notation. */
function formatShare(share: number, precisionFrom?: number): string {
  if (!Number.isFinite(share) || share < 0) return "—";
  if (share === 0) return "0%";

  const pct = share * 100;
  const refPct = Math.max(pct, (precisionFrom ?? share) * 100);

  if (refPct >= 1) return `${pct.toFixed(2)}%`;
  if (refPct >= 0.01) return `${pct.toFixed(4)}%`;

  const leadingZeros = Math.ceil(-Math.log10(refPct)) - 1;
  const decimals = Math.min(12, Math.max(6, leadingZeros + 3));
  const raw = pct.toFixed(decimals);
  const trimmed = raw.replace(/0+$/, "").replace(/\.$/, "");
  return `${trimmed}%`;
}

function oneInN(share: number): string | null {
  if (!Number.isFinite(share) || share <= 0) return null;
  const n = Math.round(1 / share);
  if (n < 100) return null;
  return formatNumber(n);
}

/**
 * Rank shares often sit just under 100% (same-bracket / open top bin).
 * Don't round those up to 100% — or tiny shares down to 0%.
 */
function formatRankShare(share: number, decimals = 1): string {
  if (!Number.isFinite(share) || share <= 0) return "0%";
  if (share >= 1) return "100%";

  const factor = 10 ** decimals;
  const pct = share * 100;
  const rounded = Number(pct.toFixed(decimals));

  if (rounded >= 100) {
    return `${((factor * 100 - 1) / factor).toFixed(decimals)}%`;
  }
  if (rounded <= 0) {
    return `<${(1 / factor).toFixed(decimals)}%`;
  }
  return formatPercentage(share, decimals);
}

function ShareValue({ share, active }: { share: number; active: boolean }) {
  const animated = useCountUp(share, active, 1400);
  return (
    <p className={styles.value} aria-label={formatShare(share)}>
      {formatShare(active ? animated : 0, share)}
    </p>
  );
}

function PercentValue({
  share,
  active,
}: {
  share: number;
  active: boolean;
}) {
  const animated = useCountUp(share, active, 1500);
  return (
    <p className={styles.value} aria-label={formatRankShare(share)}>
      {formatRankShare(active ? animated : 0)}
    </p>
  );
}

function NumberValue({
  value,
  active,
  format = (n) => formatNumber(Math.round(n)),
}: {
  value: number;
  active: boolean;
  format?: (n: number) => string;
}) {
  const animated = useCountUp(value, active, 1400);
  return (
    <p className={styles.value} aria-label={format(value)}>
      {format(active ? animated : 0)}
    </p>
  );
}

export default function ContributionStats({
  taxes,
  totalIndividualIncomeTaxReceipts,
  totalFunctionOutlays,
  spendingFiscalYear,
  internationalAffairsAmount,
  countryAid,
}: Props) {
  const householdIncome = taxes.income + taxes.spouseIncome;
  const incomeTaxShare =
    totalIndividualIncomeTaxReceipts > 0
      ? taxes.incomeTax.incomeTax / totalIndividualIncomeTaxReceipts
      : 0;
  const budgetShare =
    totalFunctionOutlays > 0
      ? taxes.totalFederalTax / totalFunctionOutlays
      : 0;

  const workHours =
    householdIncome > 0
      ? (taxes.totalFederalTax / householdIncome) * FULL_TIME_HOURS_PER_YEAR
      : 0;
  const workWeeks = workHours / 40;

  const rank = estimateReturnsAroundIncome(householdIncome);
  const shareBelow =
    rank.totalReturns > 0 ? rank.returnsBelow / rank.totalReturns : 0;
  const shareTied =
    rank.totalReturns > 0 ? rank.returnsTiedBracket / rank.totalReturns : 0;
  const shareAbove =
    rank.totalReturns > 0 ? rank.returnsAbove / rank.totalReturns : 0;
  const incomeTaxOneIn = oneInN(incomeTaxShare);

  const topCountries =
    countryAid != null
      ? topCountryContributions({
          internationalAffairsUserAmount: internationalAffairsAmount,
          countries: countryAid.countries,
          totalDisbursements: countryAid.totalDisbursements,
          limit: 3,
        })
      : [];

  const altPurchases = pickAltPurchases(
    taxes.totalFederalTax,
    householdIncome,
    5,
  );
  const shockPurchases = pickShockPurchases(
    taxes.totalFederalTax,
    householdIncome,
    4,
  );

  const header = useScrollReveal<HTMLElement>();
  const altsReveal = useScrollReveal<HTMLDivElement>();
  const shockReveal = useScrollReveal<HTMLDivElement>();
  const scaleReveal = useScrollReveal<HTMLDivElement>();
  const countriesReveal = useScrollReveal<HTMLDivElement>();

  const scaleActive = scaleReveal.visible;
  const belowCount = useCountUp(rank.returnsBelow, scaleActive, 1500);
  const tiedCount = useCountUp(rank.returnsTiedBracket, scaleActive, 1500);
  const aboveCount = useCountUp(rank.returnsAbove, scaleActive, 1500);

  return (
    <section className={styles.panel} aria-label="Rough context stats">
      <header
        ref={header.ref}
        className={`${styles.header} ${header.visible ? styles.visible : ""}`}
      >
        <h2>Put that in context</h2>
        <p>
          Rough scale checks from official totals — not a ranking of anyone’s
          actual tax return.
        </p>
      </header>

      <div className={styles.sections}>
        {altPurchases.length > 0 && (
          <div
            ref={altsReveal.ref}
            className={`${styles.block} ${
              altsReveal.visible ? styles.visible : ""
            }`}
          >
            <div className={styles.sectionHead}>
              <h3>What that could have bought instead</h3>
              <p>
                Same federal tax dollars, wild ballpark remix — gadgets,
                housing, meals. Not a shopping list; just scale.
              </p>
            </div>
            <ul className={styles.altList}>
              {altPurchases.map((item) => (
                <li key={item.id} data-vibe={item.vibe}>
                  <strong>~{formatAltQuantity(item.quantity)}</strong>
                  <div className={styles.altCopy}>
                    <span>{item.label}</span>
                    <em>{item.priceNote}</em>
                  </div>
                </li>
              ))}
            </ul>
            <p className={styles.blockNote}>
              Impact figures are rough “cost of help” estimates (meals, rent),
              not government program outlays.
            </p>
          </div>
        )}

        {shockPurchases.length > 0 && (
          <div
            ref={shockReveal.ref}
            className={`${styles.block} ${
              shockReveal.visible ? styles.visible : ""
            }`}
          >
            <div className={styles.sectionHead}>
              <h3>Your whole tax bill vs one of these</h3>
              <p>
                Same estimated federal tax, next to rough public sticker prices
                for gear people often hate paying for — so you can see how small
                one household is next to a single unit.
              </p>
            </div>
            <ul className={styles.altList}>
              {shockPurchases.map((item) => (
                <li key={item.id} data-vibe="shock">
                  <strong>~{item.quantityLabel}</strong>
                  <div className={styles.altCopy}>
                    <span>{item.label}</span>
                    <em>{item.priceNote} · ballpark, not a contract bid</em>
                  </div>
                </li>
              ))}
            </ul>
            <p className={styles.blockNote}>
              Unit costs are commonly cited public ballparks (ammo, missiles,
              aircraft). Real DoD prices vary by lot, year, and what’s included.
            </p>
          </div>
        )}

        <div
          ref={scaleReveal.ref}
          className={`${styles.block} ${
            scaleReveal.visible ? styles.visible : ""
          }`}
        >
          <div className={styles.sectionHead}>
            <h3>How big your share is</h3>
            <p>
              Your estimate against Treasury totals and IRS income brackets.
            </p>
          </div>

          <div className={styles.list}>
            <div className={styles.row}>
              <ShareValue share={budgetShare} active={scaleActive} />
              <div className={styles.meta}>
                <p className={styles.label}>of federal spending</p>
                <p className={styles.detail}>
                  FY{spendingFiscalYear} · your income + payroll tax ÷ total
                  MTS function outlays. Other taxes and borrowing also fund the
                  budget.
                </p>
              </div>
            </div>

            <div className={styles.row}>
              <ShareValue share={incomeTaxShare} active={scaleActive} />
              <div className={styles.meta}>
                <p className={styles.label}>of all individual income tax</p>
                <p className={styles.detail}>
                  Your estimate ÷ Treasury individual income tax receipts
                  {incomeTaxOneIn
                    ? ` · about 1 in every ${incomeTaxOneIn}`
                    : ""}
                </p>
              </div>
            </div>

            {workHours > 0 && (
              <div className={styles.row}>
                <NumberValue value={workHours} active={scaleActive} />
                <div className={styles.meta}>
                  <p className={styles.label}>
                    hours of work went to federal tax
                  </p>
                  <p className={styles.detail}>
                    ~{workWeeks.toFixed(1)} weeks of a full-time year (assumes{" "}
                    {formatNumber(FULL_TIME_HOURS_PER_YEAR)} hours) · your
                    federal tax ÷ income × hours
                  </p>
                </div>
              </div>
            )}

            <div className={styles.row}>
              <PercentValue share={shareBelow} active={scaleActive} />
              <div className={styles.meta}>
                <p className={styles.label}>
                  of tax returns earn less than you
                </p>
                <p className={styles.detail}>
                  ~{formatNumber(Math.round(belowCount))} returns in lower IRS
                  AGI brackets
                </p>
              </div>
            </div>

            {rank.returnsTiedBracket > 0 && (
              <div className={styles.row}>
                <PercentValue share={shareTied} active={scaleActive} />
                <div className={styles.meta}>
                  <p className={styles.label}>
                    of tax returns are in your income bracket
                  </p>
                  <p className={styles.detail}>
                    ~{formatNumber(Math.round(tiedCount))} returns · IRS only
                    publishes wide AGI bands, so we can’t split this group into
                    above/below you
                  </p>
                </div>
              </div>
            )}

            <div className={styles.row}>
              <PercentValue share={shareAbove} active={scaleActive} />
              <div className={styles.meta}>
                <p className={styles.label}>
                  of tax returns earn more than you
                </p>
                <p className={styles.detail}>
                  ~{formatNumber(Math.round(aboveCount))} returns in higher IRS
                  AGI brackets
                </p>
              </div>
            </div>
          </div>
        </div>

        {topCountries.length > 0 && countryAid && (
          <div
            ref={countriesReveal.ref}
            className={`${styles.block} ${
              countriesReveal.visible ? styles.visible : ""
            }`}
          >
            <div className={styles.sectionHead}>
              <h3>Top countries that got money from you</h3>
              <p>
                Your International Affairs slice, split by
                ForeignAssistance.gov disbursement shares
                {` (FY${countryAid.fiscalYear})`} — illustrative, not
                identical to MTS outlays.
              </p>
            </div>
            <ol className={styles.countryList}>
              {topCountries.map((c, i) => (
                <li key={c.id}>
                  <span className={styles.countryRank}>{i + 1}</span>
                  <span className={styles.countryName}>{c.label}</span>
                  <span className={styles.countryAmount}>
                    {formatCurrencyWithSymbol(c.amount)}
                  </span>
                </li>
              ))}
            </ol>
            <p className={styles.blockNote}>
              <a href={countryAid.sourceUrl} target="_blank" rel="noreferrer">
                ForeignAssistance.gov
              </a>
            </p>
          </div>
        )}
      </div>

      <p className={styles.footnote}>
        Income ranks use {IRS_AGI_SOURCE.label}.{" "}
        <a href={IRS_AGI_SOURCE.url} target="_blank" rel="noreferrer">
          IRS source
        </a>
        .
      </p>
    </section>
  );
}
