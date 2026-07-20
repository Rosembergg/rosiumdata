export type ColumnType = 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'action'

export type ColumnAlignment = 'left' | 'center' | 'right'

export interface ActionDefinition {
  key: string
  label: string
  danger?: boolean
}

export interface ColumnDefinition {
  key: string
  type: ColumnType
  label?: string
  mask?: string
  transform?: (value: unknown) => unknown
  options?: Record<string, unknown> & { actions?: ActionDefinition[] }
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
  options?: Record<string, unknown> & { actions?: ActionDefinition[] }
  filterOperators?: string[]
  defaultOperator?: string
  alignment?: ColumnAlignment
  sortable?: boolean
  filterable?: boolean
  visible?: boolean
  exportAsFormatted?: boolean
}

export function column(key: string, config: ColumnConfig): ColumnDefinition {
  const type = config.type ?? 'text'
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
    filterable: config.filterable ?? (type !== 'action'),
    visible: config.visible ?? true,
    exportAsFormatted: config.exportAsFormatted ?? false,
  }
}

export const DEFAULT_ALIGNMENT: Record<ColumnType, ColumnAlignment> = {
  text: 'left',
  number: 'right',
  date: 'center',
  datetime: 'center',
  boolean: 'center',
  select: 'left',
  action: 'center',
}

function formatarNumero(value: unknown, colDef: ColumnDefinition): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return String(value)

  if (colDef.mask) {
    if (/R\$/i.test(colDef.mask)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'BRL',
      }).format(num)
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }

  return String(value)
}

export function formatDefaultValue(value: unknown, colDef: ColumnDefinition): string {
  if (value === null || value === undefined) return ''

  if (colDef.options) {
    const key = String(value)
    return colDef.options[key] ?? key
  }

  switch (colDef.type) {
    case 'boolean':
      return value ? 'Yes' : 'No'

    case 'number':
      return formatarNumero(value, colDef)

    case 'date': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return String(value)
      return date.toLocaleDateString('en-US')
    }

    case 'datetime': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return String(value)
      return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    case 'action':
      return ''

    default:
      return String(value)
  }
}
