import Image from "next/image";
import {
  DISCLAIMER_ESTIMATE,
  DISCLAIMER_NOT_AFFILIATED,
  DISCLAIMER_SOURCES,
} from "../constants/disclaimers";
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
          goes. {DISCLAIMER_ESTIMATE}
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
              then apply published federal tax brackets
            </p>
            <p>
              Deduction is the{" "}
              <a href="https://www.irs.gov/filing/federal-income-tax-rates-and-brackets">
                standard deduction
              </a>{" "}
              published for your filing status, or your itemized total if it’s
              higher. Self-employed: we also subtract half of SE tax first
              (common federal practice).
            </p>
            <p>
              If you enter kids under 17, we apply a{" "}
              <a href="https://www.irs.gov/credits-deductions/individuals/child-tax-credit">
                simplified Child Tax Credit
              </a>{" "}
              (with income phase-outs) and assume they qualify:
            </p>
            <p className={styles.formula}>
              CTC that cuts your bill → lowers income tax used in the breakdown
              <br />
              leftover Additional CTC (ACTC) → estimated refund to you
              <br />
              (refund isn’t treated as negative program funding)
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
              (your income tax after CTC ÷ all individual income taxes
              collected) × that program’s spending
            </p>
            <p>
              “Income tax after CTC” means tax owed after the nonrefundable
              Child Tax Credit. Any Additional Child Tax Credit refund is shown
              separately and does not shrink (or reverse) these program amounts.
            </p>
            <p>
              Spending and receipt totals come from public U.S. Treasury Fiscal
              Data (the{" "}
              <a href="https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/">
                Monthly Treasury Statement
              </a>
              ). Country examples under International Affairs use public{" "}
              <a href="https://foreignassistance.gov/">ForeignAssistance.gov</a>{" "}
              shares — illustrative only, and not the same as the Treasury
              International Affairs total.
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
            <li>{DISCLAIMER_ESTIMATE}</li>
            <li>{DISCLAIMER_NOT_AFFILIATED}</li>
            <li>{DISCLAIMER_SOURCES}</li>
            <li>
              Kids under 17: simplified CTC can lower the income tax in your
              breakdown; ACTC may show as an estimated refund and is not counted
              as negative funding. We assume the kids qualify. We still skip
              EITC, other credits, AMT, and most special situations.
            </li>
            <li>
              Employee estimates use <em>your</em> payroll-tax share, not the
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
          Built as an independent explainer. Take the numbers with a grain of
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
        <p className={styles.sidebarDisclaimer}>
          {DISCLAIMER_ESTIMATE} {DISCLAIMER_NOT_AFFILIATED}
        </p>
      </div>
    </div>
  );
};

export default Calculation;
