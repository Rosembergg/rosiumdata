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

const VALIDADORES: Record<ColumnType, (value: unknown, colDef: ColumnDefinition) => boolean> = {
  texto: (v) => validarTexto(v),
  numero: (v) => validarNumero(v),
  data: (v) => validarData(v),
  'data-hora': (v) => validarDataHora(v),
  booleano: (v) => validarBooleano(v),
  selecao: (v, colDef) => validarSelecao(v, colDef),
  acao: () => true,
}

const TIPO_ESPERADO: Record<ColumnType, string> = {
  texto: 'texto',
  numero: 'numero',
  data: 'data valida',
  'data-hora': 'data-hora valida',
  booleano: 'booleano',
  selecao: 'opcao valida',
  acao: '',
}

export function validarLinha(
  row: Row,
  rowIndex: number,
  columns: ColumnDefinition[],
): ValidationError[] {
  const erros: ValidationError[] = []

  for (const colDef of columns) {
    if (colDef.type === 'acao') continue

    const value = row[colDef.key]
    const validador = VALIDADORES[colDef.type]
    const valido = validador(value, colDef)

    if (!valido) {
      erros.push({
        column: colDef.key,
        rowIndex,
        expected: TIPO_ESPERADO[colDef.type],
        received: value,
      })
    }
  }

  return erros
}

export function validarLinhas(
  rows: Row[],
  columns: ColumnDefinition[],
): ValidationError[] {
  const erros: ValidationError[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!
    erros.push(...validarLinha(row, i, columns))
  }

  return erros
}
