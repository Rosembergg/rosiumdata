export interface Filter {
  column: string
  operator: string
  value: unknown
}

export interface Query {
  filters: Filter[]
  sort?: { column: string; direction: 'asc' | 'desc' }
  page: number
  pageSize: number
}

export interface FetchResult {
  rows: Row[]
  total: number
}

export type Row = Record<string, unknown>

export interface FilterOption {
  label: string
  value: unknown
}

export interface DataAdapter {
  fetch(query: Query): Promise<FetchResult>
  fetchAll(query: Query): Promise<Row[]>
  fetchFilterOptions?(column: string): Promise<FilterOption[]>
}
