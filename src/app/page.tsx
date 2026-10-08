"use client";
import { useState, useEffect, FormEvent, useId } from "react";
import { createPortal } from "react-dom";
import styles from "./page.module.scss";
import {
  budgetMeta as staticBudgetMeta,
  budgets as fallbackBudgets,
  subBudgets as fallbackSubBudgets,
  totalFunctionOutlays as fallbackTotalFunctionOutlays,
  totalTaxDollars as fallbackTotalTaxDollars,
} from "./constants/budgets";
import { PROGRAM_OPTIONS } from "./constants/programs";
import {
  DISCLAIMER_COMPACT,
  DISCLAIMER_ESTIMATE,
  DISCLAIMER_NOT_AFFILIATED,
  DISCLAIMER_SOURCES,
} from "./constants/disclaimers";
import type { CountryAidSnapshot } from "@/lib/fiscal/foreignAidClient";
import fallbackCountryAid from "@/lib/fiscal/__fixtures__/country-aid-snapshot-fy2025.json";
import type { ProgramId, SubProgramOutlay } from "@/lib/fiscal/types";
import type { EmploymentType, FilingStatus } from "@/lib/tax/types";
import { DEFAULT_TAX_YEAR } from "@/lib/tax/taxYears";
import { yearToDateAmount } from "@/lib/tax/yearProgress";
import {
  estimateProgramContributionForUi,
  estimateTaxesForUi,
  getStandardDeduction,
} from "./utils/taxCalculations";
import { formatCurrencyWithSymbol } from "./utils/formatters";
import { useNow } from "./hooks/useNow";
import Calculation from "./components/Calculation";
import ContributionCards, {
  type ContributionRow,
} from "./components/ContributionCards";
import ContributionStats from "./components/ContributionStats";
import AllocationTree from "./components/AllocationTree";
import LiveCurrency from "./components/LiveCurrency";

const FILING_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  "married-jointly": "Married filing jointly",
  "married-separately": "Married filing separately",
  "head-of-household": "Head of household",
};

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  employee: "Employee (W-2)",
  "self-employed": "Self-employed",
};

export default function Home() {
  const now = useNow(1000);
  const editTitleId = useId();
  const [income, setIncome] = useState("");
  const [spouseIncome, setSpouseIncome] = useState("");
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [employmentType, setEmploymentType] =
    useState<EmploymentType>("employee");
  const [itemizedDeductions, setItemizedDeductions] = useState("");
  const [taxYear] = useState(DEFAULT_TAX_YEAR);
  const [showResults, setShowResults] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formError, setFormError] = useState("");
  const [selected, setSelected] = useState<ProgramId | null>(null);
  const [graphOpen, setGraphOpen] = useState(false);
  const [budgets, setBudgets] = useState(fallbackBudgets);
  const [subBudgets, setSubBudgets] = useState(fallbackSubBudgets);
  const [totalTaxDollars, setTotalTaxDollars] = useState(
    fallbackTotalTaxDollars,
  );
  const [totalFunctionOutlays, setTotalFunctionOutlays] = useState(
    fallbackTotalFunctionOutlays,
  );
  const [budgetMeta, setBudgetMeta] = useState(staticBudgetMeta);
  const [countryAid, setCountryAid] = useState<CountryAidSnapshot | null>(
    fallbackCountryAid as CountryAidSnapshot,
  );

  const incomeNum = Number.parseFloat(income) || 0;
  const spouseNum = Number.parseFloat(spouseIncome) || 0;
  const itemizedNum = Number.parseFloat(itemizedDeductions);
  const hasItemizedEntry =
    itemizedDeductions.trim() !== "" && Number.isFinite(itemizedNum);
  const isMfjEmployee =
    filingStatus === "married-jointly" && employmentType === "employee";
  const standardDeduction = getStandardDeduction(filingStatus, taxYear);

  const taxEstimate =
    showResults && (incomeNum > 0 || (isMfjEmployee && spouseNum > 0))
      ? estimateTaxesForUi({
          income: incomeNum,
          spouseIncome: isMfjEmployee ? spouseNum : 0,
          filingStatus,
          employmentType,
          taxYear,
          itemizedDeductions: hasItemizedEntry ? itemizedNum : undefined,
        })
      : null;

  const contributionRows: ContributionRow[] = PROGRAM_OPTIONS.map((program) => {
    const outlay =
      typeof budgets[program.value] === "number" ? budgets[program.value] : 0;
    const children: SubProgramOutlay[] = subBudgets[program.value] ?? [];
    const contribution = taxEstimate
      ? estimateProgramContributionForUi({
          taxes: taxEstimate,
          programId: program.value,
          programOutlay: outlay,
          totalIndividualIncomeTaxReceipts: totalTaxDollars,
        })
      : null;

    return {
      programId: program.value,
      label: program.label,
      amount: contribution?.amount ?? 0,
      ledger: contribution?.ledger ?? program.ledger,
      parentOutlay: outlay,
      children,
      expandHint:
        outlay < 0
          ? "This category took in more money than it spent this year, so the official total is negative. That doesn’t mean you get money back."
          : program.expandHint,
    };
  }).sort((a, b) => b.amount - a.amount);

  const incomeTaxPrograms = contributionRows.filter(
    (r) => r.ledger === "income-tax",
  );
  const payrollPrograms = contributionRows.filter(
    (r) => r.ledger === "payroll-oasdi" || r.ledger === "payroll-hi",
  );

  const selectedRow = contributionRows.find((r) => r.programId === selected);
  const selectedMeta = PROGRAM_OPTIONS.find((p) => p.value === selected);
  const hasResults = Boolean(taxEstimate);

  const wageLabel =
    employmentType === "self-employed"
      ? "Your net self-employment income"
      : isMfjEmployee
        ? "Your yearly W-2 wages"
        : "Yearly W-2 wages";

  function handleCalculate(e?: FormEvent) {
    e?.preventDefault();
    if (!(incomeNum > 0 || (isMfjEmployee && spouseNum > 0))) {
      setFormError(
        isMfjEmployee
          ? "Enter your wages and/or your spouse’s wages to continue."
          : "Enter your yearly income to continue.",
      );
      return;
    }
    setFormError("");
    setShowResults(true);
    setEditOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function handleStartOver() {
    setShowResults(false);
    setEditOpen(false);
    setSelected(null);
    setGraphOpen(false);
    setFormError("");
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch("/api/budget")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.budgets && typeof data.totalTaxDollars === "number") {
          setBudgets(data.budgets);
          setTotalTaxDollars(data.totalTaxDollars);
          if (typeof data.totalFunctionOutlays === "number") {
            setTotalFunctionOutlays(data.totalFunctionOutlays);
          }
          if (data.subBudgets) {
            setSubBudgets(data.subBudgets);
          }
          if (data.meta) {
            setBudgetMeta(data.meta);
          }
        }
      })
      .catch(() => {
        /* keep static fallback from official FY snapshot */
      });

    fetch("/api/foreign-aid")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.countries?.length) {
          setCountryAid(data);
        }
      })
      .catch(() => {
        /* keep ForeignAssistance.gov fixture fallback */
      });
  }, []);

  useEffect(() => {
    if (!graphOpen && !editOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (editOpen) setEditOpen(false);
      else if (graphOpen) setGraphOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [graphOpen, editOpen]);

  const inputFields = (
    <>
      <label className={styles.field}>
        <span>{wageLabel}</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={1000}
          value={income}
          onChange={(e) => {
            setIncome(e.target.value);
            setFormError("");
          }}
          placeholder="e.g. 100000"
        />
      </label>

      {isMfjEmployee && (
        <label className={styles.field}>
          <span>Spouse’s yearly W-2 wages</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={1000}
            value={spouseIncome}
            onChange={(e) => {
              setSpouseIncome(e.target.value);
              setFormError("");
            }}
            placeholder="e.g. 100000"
          />
        </label>
      )}

      <label className={styles.field}>
        <span>Filing status</span>
        <select
          value={filingStatus}
          onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
        >
          <option value="single">Single</option>
          <option value="married-jointly">Married filing jointly</option>
          <option value="married-separately">Married filing separately</option>
          <option value="head-of-household">Head of household</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>How you earn</span>
        <select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
        >
          <option value="employee">Employee (W-2)</option>
          <option value="self-employed">Self-employed</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Itemized deductions (optional)</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={500}
          value={itemizedDeductions}
          onChange={(e) => setItemizedDeductions(e.target.value)}
          placeholder={`Leave blank for standard (${formatCurrencyWithSymbol(standardDeduction)})`}
        />
      </label>
    </>
  );

  const deductionNote = (
    <p className={styles.deductionNote}>
      {taxYear} standard deduction for your filing status:{" "}
      <strong>{formatCurrencyWithSymbol(standardDeduction)}</strong>
      {hasItemizedEntry && itemizedNum > standardDeduction
        ? " · Using your itemized amount (higher than standard)."
        : hasItemizedEntry && itemizedNum <= standardDeduction
          ? " · Your itemized entry is at or below standard, so we still use the standard deduction."
          : " · Leave itemized blank unless yours is higher."}
    </p>
  );

  const inputForm = (
    <form className={styles.inputForm} onSubmit={handleCalculate}>
      <div className={styles.zeroFields}>{inputFields}</div>
      {deductionNote}

      {isMfjEmployee && (
        <p className={styles.hint}>
          Married filing jointly: enter each spouse’s wages separately. Income
          tax uses the combined total; Social Security applies the wage base to
          each person.
        </p>
      )}

      {formError && <p className={styles.formError}>{formError}</p>}

      <button type="submit" className={styles.calculateBtn}>
        {showResults ? "Update breakdown" : "Calculate my breakdown"}
      </button>
      <p className={styles.formDisclaimer}>{DISCLAIMER_COMPACT}</p>
    </form>
  );

  const deductionSummary = taxEstimate
    ? taxEstimate.incomeTax.usedItemized
      ? `Itemized ${formatCurrencyWithSymbol(taxEstimate.incomeTax.deductionTaken)}`
      : `Standard ${formatCurrencyWithSymbol(taxEstimate.incomeTax.deductionTaken)}`
    : `Standard ${formatCurrencyWithSymbol(standardDeduction)}`;

  return (
    <div className={`${styles.page} ${showResults ? styles.pageResults : ""}`}>
      <header className={styles.topBar}>
        <span className={styles.brand}>HowManyTaxes</span>
        {hasResults && (
          <button
            type="button"
            className={styles.graphToggle}
            onClick={() => setGraphOpen(true)}
            aria-haspopup="dialog"
            title="Open allocation graph"
          >
            <svg
              className={styles.graphIcon}
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M4 4h2v16H4V4zm5 8h2v8H9v-8zm5-5h2v13h-2V7zm5 3h2v10h-2V10z"
              />
            </svg>
            Graph view
          </button>
        )}
      </header>

      <main className={styles.mainContainer}>
        {!showResults ? (
          <section className={styles.zeroState} aria-label="Get started">
            <div className={styles.zeroCopy}>
              <h1>
                How much of{" "}
                <span className={styles.animatedWords}>your taxes</span> go
                where?
              </h1>
              <p>
                Enter a few details to see a rough picture of how your federal
                taxes might map to government programs.
              </p>
              <p className={styles.heroDisclaimer}>{DISCLAIMER_ESTIMATE}</p>
            </div>

            <div className={styles.zeroForm}>
              {inputForm}
              <p className={styles.zeroMetaDetail}>
                {DISCLAIMER_SOURCES} Tax year {taxYear}; spending snapshot FY
                {budgetMeta.fiscalYear}. {DISCLAIMER_NOT_AFFILIATED}
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className={styles.resultsHeader} aria-label="Your inputs">
              <div className={styles.toolbarIntro}>
                <h1 className={styles.resultsTitle}>Your breakdown</h1>
                <p className={styles.resultsDisclaimer}>
                  {DISCLAIMER_ESTIMATE} Tax year {taxYear}
                  {taxEstimate?.payroll.oasdiCapped
                    ? ` · Social Security wages capped at $${taxEstimate.payroll.socialSecurityWageBaseUsed.toLocaleString()}`
                    : ""}
                </p>
                <p className={styles.resultsDisclaimerSecondary}>
                  {DISCLAIMER_SOURCES} Spending figures use public U.S. Treasury
                  data (FY{budgetMeta.fiscalYear}). {DISCLAIMER_NOT_AFFILIATED}
                </p>
              </div>

              <div className={styles.inputSummary}>
                <dl className={styles.summaryFacts}>
                  <div>
                    <dt>{isMfjEmployee ? "Your wages" : "Income"}</dt>
                    <dd>{formatCurrencyWithSymbol(incomeNum)}</dd>
                  </div>
                  {isMfjEmployee && (
                    <div>
                      <dt>Spouse wages</dt>
                      <dd>{formatCurrencyWithSymbol(spouseNum)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Filing</dt>
                    <dd>{FILING_LABELS[filingStatus]}</dd>
                  </div>
                  <div>
                    <dt>Work</dt>
                    <dd>{EMPLOYMENT_LABELS[employmentType]}</dd>
                  </div>
                  <div>
                    <dt>Deduction</dt>
                    <dd>{deductionSummary}</dd>
                  </div>
                </dl>
                <div className={styles.summaryActions}>
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={() => {
                      setFormError("");
                      setEditOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.startOverBtn}
                    onClick={handleStartOver}
                  >
                    Start over
                  </button>
                </div>
              </div>
            </section>

            {taxEstimate && (
              <div className={`${styles.summaryStrip} ${styles.fadeIn}`}>
                <div className={styles.summaryItem}>
                  <span>Income tax · this year</span>
                  <strong>
                    <LiveCurrency
                      amount={yearToDateAmount(
                        taxEstimate.incomeTax.incomeTax,
                        now,
                        taxYear,
                      )}
                    />
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>
                    Payroll
                    {employmentType === "employee" ? " (employee)" : " / SE"} ·
                    this year
                  </span>
                  <strong>
                    <LiveCurrency
                      amount={yearToDateAmount(
                        taxEstimate.payroll.totalPayrollTax,
                        now,
                        taxYear,
                      )}
                    />
                  </strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>Total federal · this year</span>
                  <strong className={styles.summaryTotal}>
                    <LiveCurrency
                      amount={yearToDateAmount(
                        taxEstimate.totalFederalTax,
                        now,
                        taxYear,
                      )}
                    />
                  </strong>
                </div>
                {selectedRow && (
                  <div className={styles.summaryItem}>
                    <span>Selected · {selectedMeta?.label}</span>
                    <strong className={styles.summarySelected}>
                      <LiveCurrency
                        amount={yearToDateAmount(
                          selectedRow.amount,
                          now,
                          taxYear,
                        )}
                      />
                    </strong>
                  </div>
                )}
              </div>
            )}

            {taxEstimate &&
              taxEstimate.incomeTax.incomeTax === 0 &&
              taxEstimate.payroll.totalPayrollTax > 0 && (
                <p className={`${styles.hint} ${styles.fadeIn}`}>
                  Deductions can wipe out income tax, but Social Security and
                  Medicare payroll taxes are still based on wages (or SE
                  earnings) — they aren’t reduced by itemizing.
                </p>
              )}

            <div className={styles.fadeInSlow}>
              <ContributionCards
                rows={contributionRows}
                selected={selected}
                onSelect={setSelected}
                hasIncome={hasResults}
                taxYear={taxYear}
                now={now}
                countryAid={countryAid}
                layout="full"
              />
            </div>

            {taxEstimate && (
              <div className={styles.fadeInSlower}>
                <ContributionStats
                  taxes={taxEstimate}
                  totalIndividualIncomeTaxReceipts={totalTaxDollars}
                  totalFunctionOutlays={totalFunctionOutlays}
                  spendingFiscalYear={budgetMeta.fiscalYear}
                  internationalAffairsAmount={
                    contributionRows.find(
                      (r) => r.programId === "internationalAffairs",
                    )?.amount ?? 0
                  }
                  countryAid={countryAid}
                />
              </div>
            )}

            <div className={styles.fadeInSlower}>
              <Calculation />
            </div>
          </>
        )}
      </main>

      {mounted &&
        editOpen &&
        createPortal(
          <div
            className={styles.editOverlay}
            role="presentation"
            onClick={() => setEditOpen(false)}
          >
            <div
              className={styles.editSheet}
              role="dialog"
              aria-modal="true"
              aria-labelledby={editTitleId}
              onClick={(e) => e.stopPropagation()}
            >
              <header className={styles.editSheetHeader}>
                <h2 id={editTitleId}>Edit your details</h2>
                <button
                  type="button"
                  className={styles.graphClose}
                  onClick={() => setEditOpen(false)}
                >
                  Close
                </button>
              </header>
              {inputForm}
            </div>
          </div>,
          document.body,
        )}

      {graphOpen && hasResults && (
        <div
          className={styles.graphOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Allocation graph view"
        >
          <div className={styles.graphSheet}>
            <div className={styles.graphSheetHeader}>
              <h2>Allocation graph</h2>
              <button
                type="button"
                className={styles.graphClose}
                onClick={() => setGraphOpen(false)}
              >
                Close
              </button>
            </div>
            <AllocationTree
              taxes={taxEstimate}
              incomeTaxPrograms={incomeTaxPrograms}
              payrollPrograms={payrollPrograms}
              selected={selected}
              onSelect={setSelected}
              taxYear={taxYear}
              now={now}
              countryAid={countryAid}
            />
          </div>
        </div>
      )}
    </div>
  );
}
