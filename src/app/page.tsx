'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import { TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { budgets, totalTaxDollars } from './constants/budgets'
import { calculateTax, calculateTaxContribution, type FilingStatus } from './utils/taxCalculations'
import { formatCurrencyWithSymbol } from './utils/formatters'

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
      {/* <header style={{ padding: '20px', textAlign: 'right', color: 'white' }}>
        <Link href="/about" style={{ color: 'white', textDecoration: 'underline' }}>
          About
        </Link>
      </header> */}
      <main>
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
              is
            </h1>
            <h1
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
                fontSize: '4rem',
                color: 'red'
              }}
            >
              {formatCurrencyWithSymbol(baselineContribution)}
            </h1>
          </div>
        </div>
      </main>
    </div>
  )
}
