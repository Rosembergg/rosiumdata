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

export {
  coluna,
  formatarValorPadrao,
  ALINHAMENTO_PADRAO,
} from './columns'
export type {
  ColumnType,
  ColumnAlignment,
  ColumnDefinition,
  ColumnConfig,
} from './columns'

export { RsTable } from './engine'
export type { TransformedCell, TransformedRow, RsTableState } from './engine'

export { OPERADORES_PADRAO, OPERADOR_PADRAO } from './filters'

export type { SortDirection } from './sorting'
export { inverterDirecao } from './sorting'

export { calcularTotalPaginas, validarPagina } from './pagination'

export { validarLinha, validarLinhas } from './validation'
export type { ValidationError } from './validation'
