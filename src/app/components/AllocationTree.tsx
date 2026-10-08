"use client";

import { useRef, useState } from "react";
import type { CountryAidSnapshot } from "@/lib/fiscal/foreignAidClient";
import type { ProgramId } from "@/lib/fiscal/types";
import type { FederalTaxResult } from "@/lib/tax/types";
import {
  allocateCountryAidContributions,
  allocateSubProgramContributions,
} from "@/lib/tax/allocate";
import { yearToDateAmount } from "@/lib/tax/yearProgress";
import { formatCurrencyWithSymbol, formatPercentage } from "../utils/formatters";
import type { ContributionRow } from "./ContributionCards";
import LiveCurrency from "./LiveCurrency";
import styles from "./AllocationTree.module.scss";

type Props = {
  taxes: FederalTaxResult | null;
  incomeTaxPrograms: ContributionRow[];
  payrollPrograms: ContributionRow[];
  selected: ProgramId | null;
  onSelect: (id: ProgramId | null) => void;
  taxYear: number;
  now: Date;
  countryAid: CountryAidSnapshot | null;
};

type Point = { x: number; y: number };

type GraphNode = {
  id: string;
  kind: "root" | "branch" | "program" | "sub" | "country" | "section";
  label: string;
  amount: number;
  shareOfParent: number;
  x: number;
  y: number;
  programId?: ProgramId;
  tone: "root" | "income" | "payroll";
  /** Program has subfunctions / country aid that can expand. */
  expandable?: boolean;
  expanded?: boolean;
};

type GraphEdge = {
  id: string;
  d: string;
  share: number;
  tone: "income" | "payroll";
  emphasizes: boolean;
};

type LeafItem = {
  id: string;
  label: string;
  amount: number;
  share: number;
  kind: "sub" | "country" | "section";
};

const ROOT_Y = 48;
const BRANCH_Y = 145;
const PROGRAM_Y = 270;
const NODE_H = 48;
const PROGRAM_H = 52;
/** Vertical gap from program bottom to first child row. */
const CHILD_ROW_GAP = 78;
/** Space between sibling child nodes (must clear ~132px-wide cards). */
const CHILD_GAP = 158;
/** Gap between OMB row and country row under International Affairs. */
const CHILD_ROW_STEP = 96;
const COL_GAP = 148;
const PAD_X = 100;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function strokeForShare(share: number) {
  return clamp(1.5 + share * 18, 1.5, 14);
}

function curvePath(from: Point, to: Point) {
  const midY = (from.y + to.y) / 2;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

function layoutColumns(count: number, centerX: number, gap: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [centerX];
  const width = (count - 1) * gap;
  const left = centerX - width / 2;
  return Array.from({ length: count }, (_, i) => left + i * gap);
}

/** Shrink label type so long names fit the fixed node box. */
function labelFontSize(
  label: string,
  kind: GraphNode["kind"]
): string | undefined {
  const len = label.length;
  if (kind === "sub" || kind === "country") {
    if (len > 42) return "0.46rem";
    if (len > 32) return "0.5rem";
    if (len > 22) return "0.54rem";
    if (len > 14) return "0.58rem";
    return "0.6rem";
  }
  if (kind === "program") {
    if (len > 28) return "0.52rem";
    if (len > 18) return "0.58rem";
    return "0.64rem";
  }
  if (kind === "branch" || kind === "root") {
    return undefined;
  }
  return undefined;
}

function scaleRow(row: ContributionRow, now: Date, taxYear: number): ContributionRow {
  return {
    ...row,
    amount: yearToDateAmount(row.amount, now, taxYear),
  };
}

function leavesForProgram(
  row: ContributionRow,
  countryAid: CountryAidSnapshot | null
): LeafItem[] {
  const leaves: LeafItem[] = [];

  if (row.children.length && row.parentOutlay !== 0) {
    const subs = allocateSubProgramContributions({
      parentUserAmount: row.amount,
      parentOutlay: row.parentOutlay,
      children: row.children,
    });
    if (
      row.programId === "internationalAffairs" &&
      countryAid?.countries.length
    ) {
      leaves.push({
        id: "section-omb",
        label: "OMB subfunctions",
        amount: 0,
        share: 0,
        kind: "section",
      });
    }
    for (const sub of subs) {
      leaves.push({
        id: sub.id,
        label: sub.label,
        amount: sub.amount,
        share: sub.parentOutlayShare,
        kind: "sub",
      });
    }
  }

  if (
    row.programId === "internationalAffairs" &&
    countryAid?.countries.length
  ) {
    leaves.push({
      id: "section-countries",
      label: "Aid by country",
      amount: 0,
      share: 0,
      kind: "section",
    });
    const countries = allocateCountryAidContributions({
      internationalAffairsUserAmount: row.amount,
      countries: countryAid.countries,
      totalDisbursements: countryAid.totalDisbursements,
    });
    for (const c of countries) {
      leaves.push({
        id: `country-${c.id}`,
        label: c.label,
        amount: c.amount,
        share: c.shareOfAid,
        kind: "country",
      });
    }
  }

  return leaves;
}

function buildGraph(
  taxes: FederalTaxResult,
  incomeTaxPrograms: ContributionRow[],
  payrollPrograms: ContributionRow[],
  selected: ProgramId | null,
  countryAid: CountryAidSnapshot | null
): { nodes: GraphNode[]; edges: GraphEdge[]; width: number; height: number } {
  const total = Math.max(taxes.totalFederalTax, 1);
  const incomeAmt = taxes.incomeTax.incomeTax;
  const payrollAmt = taxes.payroll.totalPayrollTax;

  const incomeCols = Math.max(incomeTaxPrograms.length, 1);
  const payrollCols = Math.max(payrollPrograms.length, 1);
  const incomeBlockW = Math.max((incomeCols - 1) * COL_GAP, COL_GAP);
  const payrollBlockW = Math.max((payrollCols - 1) * COL_GAP, COL_GAP);

  const selectedRow =
    [...incomeTaxPrograms, ...payrollPrograms].find(
      (p) => p.programId === selected
    ) ?? null;
  const expandedLeaves = selectedRow
    ? leavesForProgram(selectedRow, countryAid)
    : [];
  const expandedSubs = expandedLeaves.filter((l) => l.kind === "sub");
  const expandedCountries = expandedLeaves.filter((l) => l.kind === "country");
  const widestFan = Math.max(
    expandedSubs.length,
    expandedCountries.length,
    0
  );
  const fanW = widestFan > 1 ? (widestFan - 1) * CHILD_GAP : 0;

  const baseW = incomeBlockW + payrollBlockW + PAD_X * 2 + 220;
  // Provisional width — may grow after we place the fan and normalize bounds
  let width = Math.max(baseW, fanW + PAD_X * 2 + 160);

  const incomeCenter = PAD_X + incomeBlockW / 2;
  const payrollCenter = width - PAD_X - payrollBlockW / 2;

  const childRows =
    expandedSubs.length && expandedCountries.length
      ? 2
      : expandedSubs.length || expandedCountries.length
        ? 1
        : 0;
  const height =
    PROGRAM_Y +
    PROGRAM_H / 2 +
    (childRows > 0 ? CHILD_ROW_GAP + (childRows - 1) * CHILD_ROW_STEP + 70 : 40);

  type RawEdge = {
    id: string;
    from: Point;
    to: Point;
    share: number;
    tone: "income" | "payroll";
    emphasizes: boolean;
  };

  const rawNodes: GraphNode[] = [];
  const rawEdges: RawEdge[] = [];

  const root: GraphNode = {
    id: "root",
    kind: "root",
    label: "Your federal tax",
    amount: taxes.totalFederalTax,
    shareOfParent: 1,
    x: width / 2,
    y: ROOT_Y,
    tone: "root",
  };

  const incomeBranch: GraphNode = {
    id: "income",
    kind: "branch",
    label: "Income tax",
    amount: incomeAmt,
    shareOfParent: incomeAmt / total,
    x: incomeCenter,
    y: BRANCH_Y,
    tone: "income",
  };

  const payrollBranch: GraphNode = {
    id: "payroll",
    kind: "branch",
    label: "Payroll / SE",
    amount: payrollAmt,
    shareOfParent: payrollAmt / total,
    x: payrollCenter,
    y: BRANCH_Y,
    tone: "payroll",
  };

  rawNodes.push(root, incomeBranch, payrollBranch);
  rawEdges.push(
    {
      id: "root-income",
      from: { x: root.x, y: root.y + NODE_H / 2 },
      to: { x: incomeBranch.x, y: incomeBranch.y - NODE_H / 2 },
      share: incomeBranch.shareOfParent,
      tone: "income",
      emphasizes:
        selected != null &&
        incomeTaxPrograms.some((p) => p.programId === selected),
    },
    {
      id: "root-payroll",
      from: { x: root.x, y: root.y + NODE_H / 2 },
      to: { x: payrollBranch.x, y: payrollBranch.y - NODE_H / 2 },
      share: payrollBranch.shareOfParent,
      tone: "payroll",
      emphasizes:
        selected != null &&
        payrollPrograms.some((p) => p.programId === selected),
    }
  );

  function placeChildRow(
    items: LeafItem[],
    parentX: number,
    parentBottomY: number,
    rowY: number,
    programId: ProgramId,
    tone: "income" | "payroll",
    sectionLabel: string | null
  ) {
    if (!items.length) return;

    if (sectionLabel) {
      rawNodes.push({
        id: `section-${programId}-${sectionLabel}`,
        kind: "section",
        label: sectionLabel,
        amount: 0,
        shareOfParent: 0,
        x: parentX,
        y: rowY - 40,
        programId,
        tone,
      });
    }

    const xs = layoutColumns(items.length, parentX, CHILD_GAP);
    items.forEach((leaf, i) => {
      const cx = xs[i];
      rawNodes.push({
        id: `leaf-${programId}-${leaf.id}`,
        kind: leaf.kind === "country" ? "country" : "sub",
        label: leaf.label,
        amount: leaf.amount,
        shareOfParent: leaf.share,
        x: cx,
        y: rowY,
        programId,
        tone,
      });
      rawEdges.push({
        id: `edge-${programId}-${leaf.id}`,
        from: { x: parentX, y: parentBottomY },
        to: { x: cx, y: rowY - 28 },
        share: Math.max(Math.abs(leaf.share), 0.04),
        tone,
        emphasizes: true,
      });
    });
  }

  function addProgramLayer(
    programs: ContributionRow[],
    parent: GraphNode,
    centerX: number,
    tone: "income" | "payroll"
  ) {
    const xs = layoutColumns(programs.length, centerX, COL_GAP);

    programs.forEach((row, i) => {
      const px = xs[i];
      const leaves = leavesForProgram(row, countryAid);
      const expandable = leaves.some((l) => l.kind !== "section");
      const expanded = selected === row.programId && expandable;

      rawNodes.push({
        id: `prog-${row.programId}`,
        kind: "program",
        label: row.label,
        amount: row.amount,
        shareOfParent: parent.amount > 0 ? row.amount / parent.amount : 0,
        x: px,
        y: PROGRAM_Y,
        programId: row.programId,
        tone,
        expandable,
        expanded,
      });
      rawEdges.push({
        id: `${parent.id}-${row.programId}`,
        from: { x: parent.x, y: parent.y + NODE_H / 2 },
        to: { x: px, y: PROGRAM_Y - PROGRAM_H / 2 },
        share: parent.amount > 0 ? row.amount / parent.amount : 0,
        tone,
        emphasizes: expanded,
      });

      if (!expanded) return;

      const subs = leaves.filter((l) => l.kind === "sub");
      const countries = leaves.filter((l) => l.kind === "country");
      const parentBottom = PROGRAM_Y + PROGRAM_H / 2;
      const firstRowY = parentBottom + CHILD_ROW_GAP;

      if (subs.length && countries.length) {
        placeChildRow(
          subs,
          px,
          parentBottom,
          firstRowY,
          row.programId,
          tone,
          "OMB subfunctions"
        );
        placeChildRow(
          countries,
          px,
          parentBottom,
          firstRowY + CHILD_ROW_STEP,
          row.programId,
          tone,
          "Aid by country"
        );
      } else {
        placeChildRow(
          [...subs, ...countries],
          px,
          parentBottom,
          firstRowY,
          row.programId,
          tone,
          null
        );
      }
    });
  }

  addProgramLayer(incomeTaxPrograms, incomeBranch, incomeCenter, "income");
  addProgramLayer(payrollPrograms, payrollBranch, payrollCenter, "payroll");

  // Shift / widen so the horizontal fan never clips off the left/right
  const xs = rawNodes.map((n) => n.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const shift = PAD_X - minX;
  width = Math.max(maxX - minX + PAD_X * 2, baseW);

  const nodes = rawNodes.map((n) => ({ ...n, x: n.x + shift }));
  const edges: GraphEdge[] = rawEdges.map((e) => ({
    id: e.id,
    d: curvePath(
      { x: e.from.x + shift, y: e.from.y },
      { x: e.to.x + shift, y: e.to.y }
    ),
    share: e.share,
    tone: e.tone,
    emphasizes: e.emphasizes,
  }));

  return { nodes, edges, width, height };
}

export default function AllocationTree({
  taxes,
  incomeTaxPrograms,
  payrollPrograms,
  selected,
  onSelect,
  taxYear,
  now,
  countryAid,
}: Props) {
  const [scale, setScale] = useState(0.62);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const zoomBy = (delta: number) => {
    setScale((s) => clamp(Number((s + delta).toFixed(2)), 0.25, 2));
  };

  const resetView = () => {
    setScale(0.62);
    setPan({ x: 0, y: 0 });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(`.${styles.zoomBar}`)) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -0.06 : 0.06);
  };

  if (!taxes) {
    return (
      <section className={styles.panel} aria-label="Allocation tree">
        <header className={styles.panelHeader}>
          <h2>How it splits</h2>
          <p>Enter income to see the tax tree</p>
        </header>
        <div className={styles.emptyGraph}>
          <p className={styles.emptyHint}>
            Federal tax → income / payroll → programs (across) → line items
            (down)
          </p>
        </div>
      </section>
    );
  }

  const ytdTaxes: FederalTaxResult = {
    ...taxes,
    incomeTax: {
      ...taxes.incomeTax,
      incomeTax: yearToDateAmount(taxes.incomeTax.incomeTax, now, taxYear),
    },
    payroll: {
      ...taxes.payroll,
      totalPayrollTax: yearToDateAmount(
        taxes.payroll.totalPayrollTax,
        now,
        taxYear
      ),
      oasdiTax: yearToDateAmount(taxes.payroll.oasdiTax, now, taxYear),
      hiTax: yearToDateAmount(taxes.payroll.hiTax, now, taxYear),
      additionalMedicareTax: yearToDateAmount(
        taxes.payroll.additionalMedicareTax,
        now,
        taxYear
      ),
    },
    totalFederalTax: yearToDateAmount(taxes.totalFederalTax, now, taxYear),
  };

  const { nodes, edges, width, height } = buildGraph(
    ytdTaxes,
    incomeTaxPrograms.map((r) => scaleRow(r, now, taxYear)),
    payrollPrograms.map((r) => scaleRow(r, now, taxYear)),
    selected,
    countryAid
  );

  return (
    <section className={styles.panel} aria-label="Allocation tree">
      <header className={styles.panelHeader}>
        <div>
          <h2>How it splits · this year so far</h2>
          <p>
            Click a program to fan out its parts · click again to collapse ·
            drag to pan · scroll to zoom
          </p>
        </div>
        <div className={styles.zoomBar}>
          <button type="button" onClick={() => zoomBy(-0.1)} aria-label="Zoom out">
            −
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoomBy(0.1)} aria-label="Zoom in">
            +
          </button>
          <button type="button" onClick={resetView} className={styles.resetBtn}>
            Reset
          </button>
        </div>
      </header>

      <div
        className={styles.graphWrap}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className={styles.viewport}
          style={{
            transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px) scale(${scale})`,
            width,
            height,
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            className={styles.svg}
            role="img"
            aria-label="Tree graph of tax allocation"
          >
            <defs>
              <linearGradient id="edgeIncome" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#c4b5fd" />
                <stop offset="100%" stopColor="#7513e3" />
              </linearGradient>
              <linearGradient id="edgePayroll" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d9ffd9" />
                <stop offset="100%" stopColor="#32cd32" />
              </linearGradient>
            </defs>

            {edges.map((edge) => (
              <path
                key={edge.id}
                d={edge.d}
                fill="none"
                stroke={
                  edge.tone === "income"
                    ? "url(#edgeIncome)"
                    : "url(#edgePayroll)"
                }
                strokeWidth={strokeForShare(edge.share)}
                strokeLinecap="round"
                className={`${styles.edge} ${
                  edge.emphasizes ? styles.edgeHot : ""
                } ${edge.share < 0.04 ? styles.edgeFaint : ""}`}
              />
            ))}
          </svg>

          <div className={styles.nodeLayer} style={{ width, height }}>
            {nodes.map((node) => {
              if (node.kind === "section") {
                return (
                  <div
                    key={node.id}
                    className={styles.sectionLabel}
                    style={{ left: node.x, top: node.y }}
                  >
                    {node.label}
                  </div>
                );
              }

              const isClickable =
                node.kind === "program" ||
                node.kind === "sub" ||
                node.kind === "country";
              const isSelected =
                Boolean(node.programId) && selected === node.programId;
              const className = [
                styles.node,
                styles[`tone_${node.tone}`],
                styles[`kind_${node.kind}`],
                isSelected ? styles.nodeSelected : "",
                node.expandable ? styles.nodeExpandable : "",
                node.expanded ? styles.nodeExpanded : "",
                node.amount < 0 ? styles.nodeOffset : "",
              ]
                .filter(Boolean)
                .join(" ");

              const labelSize = labelFontSize(node.label, node.kind);
              const content = (
                <>
                  <span
                    className={styles.nodeLabel}
                    style={labelSize ? { fontSize: labelSize } : undefined}
                  >
                    {node.label}
                  </span>
                  <span className={styles.nodeMeta}>
                    <span className={styles.nodeAmount}>
                      <LiveCurrency amount={node.amount} />
                    </span>
                    {node.kind !== "root" && node.kind !== "program" && (
                      <span className={styles.nodeShare}>
                        {formatPercentage(Math.abs(node.shareOfParent), 0)}
                      </span>
                    )}
                    {node.kind === "program" && (
                      <span className={styles.nodeShare}>
                        {formatPercentage(Math.abs(node.shareOfParent), 0)}
                        {node.expandable
                          ? node.expanded
                            ? " · collapse"
                            : " · expand"
                          : ""}
                      </span>
                    )}
                  </span>
                </>
              );

              if (isClickable && node.programId) {
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={className}
                    style={{ left: node.x, top: node.y }}
                    aria-expanded={
                      node.kind === "program" && node.expandable
                        ? Boolean(node.expanded)
                        : undefined
                    }
                    onClick={() => {
                      if (node.kind === "program") {
                        onSelect(
                          selected === node.programId ? null : node.programId!
                        );
                      } else {
                        onSelect(node.programId!);
                      }
                    }}
                    title={`${node.label}: ${formatCurrencyWithSymbol(node.amount)}`}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div
                  key={node.id}
                  className={className}
                  style={{ left: node.x, top: node.y }}
                  title={`${node.label}: ${formatCurrencyWithSymbol(node.amount)}`}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
