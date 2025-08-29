'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.css'
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
        <div className={styles.hero}>
          <p>How Much Did You Spend On Federal Government Programs in 2024?</p>
        </div>
        <div className={styles.main}>
          <div className={styles.inputContainer}>
            <div className={styles.inputLabels}>
              <div className={styles.leftLabel}>
                <p>Enter your yearly income</p>
                <input
                  type="number"
                  placeholder="Enter your income here"
                  value={income || ''}
                  onChange={e => setIncome(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', height: '40px', marginTop: '20px', marginBottom: '20px' }}
                />
              </div>

              <div className={styles.rightLabel}>
                <p>Enter your filing status</p>
                <select
                  value={filingStatus}
                  onChange={e => setFilingStatus(e.target.value as FilingStatus)}
                  style={{ width: '100%', height: '40px', marginTop: '20px', marginBottom: '20px' }}
                >
                  <option value="single">Single</option>
                  <option value="married-jointly">Married Filing Jointly</option>
                  <option value="head-of-household">Head of Household</option>
                </select>
              </div>
            </div>

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
            </select>
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
      </main>
    </div>
  )
}
