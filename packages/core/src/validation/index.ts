import type { ColumnDefinition, ColumnType } from '../columns'
import type { Row } from '../adapter'

export interface ValidationError {
  column: string
  rowIndex: number
  expected: string
  received: unknown
}

function validarTexto(value: unknown): boolean {
  if (value === null || value === undefined) return true
  return typeof value === 'string'
}

function validarNumero(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'number') return !isNaN(value)
  if (typeof value === 'string') return !isNaN(Number(value)) && value.trim() !== ''
  return false
}

function validarData(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (value instanceof Date) return !isNaN(value.getTime())
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }
  return false
}

function validarDataHora(value: unknown): boolean {
  return validarData(value)
}

function validarBooleano(value: unknown): boolean {
  if (value === null || value === undefined) return true
  return typeof value === 'boolean' || value === 0 || value === 1 || value === 'true' || value === 'false'
}

function validarSelecao(value: unknown, colDef: ColumnDefinition): boolean {
  if (value === null || value === undefined) return true
  if (!colDef.options) return true
  const key = String(value)
  return key in colDef.options
}

const VALIDATORS: Record<ColumnType, (value: unknown, colDef: ColumnDefinition) => boolean> = {
  text: (v) => validarTexto(v),
  number: (v) => validarNumero(v),
  date: (v) => validarData(v),
  datetime: (v) => validarDataHora(v),
  boolean: (v) => validarBooleano(v),
  select: (v, colDef) => validarSelecao(v, colDef),
  action: () => true,
}

const EXPECTED_TYPE: Record<ColumnType, string> = {
  text: 'text',
  number: 'number',
  date: 'valid date',
  datetime: 'valid date-hora',
  boolean: 'boolean',
  select: 'valid option',
  action: '',
}

export function validateRow(
  row: Row,
  rowIndex: number,
  columns: ColumnDefinition[],
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const colDef of columns) {
    if (colDef.type === 'action') continue

    const value = row[colDef.key]
    const validator = VALIDATORS[colDef.type]
    const isValid = validator(value, colDef)

    if (!isValid) {
      errors.push({
        column: colDef.key,
        rowIndex,
        expected: EXPECTED_TYPE[colDef.type],
        received: value,
      })
    }
  }

  return errors
}

export function validateRows(
  rows: Row[],
  columns: ColumnDefinition[],
): ValidationError[] {
  const errors: ValidationError[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    errors.push(...validateRow(row, i, columns))
  }

  return errors
}
