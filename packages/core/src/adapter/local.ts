import type { DataAdapter, Query, FetchResult, Row, FilterOption } from './index'
import { aplicarFiltros } from '../filters'
import { ordenarArray } from '../sorting'
import { paginarArray } from '../pagination'

export class LocalAdapter implements DataAdapter {
  private data: Row[]

  constructor(data: Row[]) {
    this.data = data
  }

  async fetch(query: Query): Promise<FetchResult> {
    let rows = aplicarFiltros(this.data, query.filters)

    if (query.sort) {
      rows = ordenarArray(rows, query.sort.column, query.sort.direction)
    }

    const total = rows.length
    const paged = paginarArray(rows, query.page, query.pageSize)

    return { rows: paged, total }
  }

  async fetchAll(query: Query): Promise<Row[]> {
    let rows = aplicarFiltros(this.data, query.filters)

    if (query.sort) {
      rows = ordenarArray(rows, query.sort.column, query.sort.direction)
    }

    return rows
  }

  async fetchFilterOptions(column: string): Promise<FilterOption[]> {
    const seen = new Set<string>()
    const options: FilterOption[] = []

    for (const row of this.data) {
      const val = row[column]
      if (val === null || val === undefined) continue

      const dedupeKey = typeof val === 'object' ? JSON.stringify(val) : String(val)

      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      const label = String(val)

      options.push({ label, value: val })
    }

    return options
  }
}
