'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.scss'
import { budgets, totalTaxDollars } from './constants/budgets'
import { calculateTax, calculateTaxContribution, type FilingStatus } from './utils/taxCalculations'
import { formatCurrencyWithSymbol } from './utils/formatters'
import Navigation from './components/Navigation'

export default function Home() {
  const [income, setIncome] = useState(0)
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single')
  const [budget, setBudget] = useState<keyof typeof budgets>()

  const [baselineContribution, setBaselineContribution] = useState(0)

  const budgetOptions = [
    { label: 'Israel Aid', value: 'israelTaxDollars2025' },
    { label: 'Medicare', value: 'medicare' },
    { label: 'Social Security', value: 'socialSecurity' },
    { label: 'National Defense', value: 'nationalDefense' },
    { label: 'Interest on Debt', value: 'interest' },
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Navigation />
      </header>
      <main className={styles.mainContainer}>
        <div className={styles.heroText}>
          <span>How Much Did You Spend</span>
          <span> On </span>
          <span style={{ color: 'lime' }} className={styles.animatedWords}>
            Federal Government
          </span>
          <span> programs in 2024?</span>
        </div>
        <div className={styles.inputBar}>
          {/* <input
            type="number"
            placeholder="Enter your income here"
            value={income || ''}
            onChange={e => setIncome(parseFloat(e.target.value) || 0)}
            className={styles.incomeInput}
          /> */}
        </div>
        <div className={styles.main}>
          <div className={styles.budgetBarContainer}>
            <div className={styles.leftLabel}>
              <p>Start Here</p>
            </div>
            <div className={styles.budgetBar}>
              <p>choose a budget category</p>
              {budgetOptions.map(b => (
                <button key={b.value} onClick={() => setBudget(b.value as keyof typeof budgets)}>
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
                    <option value="head-of-household">Head of Household</option>
                  </select>
                  <label className={styles.label}>Enter your filing status</label>
                </div>
                {/* 
              <p>Pick a budget category</p>
              <select
                value={budget}
                onChange={e => setBudget(e.target.value as keyof typeof budgets)}
                style={{ width: '100%', height: '40px', marginTop: '20px', marginBottom: '20px' }}
              >
                {budgetOptions.map(b => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select> */}
              </div>
            </div>

            <div className={styles.resultContainer}>
              <h1>
                Your contribution to{' '}
                {budget ? budgetOptions.find(b => b.value === budget)?.label : 'select a budget'}{' '}
              </h1>
              <h3>total tax calculation: {formatCurrencyWithSymbol(calculateTax(income, filingStatus))}</h3>
              <div className={styles.contributionContainer}>
                <p className={styles.contribution}>{formatCurrencyWithSymbol(baselineContribution)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
