'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.scss'
import { budgets, totalTaxDollars } from './constants/budgets'
import { calculateTax, calculateTaxContribution, type FilingStatus } from './utils/taxCalculations'
import { formatCurrencyWithSymbol } from './utils/formatters'
import Navigation from './components/Navigation'
import Calculation from './components/Calculation'

export default function Home() {
  const [income, setIncome] = useState(0)
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single')
  const [budget, setBudget] = useState<keyof typeof budgets>()
  const [animatedContribution, setAnimatedContribution] = useState(1000)
  const [pass, setPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)

  const [baselineContribution, setBaselineContribution] = useState(0)

  const password = 'bigMoneyBaby2002'

  const budgetOptions = [
    { label: 'Medicare', value: 'medicare' },
    { label: 'Social Security', value: 'socialSecurity' },
    { label: 'National Defense', value: 'nationalDefense' },
    { label: 'Interest on Debt', value: 'interest' },
    { label: 'Israel Aid', value: 'israelTaxDollars2025' },
    { label: 'Veterans Benefits', value: 'verteransBenefits' },
    { label: 'Transportation', value: 'transportation' },
    { label: 'Education', value: 'education' },
    { label: 'Agriculture', value: 'agriculture' }
  ]

  useEffect(() => {
    if (income > 0 && budget) {
      const calculatedTax = calculateTax(income, filingStatus)

      const contribution = calculateTaxContribution(calculatedTax, totalTaxDollars, budgets[budget])
      setBaselineContribution(contribution)
    } else {
      setBaselineContribution(0)
    }
  }, [income, filingStatus, budget])

  useEffect(() => {
    let frame: number
    const duration = 1000 // ms
    const start = animatedContribution
    const end = baselineContribution
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const value = start + (end - start) * progress
      setAnimatedContribution(value)

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        setAnimatedContribution(end)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [baselineContribution])

  if (!isAuth) {
    return (
      <div className={styles.page}>
        <label style={{ marginBottom: '20px', marginTop: '40px' }}>enter a password fool</label>
        <input
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && pass === password) {
              setIsAuth(true)
            }
          }}
          type="password"
          placeholder="Enter password"
        />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Navigation />
      </header>
      <main className={styles.mainContainer}>
        <div className={styles.heroText}>
          <span>How Much Do You Spend</span>
          <span> On </span>
          <span style={{ color: 'lime' }} className={styles.animatedWords}>
            Federal Government
          </span>
          <span> Programs?</span>
          <p style={{ marginTop: '20px', paddingRight: '40px' }}>
            Informational only, not tax/legal/financial advice. Consult a professional.
          </p>
        </div>
        <div className={styles.inputBar}></div>
        <div className={styles.main}>
          <div className={styles.budgetBarContainer}>
            <div className={styles.budgetBar}>
              <p>Select a federal program:</p>
              {budgetOptions.map(b => (
                <button
                  key={b.value}
                  onClick={() => setBudget(b.value as keyof typeof budgets)}
                  className={budget === b.value ? styles.selectedButton : ''}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.heroContainers}>
            <div className={styles.inputContainer}>
              <div className={styles.inputLabels}>
                <input
                  type="number"
                  value={income || ''}
                  onChange={e => setIncome(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    height: '70px',
                    marginTop: '20px',
                    marginBottom: '20px',
                    fontSize: '16px'
                  }}
                />
                <label className={styles.label}>Enter your yearly income</label>

                <div className={styles.rightLabel}>
                  <select
                    value={filingStatus}
                    onChange={e => setFilingStatus(e.target.value as FilingStatus)}
                    style={{ width: '100%', height: '70px', marginTop: '20px', marginBottom: '20px' }}
                  >
                    <option value="single">Single</option>
                    <option value="married-jointly">Married Filing Jointly</option>
                    <option value="married-separately">Married Filing Separately</option>

                    <option value="head-of-household">Head of Household</option>
                  </select>
                  <label className={styles.label}>Enter your filing status</label>
                </div>
              </div>
            </div>

            <div className={styles.resultContainer}>
              <h1>
                {income ? (
                  budget ? (
                    <span style={{ color: 'lime' }}>
                      {' '}
                      Your contribution to {budgetOptions.find(b => b.value === budget)?.label}
                    </span>
                  ) : (
                    'select a budget'
                  )
                ) : (
                  'Enter your income first, then select a program'
                )}{' '}
              </h1>
              <h3>
                Approximate income tax calculation: {formatCurrencyWithSymbol(calculateTax(income, filingStatus))}
              </h3>
              <div className={styles.contributionContainer}>
                <p className={styles.contribution}>{formatCurrencyWithSymbol(animatedContribution)}</p>
              </div>
            </div>
          </div>
        </div>
        <Calculation />
      </main>
    </div>
  )
}
