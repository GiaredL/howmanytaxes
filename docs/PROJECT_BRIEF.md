# HowManyTaxes — Project Brief for Agents

**Read this file before making product, calculation, or data-source changes.**  
Last updated: 2026-10-08

---

## 1. Product purpose

Help people understand **how their federal tax contributions map onto real U.S. government programs**.

A user enters facts such as filing status, income, and employment type (e.g. married filing jointly, $100k/year, W-2 employee). The app should return an **accurate, source-backed breakdown** of what that person’s federal taxes effectively fund — Social Security, Medicare, defense, net interest, veterans, transportation, education, etc.

This is an **informational estimator**, not tax, legal, or financial advice. Always keep a clear disclaimer in the UI.

---

## 2. Core user journey (target)

1. User enters:
   - Tax year (default: current filing year)
   - Filing status (single, MFJ, MFS, HoH)
   - Gross income (and later: earned vs unearned split)
   - Employment type: W-2 employee / self-employed / mixed
   - Optional: itemized deductions total (use only if higher than standard); later: credits, etc.
2. App computes:
   - Estimated **federal income tax**
   - Estimated **payroll / self-employment taxes** (OASDI + HI + Additional Medicare when applicable)
3. App allocates those dollars to programs using **official outlays / financing rules** (not vibes).
4. User sees:
   - Total federal tax estimate
   - Per-program contribution (dollars and % of their federal tax)
   - Source + fiscal year for every spending number
   - Explicit notes where income tax and payroll taxes fund different things

---

## 3. Accuracy principles (non-negotiable)

### 3.1 Prefer official sources

Spending and revenue figures must come from **U.S. government primary sources** whenever possible:

| Need | Preferred source | Notes |
|------|------------------|--------|
| Outlays by budget function | Treasury Fiscal Data — Monthly Treasury Statement (MTS) Table 9 | Live API; FYTD and prior-year figures |
| Outlays by function/subfunction | MTS Table 9 functions/subfunctions; OMB Historical Tables 3.1 / 3.2 | Use for finer breakdowns |
| Final fiscal-year totals | Treasury Combined Statement; OMB Historical Tables | Prefer completed FY actuals over projections |
| Agency / award-level detail | [USAspending.gov](https://www.usaspending.gov) API | Good for agency drill-downs; **not** the best top-level “share of my income tax” denominator |
| Individual income tax brackets & standard deduction | [IRS](https://www.irs.gov/filing/federal-income-tax-rates-and-brackets) | Update each tax year |
| OASDI wage base | [SSA contribution and benefit base](https://www.ssa.gov/oact/cola/cbb.html) | Annual |
| FICA / SECA rates | SSA / IRS Publication 15 / Schedule SE instructions | Statutory rates |

**Do not hardcode stale program budgets without labeling the fiscal year and source URL.**

### 3.2 Separate funding streams

Federal programs are **not** all funded the same way. Treating every program as a proportional slice of “income tax paid” is **incorrect** for Social Security and much of Medicare.

| Stream | What funds it | How the user pays |
|--------|---------------|-------------------|
| **General fund programs** (defense, interest, veterans, transportation, most education, agriculture, much of health/Medicaid, etc.) | Mostly individual + corporate income taxes, excise, borrowing | User’s **federal income tax** (and share of deficit financing — see open questions) |
| **Social Security (OASDI)** | Dedicated payroll taxes credited to trust funds; small other income | Employee 6.2% + employer 6.2% on wages up to wage base; self-employed **12.4%** SECA (on 92.35% of net earnings), subject to same wage base |
| **Medicare HI (Part A)** | Dedicated payroll taxes | Employee/employer 1.45% each (no wage base); self-employed **2.9%**; Additional Medicare Tax 0.9% on high earners (employee-only / SECA rules) |
| **Medicare SMI (Parts B/D)** | Mostly **general revenues** + premiums | Appropriately tied partly to **income tax / general fund**, not only FICA |

**Product rule:** Show Social Security and Medicare HI primarily from the user’s **payroll / SE tax**, not as a slice of income tax. Show general-fund programs from income-tax (and clearly disclose methodology). Medicare SMI may use a hybrid model once financing shares are sourced.

### 3.3 Self-employed vs employee (required special case)

| Topic | Employee (W-2) | Self-employed |
|-------|----------------|---------------|
| Social Security | 6.2% employee share (employer pays matching 6.2%; whether to attribute employer share to the user is a product decision — see §8) | 12.4% SECA on net earnings × 92.35%, up to wage base |
| Medicare HI | 1.45% employee (+ employer 1.45%) | 2.9% SECA |
| Income tax interaction | Standard W-2 withholding model | Deduct **½ of SE tax** when computing income tax (Schedule 1) |
| Wage base | Applies to OASDI wages | Same base; track combined W-2 + SE earnings so the cap is not double-applied incorrectly |

Wage bases (keep current in data config):

- 2025 OASDI base: **$176,100**
- 2026 OASDI base: **$184,500**

### 3.4 Be honest about approximations

v1 may omit credits, AMT, NIIT, capital gains stacking, Schedule A line validation, etc. Optional itemized is a single total vs standard (take the greater). Every omission must be listed in the UI. Never imply IRS-level precision.

---

## 4. Recommended calculation models

### Model A — Dual-ledger (target architecture)

1. **Income-tax ledger**  
   `user_income_tax` × (`program_outlay / general_fund_financed_outlays_or_income_tax_receipts`)  
   Use for programs financed from the general fund.

2. **Payroll ledger**  
   - User OASDI tax → Social Security  
   - User HI tax → Medicare Hospital Insurance  
   Optionally split Medicare further once HI vs SMI financing shares are loaded from trustees / OMB tables.

3. **Combined view**  
   Present both ledgers, then a combined “your federal tax dollars” total so users see the full picture.

### Model B — Current app (legacy; replace)

```
contribution = (userIncomeTax / totalFederalIncomeTaxReceipts) × programOutlays
```

Problems today:

- Applies income-tax proportional allocation even to Social Security / Medicare (misleading).
- Hardcoded budgets in `src/app/constants/budgets.ts` with unclear vintage.
- `totalTaxDollars = 5.2e12` is a rough constant, not a sourced receipt total.
- Tax brackets / standard deduction are **TY2024-ish** and already stale vs IRS 2025/2026.
- Disclaimer in `Calculation.tsx` already admits payroll taxes are missing — implement that gap.

---

## 5. Official data fetching plan

### 5.0 Legal & safe use (verified before requesting)

Only call **official public** government open-data endpoints. Do not scrape authenticated, private, or paywalled systems.

| Source | Legal basis | Access | Safe-use rules |
|--------|-------------|--------|----------------|
| **Treasury Fiscal Data API** (`api.fiscaldata.treasury.gov`) | Official open data; [API docs](https://fiscaldata.treasury.gov/api-documentation/) state data is **free, without restriction**, usable for commercial or non-commercial purposes (U.S. Government work) | No API key | Cache responses; cite source; do **not** imply Treasury endorsement; avoid abusive request rates |
| **IRS** brackets / deductions | Public IRS publications & Rev. Procs | Manual/config (no live scrape required) | Version by tax year; link to IRS pages in UI |
| **SSA** OASDI wage base | Public SSA OACT tables | Manual/config | Version by calendar year |
| **ForeignAssistance.gov** (`foreignassistance.gov/api/...`) | U.S. Government Work, free of copyright ([About](https://foreignassistance.gov/about)); cite “ForeignAssistance.gov” | Public API, no key | Cache; cite source; no State Dept endorsement; FA disbursements ≠ MTS International Affairs outlays — label methodology |
| **USAspending** (optional later) | Federal open-data API | Public | Same cache/cite/no-endorsement rules |

**Agent rule:** Before adding a new external data source, confirm it is public, document terms in this section, and prefer cache + fixture fallback over uncached live calls on every page view.

### 5.1 Primary API — Treasury Fiscal Data (MTS)

Base URL:

`https://api.fiscaldata.treasury.gov/services/api/fiscal_service`

Useful endpoints:

| Endpoint | Use |
|----------|-----|
| `/v1/accounting/mts/mts_table_9` | Receipts by source + **outlays by function** |
| `/v1/accounting/mts/mts_table_9_outlays_functions_subfunctions` | Finer program categories |
| `/v1/accounting/mts/mts_table_4` | Receipts detail (individual income tax, etc.) |
| `/v1/accounting/mts/mts_table_5` | Outlays by agency/account detail |
| `/v1/accounting/mts/mts_table_8` | Trust fund impact |

Example (encode `page[size]` as `page%5Bsize%5D`):

```
GET .../mts_table_9?filter=record_date:eq:2026-08-31,data_type_cd:eq:D&sort=src_line_nbr&page%5Bsize%5D=100
```

Implementation notes:

- Values are currency amounts; confirm units when parsing (API returns full dollar amounts in practice — validate against published MTS PDFs).
- Prefer the **latest completed fiscal year** for “annual” shares; use FYTD only when labeled as YTD.
- Cache responses (Next.js route handler or build-time sync). Do not hit Treasury on every page view uncached.
- Store `record_date`, fiscal year, and source URL with the cached payload.

### 5.2 Secondary — OMB Historical Tables

- Table 3.1 / 3.2: outlays by function/subfunction (excellent annual series).
- Trust fund tables for Social Security / Medicare cash income & outgo.
- Often published as downloadable XLSX on whitehouse.gov / govinfo.gov — good for yearly refresh scripts.

### 5.3 Secondary — USAspending

- Useful for agency-level exploration and “where does Defense money go?” style drill-downs.
- **Do not** use obligated awards alone as the denominator for “share of my income tax” without reconciling to unified budget outlays.

### 5.4 Tax parameter sources (refresh annually)

| Parameter | Source |
|-----------|--------|
| Brackets & standard deduction | IRS inflation adjustments / Rev. Procs |
| OASDI wage base | SSA OACT |
| FICA/SECA rates | Statute (stable) + Additional Medicare thresholds |
| Additional Medicare Tax thresholds | IRS (e.g. $200k single / $250k MFJ — verify each year) |

Keep tax parameters in versioned config, e.g. `src/app/constants/taxYears/2025.ts`, `2026.ts`.

---

## 6. Budget functions to support (minimum set)

Align labels with MTS / OMB function names where possible:

1. Social Security  
2. Medicare (split HI vs SMI when data allows)  
3. Health (incl. Medicaid / CHIP — general fund heavy)  
4. Income Security  
5. National Defense  
6. Net Interest  
7. Veterans Benefits and Services  
8. Transportation  
9. Education, Training, Employment, and Social Services  
10. Agriculture  
11. International Affairs (optional; avoid one-off country “aid” line items unless sourced as explicit outlays)  
12. Other / residual (so shares sum coherently)

**Avoid** presenting unverified single-line geopolitics figures (e.g. “Israel aid”) as peer categories to OMB functions unless they are clearly subset drill-downs with a primary source.

---

## 7. Current codebase snapshot (as of this brief)

| Area | Location | Status |
|------|----------|--------|
| UI calculator | `src/app/page.tsx` | Single-program selector; income + filing status only |
| Income tax calc | `src/app/utils/taxCalculations.ts` | Progressive brackets + standard deduction; no payroll/SE |
| Brackets | `src/app/constants/taxBrackets.ts` | Stale vs IRS 2025/2026 |
| Budgets | `src/app/constants/budgets.ts` | Hardcoded; needs FY + source metadata |
| Methodology copy | `src/app/components/Calculation.tsx` | Documents Model B; notes SS/Medicare caveat |
| Auth gate | password hard-coded in `page.tsx` | Dev-only; remove before public launch |

---

## 8. Product decisions to resolve while building

Track answers here as they are decided:

1. **Employer FICA share:** Attribute only the employee 7.65%, or also show “total labor cost” including employer match?  
   - Recommendation: default to **employee-paid** amounts; optional toggle for “including employer share.”
2. **Deficit financing:** Should general-fund program shares be based on (a) income tax receipts only, (b) all general receipts, or (c) outlays including deficit (user “funds X% of spending” narrative)?  
   - Recommendation: start with **(a) for “your income tax dollars”** and disclose that deficits also finance spending.
3. **Default tax year:** Calendar year of income vs current filing season.  
4. **Medicare presentation:** One bucket vs HI (payroll) + SMI (general fund).  
5. **State/local taxes:** Out of scope for v1 (federal only).

---

## 9. Implementation roadmap

### Phase 0 — Spec & agent alignment (this doc)

- [x] Capture purpose, methodology, sources  
- [x] Link this brief from agent rules / README  

### Phase 1 — Data layer

- [x] Add Treasury MTS client (server-side) with cache + metadata  
- [x] Map MTS function rows → app program IDs  
- [x] Replace hardcoded `budgets` / `totalTaxDollars` with sourced FY actuals  
- [x] Unit tests: parser fixtures from a known MTS month  

### Phase 2 — Tax engine

- [x] Versioned tax-year configs (2025, 2026+)  
- [x] Payroll tax module (employee + self-employed; mixed wages+SE still open)  
- [x] SE tax ↔ income tax deduction interaction  
- [x] Additional Medicare Tax  
- [x] Golden-file tests against hand-calculated examples (e.g. MFJ $100k W-2)  

### Phase 3 — Allocation UX

- [x] Full breakdown view (all major functions), not only one program button  
- [x] Dual-ledger explanation (income tax vs payroll)  
- [x] Nested OMB/MTS subfunctions under parent programs (expandable cards)  
- [x] Country-level foreign aid (ForeignAssistance.gov) under International Affairs  
- [ ] Agency / award drill-downs (USAspending) for subsidies & procurement  
- [ ] Source footnotes per number (agency, FY, URL, retrieved date)  

### Phase 4 — Hardening

- [x] Remove password gate / replace with real access control if needed  
- [ ] Refresh job or documented manual refresh for MTS + IRS params  
- [ ] Accessibility + mobile polish  
- [ ] Stronger public disclaimer  

---

## 10. Worked example (sanity check target)

**User:** Married filing jointly, $100,000 W-2 wages, no other income, standard deduction, tax year 2025.

Rough expectations (order-of-magnitude; implement exact numbers from configs):

1. Taxable income ≈ `$100,000 − $31,500` standard deduction (TY2025 MFJ under OBBB figures — verify against IRS).  
2. Income tax from progressive brackets on that taxable income.  
3. Employee FICA: OASDI `6.2% × $100,000` + HI `1.45% × $100,000` (under wage base).  
4. **Social Security contribution shown ≈ OASDI payroll tax**, not `(incomeTax / totalIncomeTax) × SS outlays`.  
5. **Defense / interest / veterans** shown from income-tax ledger using official outlay shares.

Add this scenario (and a self-employed twin) as automated regression tests.

---

## 11. Agent working rules for this repo

1. **Read this brief** before changing tax math, budgets, or methodology copy.  
2. **Cite sources** in code comments or data metadata (`source`, `fiscalYear`, `retrievedAt`, `url`).  
3. **Do not invent** program dollar amounts. If an API is down, fall back to the last cached official snapshot and label it.  
4. Prefer **function-level OMB/MTS categories** over ad-hoc political line items.  
5. Keep calculations **pure and testable** in `utils/` (or a future `lib/tax/` module); keep React components thin.  
6. When tax law or SSA bases update, bump the tax-year config — do not silently edit “the” brackets file without a year.  
7. Preserve the educational tone: transparent methodology > flashy false precision.

---

## 12. Key external links

- Treasury Fiscal Data API docs: https://fiscaldata.treasury.gov/api-documentation/  
- Monthly Treasury Statement dataset: https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/  
- OMB Historical Tables: https://www.whitehouse.gov/omb/information-resources/budget/historical-tables/  
- IRS tax rates & brackets: https://www.irs.gov/filing/federal-income-tax-rates-and-brackets  
- SSA contribution & benefit base: https://www.ssa.gov/oact/cola/cbb.html  
- USAspending: https://www.usaspending.gov/  
- Medicare financing overview (secondary explainer): Tax Policy Center / Medicare Trustees reports  

---

## 13. Open research backlog

- [ ] Confirm exact MTS field filters for year-end function outlays vs monthly FYTD.  
- [ ] Obtain official HI vs SMI financing shares for hybrid Medicare allocation.  
- [ ] Decide deficit-financing narrative for general-fund programs.  
- [ ] Evaluate whether corporate income tax / excise should shrink the “individual income tax paid for program X” story.  
- [ ] Map USAspending agencies → OMB functions for optional drill-down.  
- [ ] Document Combined Statement PDF scrape vs API preference for closed fiscal years.
