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
  /** Override the table locale for this column only (e.g. 'en-US', 'de-DE') */
  locale?: string
  /** ISO currency code (e.g. 'USD', 'EUR', 'BRL'). Default: inferred from locale */
  currency?: string
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
  /** Override the table locale for this column only */
  locale?: string
  /** ISO currency code (e.g. 'USD', 'EUR'). Default: inferred from locale */
  currency?: string
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
    locale: config.locale,
    currency: config.currency,
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

function formatNumber(value: unknown, colDef: ColumnDefinition, locale: string): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return String(value)

  const currency = colDef.currency ?? (locale.startsWith('pt') ? 'BRL' : undefined)

  if (colDef.mask) {
    return new Intl.NumberFormat(locale, {
      style: currency ? 'currency' : 'decimal',
      ...(currency ? { currency } : { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
    }).format(num)
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDefaultValue(value: unknown, colDef: ColumnDefinition, locale: string): string {
  if (value === null || value === undefined) return ''

  if (colDef.options) {
    const key = String(value)
    return colDef.options[key] ?? key
  }

  switch (colDef.type) {
    case 'boolean':
      return value ? 'Yes' : 'No'

    case 'number':
      return formatNumber(value, colDef, locale)

    case 'date': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return String(value)
      return date.toLocaleDateString(locale)
    }

    case 'datetime': {
      const date = value instanceof Date ? value : new Date(String(value))
      if (isNaN(date.getTime())) return String(value)
      return date.toLocaleDateString(locale) + ' ' + date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    }

    case 'action':
      return ''

    default:
      return String(value)
  }
}
