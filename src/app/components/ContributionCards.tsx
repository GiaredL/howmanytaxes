"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { CountryAidSnapshot } from "@/lib/fiscal/foreignAidClient";
import type { ProgramId, SubProgramOutlay } from "@/lib/fiscal/types";
import { yearToDateAmount } from "@/lib/tax/yearProgress";
import { formatCurrencyWithSymbol, formatPercentage } from "../utils/formatters";
import { PROGRAM_OPTIONS } from "../constants/programs";
import {
  estimateCountryAidContributionsForUi,
  estimateSubProgramContributionsForUi,
} from "../utils/taxCalculations";
import LiveCurrency from "./LiveCurrency";
import styles from "./ContributionCards.module.scss";

export type ContributionRow = {
  programId: ProgramId;
  label: string;
  amount: number;
  ledger: "income-tax" | "payroll-oasdi" | "payroll-hi";
  parentOutlay: number;
  children: SubProgramOutlay[];
  expandHint?: string;
};

type Props = {
  rows: ContributionRow[];
  selected: ProgramId | null;
  onSelect: (id: ProgramId) => void;
  hasIncome: boolean;
  taxYear: number;
  now: Date;
  countryAid: CountryAidSnapshot | null;
  /** Full-width multi-column layout when graph is closed. */
  layout?: "full" | "sidebar";
};

function ledgerLabel(ledger: ContributionRow["ledger"]): string {
  if (ledger === "income-tax") return "Income tax";
  if (ledger === "payroll-oasdi") return "Payroll · SS";
  return "Payroll · HI";
}

function isOffsetLine(child: { outlay?: number; amount?: number }): boolean {
  if (typeof child.outlay === "number") return child.outlay < 0;
  if (typeof child.amount === "number") return child.amount < 0;
  return false;
}

function rowCanOpen(
  row: ContributionRow,
  countryAid: CountryAidSnapshot | null
): boolean {
  const hasCountryAid =
    row.programId === "internationalAffairs" &&
    Boolean(countryAid?.countries.length);
  return row.children.length > 0 || hasCountryAid;
}

export default function ContributionCards({
  rows,
  selected,
  onSelect,
  hasIncome,
  taxYear,
  now,
  countryAid,
  layout = "full",
}: Props) {
  const titleId = useId();
  const [detailId, setDetailId] = useState<ProgramId | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayRows =
    rows.length > 0
      ? rows
      : PROGRAM_OPTIONS.map((p) => ({
          programId: p.value,
          label: p.label,
          amount: 0,
          ledger: p.ledger,
          parentOutlay: 0,
          children: [] as SubProgramOutlay[],
          expandHint: p.expandHint,
        }));

  const detailRow = detailId
    ? displayRows.find((r) => r.programId === detailId) ?? null
    : null;

  const hasCountryAid =
    detailRow?.programId === "internationalAffairs" &&
    Boolean(countryAid?.countries.length);

  const showDetail =
    Boolean(detailRow) && rowCanOpen(detailRow!, countryAid);

  useEffect(() => {
    if (!showDetail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailId(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [showDetail]);

  const childContributions =
    detailRow && hasIncome && detailRow.children.length > 0
      ? estimateSubProgramContributionsForUi({
          parentUserAmount: detailRow.amount,
          parentOutlay: detailRow.parentOutlay,
          children: detailRow.children,
        })
      : [];

  const countryContributions =
    detailRow && hasCountryAid && countryAid
      ? estimateCountryAidContributionsForUi({
          internationalAffairsUserAmount: hasIncome ? detailRow.amount : 0,
          countries: countryAid.countries,
          totalDisbursements: countryAid.totalDisbursements,
        })
      : [];

  function openRow(row: ContributionRow) {
    onSelect(row.programId);
    if (rowCanOpen(row, countryAid)) {
      setDetailId(row.programId);
    }
  }

  return (
    <section className={styles.panel} aria-label="Program contributions">
      <header className={styles.panelHeader}>
        <h2>Your contributions this year</h2>
        <p>
          {hasIncome
            ? "Estimate only — not tax advice. Select a program to see where that share goes."
            : "Enter income to fill amounts. Estimate only — not tax advice."}
        </p>
      </header>

      <div
        className={`${styles.list} ${layout === "full" ? styles.listFull : ""}`}
      >
        {displayRows.map((row) => {
          const isSelected = selected === row.programId;
          const ytd = yearToDateAmount(row.amount, now, taxYear);
          const canOpen = rowCanOpen(row, countryAid);
          const isNetOffset = row.parentOutlay < 0 || row.amount < 0;
          const partCount =
            row.children.length +
            (row.programId === "internationalAffairs" && countryAid
              ? countryAid.countries.length
              : 0);

          return (
            <button
              key={row.programId}
              type="button"
              className={`${styles.card} ${isSelected ? styles.cardSelected : ""} ${
                isNetOffset ? styles.cardOffset : ""
              }`}
              onClick={() => openRow(row)}
              aria-haspopup={canOpen ? "dialog" : undefined}
            >
              <span className={styles.cardLedger}>
                {isNetOffset ? "Money came in" : ledgerLabel(row.ledger)}
              </span>
              <span className={styles.cardLabel}>{row.label}</span>
              <span className={styles.cardAmount}>
                {hasIncome ? <LiveCurrency amount={ytd} /> : "—"}
              </span>
              {hasIncome && (
                <span className={styles.cardFullYear}>
                  full year {formatCurrencyWithSymbol(row.amount)}
                </span>
              )}
              {isNetOffset && (
                <span className={styles.cardOffsetNote}>
                  This category took in more than it spent — so your share
                  shows as negative. You’re not getting a refund.
                </span>
              )}
              {canOpen && (
                <span className={styles.cardHint}>
                  {partCount} parts · open view
                </span>
              )}
            </button>
          );
        })}
      </div>

      {mounted &&
        detailRow &&
        showDetail &&
        createPortal(
          <div
            className={styles.overlay}
            role="presentation"
            onClick={() => setDetailId(null)}
          >
            <div
              className={styles.sheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onClick={(e) => e.stopPropagation()}
            >
              <header className={styles.sheetHeader}>
                <div className={styles.sheetIntro}>
                  <span className={styles.sheetLedger}>
                    {ledgerLabel(detailRow.ledger)}
                  </span>
                  <h2 id={titleId}>{detailRow.label}</h2>
                  <div
                    className={`${styles.sheetHero} ${
                      detailRow.amount < 0 || detailRow.parentOutlay < 0
                        ? styles.sheetHeroOffset
                        : ""
                    }`}
                  >
                    {hasIncome ? (
                      <>
                        <LiveCurrency
                          amount={yearToDateAmount(
                            detailRow.amount,
                            now,
                            taxYear
                          )}
                        />
                        <span className={styles.sheetHeroSub}>
                          {detailRow.parentOutlay < 0
                            ? "your share of the surplus in this category · full year "
                            : "so far this year · full year "}
                          {formatCurrencyWithSymbol(detailRow.amount)}
                        </span>
                      </>
                    ) : (
                      <span className={styles.sheetHeroEmpty}>—</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.sheetClose}
                  onClick={() => setDetailId(null)}
                >
                  Close
                </button>
              </header>

              <div className={styles.sheetBody}>
                {detailRow.expandHint && (
                  <p className={styles.childHint}>{detailRow.expandHint}</p>
                )}

                {detailRow.children.length > 0 && (
                  <section className={styles.sheetSection}>
                    <h3 className={styles.sectionTitle}>
                      Official parts (Treasury)
                    </h3>
                    <ul className={styles.childList}>
                      {(hasIncome
                        ? childContributions
                        : detailRow.children.map((c) => ({
                            id: c.id,
                            label: c.label,
                            amount: 0,
                            parentOutlayShare:
                              detailRow.parentOutlay !== 0
                                ? c.outlay / detailRow.parentOutlay
                                : 0,
                            outlay: c.outlay,
                          }))
                      ).map((child) => {
                        const offset = isOffsetLine(child);
                        return (
                          <li
                            key={child.id}
                            className={`${styles.childRow} ${
                              offset ? styles.childOffset : ""
                            }`}
                          >
                            <div className={styles.childText}>
                              <span className={styles.childLabel}>
                                {child.label}
                              </span>
                              <span className={styles.childShare}>
                                {offset
                                  ? "Money the government collected here (lowers the category’s total)"
                                  : `${formatPercentage(
                                      Math.abs(child.parentOutlayShare),
                                      1
                                    )} of this category`}
                              </span>
                            </div>
                            <div className={styles.childAmounts}>
                              <span className={styles.childYtd}>
                                {hasIncome ? (
                                  <LiveCurrency
                                    amount={yearToDateAmount(
                                      child.amount,
                                      now,
                                      taxYear
                                    )}
                                  />
                                ) : (
                                  "—"
                                )}
                              </span>
                              {hasIncome && (
                                <span className={styles.childFull}>
                                  yr {formatCurrencyWithSymbol(child.amount)}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <p className={styles.childSource}>
                      Source: Treasury MTS Table 9A. A minus sign means this
                      line brought money in (or reduced spending), not that you
                      personally owe a negative tax.
                    </p>
                  </section>
                )}

                {hasCountryAid && countryAid && (
                  <section className={styles.sheetSection}>
                    <h3 className={styles.sectionTitle}>
                      Aid by country · FY{countryAid.fiscalYear}
                    </h3>
                    <p className={styles.childHint}>
                      Your International Affairs estimate is split by each
                      recipient&apos;s share of ForeignAssistance.gov{" "}
                      <em>disbursements</em> (top{" "}
                      {countryAid.countries.length}). Those totals are not
                      identical to MTS International Affairs outlays —
                      illustrative only.
                    </p>
                    <ul className={styles.childList}>
                      {countryContributions.map((c) => (
                        <li key={c.id} className={styles.childRow}>
                          <div className={styles.childText}>
                            <span className={styles.childLabel}>{c.label}</span>
                            <span className={styles.childShare}>
                              {formatPercentage(c.shareOfAid, 1)} of listed FA
                              disbursements · gov{" "}
                              {formatCurrencyWithSymbol(c.disbursements)}
                            </span>
                          </div>
                          <div className={styles.childAmounts}>
                            <span className={styles.childYtd}>
                              {hasIncome ? (
                                <LiveCurrency
                                  amount={yearToDateAmount(
                                    c.amount,
                                    now,
                                    taxYear
                                  )}
                                />
                              ) : (
                                "—"
                              )}
                            </span>
                            {hasIncome && (
                              <span className={styles.childFull}>
                                yr {formatCurrencyWithSymbol(c.amount)}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className={styles.childSource}>
                      Source:{" "}
                      <a
                        href={countryAid.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        ForeignAssistance.gov
                      </a>{" "}
                      (U.S. Government Work — cite ForeignAssistance.gov)
                    </p>
                  </section>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
