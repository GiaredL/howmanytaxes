import styles from "./LiveCurrency.module.scss";

type Props = {
  amount: number;
  className?: string;
};

/**
 * Shows money as normal dollars + cents, with two smaller sub-cent digits
 * so the live ticker can move without implying we price things in 1/100¢.
 * Negative amounts (budget offsetting receipts) keep a leading minus.
 */
export default function LiveCurrency({ amount, className }: Props) {
  const finite = Number.isFinite(amount) ? amount : 0;
  const negative = finite < 0;
  const abs = Math.abs(finite);
  // Truncate (not round) so the small digits roll forward naturally
  const totalTenThousandths = Math.floor(abs * 10_000 + 1e-9);
  const centsTotal = Math.floor(totalTenThousandths / 100);
  const subCents = totalTenThousandths % 100;
  const dollars = Math.floor(centsTotal / 100);
  const cents = centsTotal % 100;

  const dollarsFormatted = dollars.toLocaleString("en-US");
  const centsFormatted = cents.toString().padStart(2, "0");
  const subFormatted = subCents.toString().padStart(2, "0");
  const sign = negative ? "−" : "";

  return (
    <span
      className={`${styles.live} ${negative ? styles.negative : ""} ${className ?? ""}`}
    >
      <span className={styles.main}>
        {sign}${dollarsFormatted}.{centsFormatted}
      </span>
      <span className={styles.sub} aria-hidden="true">
        {subFormatted}
      </span>
      <span className={styles.srOnly}>
        {`${sign}$${dollarsFormatted}.${centsFormatted}${subFormatted} so far this year`}
      </span>
    </span>
  );
}
