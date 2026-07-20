import type { ColumnDefinition } from '../columns'
import type { DataAdapter, Filter, FilterOption, Query, Row } from '../adapter'
import { EventEmitter } from '../events'
import { formatDefaultValue } from '../columns'
import { validateRows } from '../validation'
import type { ValidationError } from '../validation'
import { calculateTotalPages, validatePage } from '../pagination'

export interface TransformedCell {
  raw: unknown
  display: string
}

export type TransformedRow = Record<string, TransformedCell>

export interface RosiumTableState {
  columns: ColumnDefinition[]
  filters: Filter[]
  sort?: { column: string; direction: 'asc' | 'desc' }
  page: number
  pageSize: number
  total: number
  totalPages: number
  rows: TransformedRow[]
  visibleColumns: string[]
  columnOrder: string[]
  locale: string
}

export class RosiumTable {
  private adapter: DataAdapter | null = null
  private columns: ColumnDefinition[]
  private filters: Filter[] = []
  private sortState: { column: string; direction: 'asc' | 'desc' } | undefined
  private currentPage = 1
  private pageSize: number
  private totalRows = 0
  private currentRows: TransformedRow[] = []
  private visibleColumns: Set<string>
  private events: EventEmitter
  private locale: string

  constructor(config: { columns: ColumnDefinition[]; pageSize?: number; locale?: string }) {
    this.columns = config.columns
    this.pageSize = config.pageSize ?? 20
    this.locale = config.locale ?? 'pt-BR'
    this.events = new EventEmitter()

    const visibleKeys = config.columns
      .filter((c) => c.visible !== false)
      .map((c) => c.key)
    this.visibleColumns = new Set(visibleKeys)
  }

  useAdapter(adapter: DataAdapter): void {
    this.adapter = adapter
  }

  async filter(filter: Filter): Promise<void> {
    const existingIndex = this.filters.findIndex((f) => f.column === filter.column)
    if (existingIndex !== -1) {
      if (filter.value === '' || filter.value === null || filter.value === undefined) {
        this.filters.splice(existingIndex, 1)
      } else {
        this.filters[existingIndex] = filter
      }
    } else {
      if (filter.value !== '' && filter.value !== null && filter.value !== undefined) {
        this.filters.push(filter)
      }
    }

    this.currentPage = 1
    await this.fetchData()
  }

  async sort(column: string, direction: 'asc' | 'desc'): Promise<void> {
    this.sortState = { column, direction }
    this.currentPage = 1
    await this.fetchData()
  }

  async goToPage(n: number): Promise<void> {
    const totalPages = calculateTotalPages(this.totalRows, this.pageSize)
    this.currentPage = validatePage(n, totalPages)
    await this.fetchData()
  }

  async setPageSize(n: number): Promise<void> {
    if (typeof n !== 'number' || n <= 0 || !Number.isFinite(n)) {
      this.events.emit('error', {
        column: '',
        rowIndex: -1,
        expected: 'pageSize > 0 (number)',
        received: String(n),
      })
      return
    }
    this.pageSize = n
    this.currentPage = 1
    await this.fetchData()
  }

  getRows(): TransformedRow[] {
    return this.currentRows
  }

  getTotal(): number {
    return this.totalRows
  }

  getState(): RosiumTableState {
    return {
      columns: this.columns,
      filters: [...this.filters],
      sort: this.sortState ? { ...this.sortState } : undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
      total: this.totalRows,
      totalPages: calculateTotalPages(this.totalRows, this.pageSize),
      rows: this.currentRows,
      visibleColumns: [...this.visibleColumns],
      columnOrder: this.getColumnOrder(),
      locale: this.locale,
    }
  }

  async getFilterOptions(column: string): Promise<FilterOption[]> {
    if (!this.adapter) {
      this.events.emit('error', {
        column: '',
        rowIndex: -1,
        expected: 'adapter configured',
        received: 'no adapter',
      })
      return []
    }
    if (!this.adapter.fetchFilterOptions) {
      return []
    }
    try {
      return await this.adapter.fetchFilterOptions(column)
    } catch (err) {
      this.events.emit('error', {
        column: '',
        rowIndex: -1,
        expected: 'fetchFilterOptions successful',
        received: err instanceof Error ? err.message : String(err),
      })
      return []
    }
  }

  hideColumn(key: string): void {
    this.visibleColumns.delete(key)
    this.emitStateChanged()
  }

  showColumn(key: string): void {
    this.visibleColumns.add(key)
    this.emitStateChanged()
  }

  reorderColumns(keys: string[]): void {
    const currentOrder = this.getColumnOrder()
    const currentlyVisible = [...this.visibleColumns]

    const reordered: string[] = []
    for (const key of keys) {
      if (currentOrder.includes(key)) {
        reordered.push(key)
      }
    }

    for (const key of currentlyVisible) {
      if (!reordered.includes(key)) {
        reordered.push(key)
      }
    }

    this.visibleColumns = new Set(reordered)
    this.emitStateChanged()
  }

  on(event: string, handler: (...args: unknown[]) => void): void {
    this.events.on(event, handler)
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    this.events.off(event, handler)
  }

  private getColumnOrder(): string[] {
    return this.columns.map((c) => c.key)
  }

  private async fetchData(): Promise<void> {
    if (!this.adapter) {
      this.events.emit('error', {
        column: '',
        rowIndex: -1,
        expected: 'adapter configured',
        received: 'no adapter',
      })
      return
    }

    const query: Query = {
      filters: [...this.filters],
      sort: this.sortState ? { ...this.sortState } : undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
      locale: this.locale,
    }

    try {
      const result = await this.adapter.fetch(query)
      this.totalRows = result.total

      const validationErrors = validateRows(result.rows, this.columns)
      for (const err of validationErrors) {
        this.events.emit('error', err)
      }

      this.currentRows = this.transformRows(result.rows)
      this.events.emit('data:loaded', this.currentRows)
      this.emitStateChanged()
    } catch (err) {
      this.events.emit('error', {
        column: '',
        rowIndex: -1,
        expected: 'fetch successful',
        received: err instanceof Error ? err.message : String(err),
      })
    }
  }

  private transformRows(rows: Row[]): TransformedRow[] {
    return rows.map((row) => {
      const transformed: TransformedRow = {}
      for (const colDef of this.columns) {
        const rawValue = row[colDef.key]
        const effectiveLocale = colDef.locale ?? this.locale
        const displayValue = colDef.transform
          ? String(colDef.transform(rawValue))
          : formatDefaultValue(rawValue, colDef, effectiveLocale)

        transformed[colDef.key] = {
          raw: rawValue,
          display: displayValue,
        }
      }
      return transformed
    })
  }

  private emitStateChanged(): void {
    this.events.emit('state:changed', this.getState())
  }
}
