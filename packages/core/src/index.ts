export { VERSION, NAME } from './meta'

export { EventEmitter } from './events'
export type { EventHandler } from './events'

export type {
  DataAdapter,
  Query,
  FetchResult,
  Row,
  FilterOption,
  Filter,
} from './adapter'

export { LocalAdapter } from './adapter/local'

export { LaravelAdapter, LARAVEL_OPERATOR } from './adapter/laravel'
export type { LaravelAdapterOptions } from './adapter/laravel'

export {
  column,
  formatDefaultValue,
  DEFAULT_ALIGNMENT,
} from './columns'
export type {
  ColumnType,
  ColumnAlignment,
  ColumnDefinition,
  ColumnConfig,
  ActionDefinition,
} from './columns'

export { RsTable } from './engine'
export type { TransformedCell, TransformedRow, RsTableState } from './engine'

export {
  DEFAULT_OPERATORS,
  DEFAULT_OPERATOR,
  applyFilters,
} from './filters'

export type { SortDirection } from './sorting'
export { invertDirection, sortArray } from './sorting'

export {
  calculateTotalPages,
  validatePage,
  paginateArray,
} from './pagination'

export { validateRow, validateRows } from './validation'
export type { ValidationError } from './validation'
