import type { Row } from '../adapter'

export type SortDirection = 'asc' | 'desc'

export function invertDirection(direction: SortDirection): SortDirection {
  return direction === 'asc' ? 'desc' : 'asc'
}

function compareValues(a: unknown, b: unknown, locale: string): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime()
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1
  }

  return String(a).localeCompare(String(b), locale, { sensitivity: 'base' })
}

export function sortArray(rows: Row[], column: string, direction: SortDirection, locale: string = 'pt-BR'): Row[] {
  const sorted = [...rows].sort((a, b) => {
    const aVal = a[column]
    const bVal = b[column]

    const aNull = aVal == null
    const bNull = bVal == null
    if (aNull && bNull) return 0
    if (aNull) return 1
    if (bNull) return -1

    const cmp = compareValues(aVal, bVal, locale)
    return direction === 'asc' ? cmp : -cmp
  })
  return sorted
}
