import Link from 'next/link'
import React from 'react'
import styles from './Navigation.module.scss'

const Navigation = () => {
  return (
    <nav className={styles.navigation}>
      <Link href="/about" className={styles.link}>
        About
      </Link>
    </nav>
  )
}

export default Navigation
