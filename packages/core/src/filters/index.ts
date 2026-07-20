import type { ColumnType } from '../columns'
import type { Row, Filter } from '../adapter'

export const DEFAULT_OPERATORS: Record<ColumnType, string[]> = {
  text: ['contains', 'equals', 'startsWith', 'endsWith'],
  number: ['=', '>', '<', '>=', '<=', 'between'],
  date: ['between', 'before', 'after', 'equals'],
  datetime: ['between', 'before', 'after', 'equals'],
  boolean: ['equals'],
  select: ['equals'],
  action: [],
}

export const DEFAULT_OPERATOR: Record<ColumnType, string> = {
  text: 'contains',
  number: '=',
  date: 'between',
  datetime: 'between',
  boolean: 'equals',
  select: 'equals',
  action: '',
}

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return value
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (isNaN(date.getTime())) return null
    return date
  }
  return null
}

function compararIgual(rowValue: unknown, filterValue: unknown): boolean {
  const rowDate = toDate(rowValue)
  const filterDate = toDate(filterValue)
  if (rowDate && filterDate) {
    return rowDate.getTime() === filterDate.getTime()
  }
  return rowValue === filterValue
}

function compararEntre(rowValue: unknown, filterValue: unknown): boolean {
  if (!Array.isArray(filterValue) || filterValue.length < 2) return false
  const [min, max] = filterValue

  const rowDate = toDate(rowValue)
  const minDate = toDate(min)
  const maxDate = toDate(max)
  if (rowDate && minDate && maxDate) {
    return rowDate >= minDate && rowDate <= maxDate
  }

  const rowNum = Number(rowValue)
  const minNum = Number(min)
  const maxNum = Number(max)
  if (!isNaN(rowNum) && !isNaN(minNum) && !isNaN(maxNum)) {
    return rowNum >= minNum && rowNum <= maxNum
  }

  return false
}

function compararDatas(rowValue: unknown, filterValue: unknown): number {
  const rowDate = toDate(rowValue)
  const filterDate = toDate(filterValue)
  if (!rowDate || !filterDate) return NaN
  return rowDate.getTime() - filterDate.getTime()
}

function aplicarFiltroLinha(row: Row, filter: Filter): boolean {
  const rowValue = row[filter.column]

  if (filter.value === null || filter.value === undefined || filter.value === '') return true

  if (rowValue === null || rowValue === undefined) return false

  switch (filter.operator) {
    case 'contains':
      return String(rowValue).toLowerCase().includes(String(filter.value).toLowerCase())

    case 'equals':
      return compararIgual(rowValue, filter.value)

    case 'startsWith':
      return String(rowValue).toLowerCase().startsWith(String(filter.value).toLowerCase())

    case 'endsWith':
      return String(rowValue).toLowerCase().endsWith(String(filter.value).toLowerCase())

    case '=':
      return Number(rowValue) === Number(filter.value)

    case '>':
      return Number(rowValue) > Number(filter.value)

    case '<':
      return Number(rowValue) < Number(filter.value)

    case '>=':
      return Number(rowValue) >= Number(filter.value)

    case '<=':
      return Number(rowValue) <= Number(filter.value)

    case 'between':
      return compararEntre(rowValue, filter.value)

    case 'before': {
      const cmp = compararDatas(rowValue, filter.value)
      if (isNaN(cmp)) return false
      return cmp < 0
    }

    case 'after': {
      const cmp = compararDatas(rowValue, filter.value)
      if (isNaN(cmp)) return false
      return cmp > 0
    }

    default:
      return false
  }
}

export function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  if (filters.length === 0) return rows
  return rows.filter((row) => filters.every((f) => aplicarFiltroLinha(row, f)))
}
