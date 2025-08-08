import { taxBrackets2024 } from '../constants/taxBrackets'

export type TaxBracket = {
  rate: number
  min: number
  max: number | null
}

export type FilingStatus = 'single' | 'married-jointly' | 'married-separately' | 'head-of-household'
export type BudgetStatus =
  | 'israelTaxDollars2025'
  | 'medicare'
  | 'socialSecurity'
  | 'nationalDefense'
  | 'interest'
  | 'verteransBenefits'
  | 'transportation'
  | 'education'
  | 'agriculture'

export const findTaxBracket = (income: number, filingStatus: FilingStatus): TaxBracket | undefined => {
  const brackets = getBracketsForFilingStatus(filingStatus)
  return brackets.find(bracket => income >= bracket.min && (bracket.max === null || income <= bracket.max))
}

export const getBracketsForFilingStatus = (filingStatus: FilingStatus): TaxBracket[] => {
  switch (filingStatus) {
    case 'married-jointly':
      return taxBrackets2024.marriedJoint
    case 'married-separately':
      return taxBrackets2024.marriedSeparate
    case 'head-of-household':
      return taxBrackets2024.headOfHousehold
    case 'single':
    default:
      return taxBrackets2024.single
  }
}

export const calculateTax = (income: number, filingStatus: FilingStatus): number => {
  const brackets = getBracketsForFilingStatus(filingStatus)
  let totalTax = 0

  for (const bracket of brackets) {
    if (income > bracket.min) {
      const taxableAmount = Math.min(income - bracket.min, (bracket.max ?? Infinity) - bracket.min)
      totalTax += taxableAmount * bracket.rate
    }

    if (bracket.max === null || income <= bracket.max) {
      break
    }
  }

  return totalTax
}

export const calculateTaxContribution = (
  taxPaid: number,
  totalTaxDollars: number,
  budgetTaxDollars: number
): number => {
  return (taxPaid / totalTaxDollars) * budgetTaxDollars
}
