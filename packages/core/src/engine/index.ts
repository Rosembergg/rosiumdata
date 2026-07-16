import type { ColumnDefinition } from '../columns'
import type { DataAdapter, Filter, FilterOption, Query, Row } from '../adapter'
import { EventEmitter } from '../events'
import { formatarValorPadrao } from '../columns'
import { validarLinhas } from '../validation'
import type { ValidationError } from '../validation'
import { calcularTotalPaginas, validarPagina } from '../pagination'

export interface TransformedCell {
  raw: unknown
  display: string
}

export type TransformedRow = Record<string, TransformedCell>

export interface RsTableState {
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
}

export class RsTable {
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

  constructor(config: { columns: ColumnDefinition[]; pageSize?: number }) {
    this.columns = config.columns
    this.pageSize = config.pageSize ?? 20
    this.events = new EventEmitter()

    const visibleKeys = config.columns
      .filter((c) => c.visible !== false)
      .map((c) => c.key)
    this.visibleColumns = new Set(visibleKeys)
  }

  usarAdapter(adapter: DataAdapter): void {
    this.adapter = adapter
  }

  async filtrar(filter: Filter): Promise<void> {
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

  async ordenar(column: string, direction: 'asc' | 'desc'): Promise<void> {
    this.sortState = { column, direction }
    this.currentPage = 1
    await this.fetchData()
  }

  async irParaPagina(n: number): Promise<void> {
    const totalPages = calcularTotalPaginas(this.totalRows, this.pageSize)
    this.currentPage = validarPagina(n, totalPages)
    await this.fetchData()
  }

  async setPageSize(n: number): Promise<void> {
    if (typeof n !== 'number' || n <= 0 || !Number.isFinite(n)) {
      this.events.emit('erro', {
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

  getLinhas(): TransformedRow[] {
    return this.currentRows
  }

  getTotal(): number {
    return this.totalRows
  }

  getEstado(): RsTableState {
    return {
      columns: this.columns,
      filters: [...this.filters],
      sort: this.sortState ? { ...this.sortState } : undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
      total: this.totalRows,
      totalPages: calcularTotalPaginas(this.totalRows, this.pageSize),
      rows: this.currentRows,
      visibleColumns: [...this.visibleColumns],
      columnOrder: this.getColumnOrder(),
    }
  }

  async getOpcoesFiltro(column: string): Promise<FilterOption[]> {
    if (!this.adapter) {
      this.events.emit('erro', {
        column: '',
        rowIndex: -1,
        expected: 'adapter configurado',
        received: 'nenhum adapter',
      })
      return []
    }
    if (!this.adapter.fetchFilterOptions) {
      return []
    }
    try {
      return await this.adapter.fetchFilterOptions(column)
    } catch (err) {
      this.events.emit('erro', {
        column: '',
        rowIndex: -1,
        expected: 'fetchFilterOptions bem-sucedido',
        received: err instanceof Error ? err.message : String(err),
      })
      return []
    }
  }

  esconderColuna(key: string): void {
    this.visibleColumns.delete(key)
    this.emitEstadoAlterado()
  }

  mostrarColuna(key: string): void {
    this.visibleColumns.add(key)
    this.emitEstadoAlterado()
  }

  reordenarColunas(keys: string[]): void {
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
    this.emitEstadoAlterado()
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
      this.events.emit('erro', {
        column: '',
        rowIndex: -1,
        expected: 'adapter configurado',
        received: 'nenhum adapter',
      })
      return
    }

    const query: Query = {
      filters: [...this.filters],
      sort: this.sortState ? { ...this.sortState } : undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
    }

    try {
      const result = await this.adapter.fetch(query)
      this.totalRows = result.total

      const validationErrors = validarLinhas(result.rows, this.columns)
      for (const err of validationErrors) {
        this.events.emit('erro', err)
      }

      this.currentRows = this.transformRows(result.rows)
      this.events.emit('dados:carregados', this.currentRows)
      this.emitEstadoAlterado()
    } catch (err) {
      this.events.emit('erro', {
        column: '',
        rowIndex: -1,
        expected: 'fetch bem-sucedido',
        received: err instanceof Error ? err.message : String(err),
      })
    }
  }

  private transformRows(rows: Row[]): TransformedRow[] {
    return rows.map((row) => {
      const transformed: TransformedRow = {}
      for (const colDef of this.columns) {
        const rawValue = row[colDef.key]
        const displayValue = colDef.transform
          ? String(colDef.transform(rawValue))
          : formatarValorPadrao(rawValue, colDef)

        transformed[colDef.key] = {
          raw: rawValue,
          display: displayValue,
        }
      }
      return transformed
    })
  }

  private emitEstadoAlterado(): void {
    this.events.emit('estado:alterado', this.getEstado())
  }
}
