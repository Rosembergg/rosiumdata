export type ColumnType = 'texto' | 'numero' | 'data' | 'data-hora' | 'booleano' | 'selecao' | 'acao'

export type ColumnAlignment = 'left' | 'center' | 'right'

export interface ColumnDefinition {
  key: string
  type: ColumnType
  label?: string
  mask?: string
  transform?: (value: unknown) => unknown
  options?: Record<string | number, string>

  filterOperators?: string[]
  defaultOperator?: string
  alignment?: ColumnAlignment
  sortable?: boolean
  filterable?: boolean
  visible?: boolean
  exportAsFormatted?: boolean
}

export interface ColumnConfig {
  type?: ColumnType
  label?: string
  mask?: string
  transform?: (value: unknown) => unknown
  options?: Record<string | number, string>
  filterOperators?: string[]
  defaultOperator?: string
  alignment?: ColumnAlignment
  sortable?: boolean
  filterable?: boolean
  visible?: boolean
  exportAsFormatted?: boolean
}

export function coluna(key: string, config: ColumnConfig): ColumnDefinition {
  const type = config.type ?? 'texto'
  return {
    key,
    type,
    label: config.label ?? key,
    mask: config.mask,
    transform: config.transform,
    options: config.options,
    filterOperators: config.filterOperators,
    defaultOperator: config.defaultOperator,
    alignment: config.alignment,
    sortable: config.sortable,
    filterable: config.filterable ?? (type !== 'acao'),
    visible: config.visible ?? true,
    exportAsFormatted: config.exportAsFormatted ?? false,
  }
}

export const ALINHAMENTO_PADRAO: Record<ColumnType, ColumnAlignment> = {
  texto: 'left',
  numero: 'right',
  data: 'center',
  'data-hora': 'center',
  booleano: 'center',
  selecao: 'left',
  acao: 'center',
}

function formatarNumero(value: unknown, colDef: ColumnDefinition): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return String(value)

  if (colDef.mask) {
    if (/R\$/i.test(colDef.mask)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(num)
    }
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }

  return String(value)
}

export function formatarValorPadrao(value: unknown, colDef: ColumnDefinition): string {
  if (value === null || value === undefined) return ''

  if (colDef.options) {
    const key = String(value)
    return colDef.options[key] ?? key
  }

  switch (colDef.type) {
    case 'booleano':
      return value ? 'Sim' : 'Nao'

    case 'numero':
      return formatarNumero(value, colDef)

    case 'data': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return String(value)
      return date.toLocaleDateString('pt-BR')
    }

    case 'data-hora': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return String(value)
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    case 'acao':
      return ''

    default:
      return String(value)
  }
}
