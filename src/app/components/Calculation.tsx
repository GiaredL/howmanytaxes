import React from 'react'
import styles from './Calculation.module.scss'

const Calculation = () => {
  return (
    <div className={styles.calcContainer}>
      <div className={styles.contribution}>
        <h2 className={styles.contributionCalc}>How we calculate your contribution</h2>
      </div>
      <div className={styles.sources}>
        <h2 className={styles.contributionCalc}>Data Sources</h2>
      </div>
    </div>
  )
}

export default Calculation
