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
          <h1>How Much Did You Spend On Federal Government Programs in 2024?</h1>
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
              <option value="">Select a Budget Category</option>
              <option value="israelTaxDollars2025">Israel Aid</option>
              <option value="medicare">Medicare</option>
              <option value="socialSecurity">Social Security</option>
              <option value="nationalDefense">National Defense</option>
              <option value="interest">Interest on Debt</option>
              <option value="verteransBenefits">Veterans Benefits</option>
              <option value="transportation">Transportation</option>
              <option value="education">Education</option>
              <option value="agriculture">Agriculture</option>
            </select>
          </div>

          <div className={styles.resultContainer}>
            <h1>
              Your contribution to{' '}
              {budget
                ? budget
                    .replace(/([A-Z])/g, ' $1')
                    .toLowerCase()
                    .replace('tax dollars', '')
                    .replace('2025', '')
                : 'selected program'}{' '}
            </h1>
            <h3>
              ------------------ total tax calculation:{' '}
              {formatCurrencyWithSymbol(calculateTax(income, filingStatus))}
            </h3>
            <h1>{formatCurrencyWithSymbol(baselineContribution)}</h1>
          </div>
        </div>
      </main>
    </div>
  )
}
