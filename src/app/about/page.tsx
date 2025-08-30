'use client'

import Link from 'next/link'
import styles from '../page.module.scss'

export default function About() {
  return (
    <div className={styles.page}>
      <main>
        <h1>About Tax Calculator</h1>
        <p>
          This tax calculator helps you understand how your tax dollars contribute to various government programs.
          Using the latest 2024 tax brackets, it calculates your estimated tax contribution to different federal
          budget categories.
        </p>
        <p>
          The calculator uses official tax brackets and budget numbers to give you a personalized view of how your
          tax dollars are being spent across different government programs.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
            ← Back to Calculator
          </Link>
        </div>
      </main>
    </div>
  )
}
