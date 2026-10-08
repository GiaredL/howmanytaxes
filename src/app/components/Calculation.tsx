import Image from "next/image";
import styles from "./Calculation.module.scss";

const Calculation = () => {
  return (
    <div className={styles.calcContainer}>
      <div className={styles.contribution}>
        <h2 className={styles.contributionCalc}>
          How we calculate your contribution
        </h2>

        <p className={styles.lead}>
          Two kinds of federal tax, then a simple split of where that money
          goes. Estimate only — not a tax return.
        </p>

        <ol className={styles.steps}>
          <li>
            <h3>1. Estimate what you pay</h3>
            <p>
              <strong>Income tax</strong> (funds most government programs):
            </p>
            <p className={styles.formula}>
              taxable income = income − deduction
              <br />
              then apply IRS tax brackets
            </p>
            <p>
              Deduction is the{" "}
              <a href="https://www.irs.gov/filing/federal-income-tax-rates-and-brackets">
                standard deduction
              </a>{" "}
              for your filing status, or your itemized total if it’s higher.
              Self-employed: we also subtract half of SE tax first (like the IRS
              does).
            </p>
            <p>
              <strong>Payroll tax</strong> (Social Security &amp; Medicare HI):
            </p>
            <p className={styles.formula}>
              Social Security ≈ 6.2% of wages (up to the yearly SS wage cap)
              <br />
              Medicare ≈ 1.45% of wages (+ 0.9% if you’re over the high-earner
              threshold)
            </p>
            <p>
              Self-employed pay roughly double those rates on 92.35% of net
              profit. Married filing jointly: each spouse has their own Social
              Security wage cap.
            </p>
          </li>

          <li>
            <h3>2. Send each dollar to the right place</h3>
            <p className={styles.formula}>
              Social Security → your Social Security payroll tax
              <br />
              Medicare (HI) → your Medicare payroll tax
              <br />
              Everything else → your share of income tax
            </p>
            <p className={styles.formula}>
              your share of a program =
              <br />
              (your income tax ÷ all individual income taxes collected) × that
              program’s spending
            </p>
            <p>
              Spending and totals come from the U.S. Treasury{" "}
              <a href="https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/">
                Monthly Treasury Statement
              </a>
              . Country aid under International Affairs uses{" "}
              <a href="https://foreignassistance.gov/">ForeignAssistance.gov</a>{" "}
              shares (illustrative — not the same as the Treasury IA total).
            </p>
          </li>

          <li>
            <h3>3. “This year so far”</h3>
            <p>
              We show how much of your full-year estimate has accrued from Jan 1
              through today. Full-year amounts sit under each card.
            </p>
          </li>
        </ol>

        <div className={styles.notes}>
          <h3>Worth knowing</h3>
          <ul>
            <li>
              We skip credits, AMT, and most special tax situations — so this
              won’t match your exact refund or bill.
            </li>
            <li>
              Employee estimates use <em>your</em> FICA share, not the
              employer’s match.
            </li>
            <li>
              Medicare here is Hospital Insurance (Part A). Parts B/D are mostly
              funded differently and aren’t fully included.
            </li>
            <li>
              If a category shows a minus sign, it usually means the government
              collected more there than it spent — not that you get a refund.
            </li>
          </ul>
        </div>

        <p className={styles.signoff}>
          Built as an explainer, not advice. Take the numbers with a grain of
          salt. —G
        </p>
      </div>

      <div className={styles.sources}>
        <h2 className={styles.contributionCalc}>Yo!</h2>
        <p>
          Hope this helps you see what your federal taxes roughly buy. More
          improvements coming.
        </p>
        <p className={styles.support}>
          If you want to support the project, grab me a coffee:
        </p>
        <div className={styles.buyCoffee}>
          <a href="https://www.buymeacoffee.com/digirain">
            <Image
              src="/buy-me-a-coffee.svg"
              alt="Buy me a coffee"
              width={250}
              height={55}
            />
          </a>
        </div>
        <p className={styles.email}>
          Questions:{" "}
          <a href="mailto:digirainstuff@gmail.com">digirainstuff@gmail.com</a>
        </p>
      </div>
    </div>
  );
};

export default Calculation;
