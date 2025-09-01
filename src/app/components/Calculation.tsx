import React from 'react'
import styles from './Calculation.module.scss'
import Image from 'next/image'

const Calculation = () => {
  return (
    <div className={styles.calcContainer}>
      <div className={styles.contribution}>
        <h2 className={styles.contributionCalc}>How we calculate your contribution</h2>
        <div className={styles.disclaimer}>
          <p style={{ fontWeight: '700', marginBottom: '20px', marginTop: '20px' }}>
            Your Contribution = (Your Income Tax Paid / Total Federal Income Tax Dollars) x Programs Tax Dollars
          </p>
          <p style={{ marginBottom: '20px', fontWeight: '500' }}>
            <span style={{ fontWeight: '600' }}>Income Tax Approximation:</span> We subtract the{' '}
            <a
              style={{ color: 'lime', fontWeight: '700' }}
              href="https://apps.irs.gov/app/vita/content/00/00_13_005.jsp"
            >
              standard deduction{' '}
            </a>
            from your gross income to get taxable income, then apply{' '}
            <a
              href="https://www.irs.gov/filing/federal-income-tax-rates-and-brackets"
              style={{ color: 'lime', fontWeight: '700' }}
            >
              federal marginal tax brackets{' '}
            </a>
            (each bracket has a rate applied to income in that range). This gives an estimate of your federal
            income tax paid.
          </p>

          <p style={{ marginBottom: '20px', fontWeight: '600' }}>
            Federal spending data is sourced directly from
            <a href="https://www.usaspending.gov/agency" style={{ color: 'lime', fontWeight: '700' }}>
              {' '}
              www.usaspending.gov/agency
            </a>
          </p>

          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            <span style={{ fontWeight: '600' }}>Disclaimer:</span> This estimate shows federal income tax only (tax
            on taxable income after the standard deduction, which is applied by default). It does not include
            payroll taxes (Social Security/Medicare), tax credits, itemized deductions, capital gains treatment,
            the AMT, state or local taxes, pre-tax retirement contributions, or other adjustments. Use this as an
            informational approximation only and consult a tax professional for a precise result. <br /> This
            calculator estimates your share of federal income tax allocated to Social Security and Medicare
            spending, not your actual payroll tax contribution. Social Security and Medicare are primarily funded
            by payroll taxes, which are not calculated here.
          </p>

          <p>
            I learned a lot by making this project, but{' '}
            <span style={{ fontStyle: 'italic', fontWeight: '700' }}>I am no tax expert. </span> I will continually
            try to make this calculation more accurate.
            <span style={{ fontStyle: 'italic', fontWeight: '700' }}>
              {' '}
              These numbers should be taken with a grain of salt.
            </span>{' '}
            -G
          </p>
        </div>
        <div>
          <p></p>
        </div>
      </div>
      <div className={styles.sources}>
        <h2 className={styles.contributionCalc}>Yo!</h2>
        <p>
          I hope you&apos;ve enjoyed using this calculator. I hope to build this out more so people can use it as a
          way to get a better idea of what they&apos;re buying through the US government.
        </p>{' '}
        <p style={{ marginTop: '10px' }}>
          I had a great time building this, and I can&apos;t wait to work on my next project like this one, I have
          some pretty good ideas so stay tuned!{' '}
        </p>
        <p style={{ marginTop: '10px' }}>If you want to support my work, consider buying me a coffee ;) </p>
        <div className={styles.buyCoffee}>
          <a href="https://www.buymeacoffee.com/digirain">
            <Image src="/buy-me-a-coffee.svg" alt="buy-me-a-coffee" width={250} height={55} />
          </a>
        </div>
        <p style={{ marginTop: '10px;' }}>For all inquiries, send me an email at digirainstuff@gmail.com</p>
      </div>
    </div>
  )
}

export default Calculation
