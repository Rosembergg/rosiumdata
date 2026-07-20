import { computed, ref, shallowRef, getCurrentScope, onScopeDispose } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { RosiumTable, DEFAULT_ALIGNMENT, DEFAULT_OPERATOR, column } from '@rosiumdata/core'
import type {
  ActionDefinition,
  ColumnAlignment,
  ColumnDefinition,
  DataAdapter,
  Filter,
  RosiumTableState,
  SortDirection,
  TransformedRow,
  ValidationError,
} from '@rosiumdata/core'

export type {
  ColumnAlignment,
  ColumnDefinition,
  DataAdapter,
  Filter,
  RosiumTableState,
  SortDirection,
  TransformedRow,
  ValidationError,
}

export type { RosiumTable } from '@rosiumdata/core'

/**
 * Definição declarativa de uma action (gatilho).
 *
 * A rosiumdata renderiza o botão e emite o evento com o dado da linha — a lógica
 * do que acontece depois (API, exclusão, navegação) é 100% do usuário.
 * A rosiumdata é o transportador; o usuário traz a arma.
 */
export type { ActionDefinition as RosiumActionDefinition }
export type { ActionDefinition }

/** Payload do evento 'action': qual action e a linha completa (raw + display) */
export interface RosiumActionEvent {
  key: string
  row: TransformedRow
}

/**
 * Helper para definir uma coluna do tipo 'acao' com actions tipadas.
 *
 * As actions são guardadas em `options.actions`. O Core tipa `options`
 * como `Record<string, unknown> & { actions?: ActionDefinition[] }`
 * — ver interface ColumnDefinition em @rosiumdata/core.
 */
export function actionColumn(
  key: string,
  config: { label?: string; actions: ActionDefinition[] },
): ColumnDefinition {
  const def = column(key, { type: 'action', label: config.label })
  def.options = { actions: config.actions }
  return def
}

/**
 * Preferências de exibição persistidas em localStorage.
 * Estado de UI (nunca dado) — lógica 100% do composable, zero no Core.
 */
export interface RosiumPreferences {
  /** Visible columns, in display order */
  visibleColumns: string[]
  /** Page size */
  pageSize: number
}

const STORAGE_PREFIX = 'rosiumdata:'

export function readPreferences(key: string): RosiumPreferences | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<RosiumPreferences>
    if (!Array.isArray(data.visibleColumns)) return null
    return {
      visibleColumns: data.visibleColumns.filter((k): k is string => typeof k === 'string'),
      pageSize: typeof data.pageSize === 'number' ? data.pageSize : 0,
    }
  } catch {
    return null
  }
}

export function savePreferences(key: string, prefs: RosiumPreferences): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(prefs))
  } catch {
    /* storage full or unavailable — preferences are convenience, not data */
  }
}

export interface UseRosiumTableOptions {
  columns: ColumnDefinition[]
  adapter: DataAdapter
  pageSize?: number
}

export interface UseRosiumTableExtras {
  /**
   * Persistence key for preferences (visible columns, order, pageSize)
   * in localStorage. Without the key, nothing is saved or restored — behavior
   * is explicit, visible in user code (Principle #6).
   */
  persistence?: string
}

export interface UseRosiumTableContext {
  /** Core instance being observed */
  table: RosiumTable

  /** Rows of the current page (raw + display, transformed by Core) */
  rows: Ref<TransformedRow[]>
  /** Total record count (all pages) */
  total: Ref<number>
  /** Current page (1-based) */
  currentPage: Ref<number>
  /** Total pages */
  totalPages: Ref<number>
  /** Active sort (column + direction) or undefined */
  sortState: Ref<{ column: string; direction: SortDirection } | undefined>
  /** Active filters */
  filters: Ref<Filter[]>
  /** Visible columns, in display order defined by Core */
  columns: ComputedRef<ColumnDefinition[]>
  /** All defined columns (visible or not), in definition order */
  allColumns: ComputedRef<ColumnDefinition[]>
  /** True while an async operation is in progress */
  loading: Ref<boolean>
  /** Last error emitted by Core (Falhe Alto), or null */
  error: Ref<ValidationError | null>
  /** All errors emitted since last operation */
  errors: Ref<ValidationError[]>

  /** Delegate to Core */
  filter: (filter: Filter) => Promise<void>
  sort: (column: string, direction: SortDirection) => Promise<void>
  goToPage: (n: number) => Promise<void>
  setPageSize: (n: number) => Promise<void>
  hideColumn: (key: string) => void
  showColumn: (key: string) => void
  reorderColumns: (keys: string[]) => void

  /** Triggers the first fetch (reloads current page) */
  load: () => Promise<void>
  /** Removes listeners registered on Core (called automatically on unmount) */
  disconnect: () => void

  /**
   * Listens to Render events. Today the only event is 'action': fired when
   * the user clicks an action button in a row. The event does NOT execute
   * anything — it only notifies ({ key, row }). Logic belongs to the consumer.
   */
  on: (event: 'action', callback: (payload: RosiumActionEvent) => void) => void
  /** Removes a listener registered with on() */
  off: (event: 'action', callback: (payload: RosiumActionEvent) => void) => void
  /**
   * Emits the 'action' event to registered listeners. Called by Render
   * components (RosiumTbody/RosiumActions) on click — never executes business logic.
   */
  emitAction: (payload: RosiumActionEvent) => void

  /** Effective alignment of a column (custom or type default) */
  alignment: (col: ColumnDefinition) => ColumnAlignment
  /** Effective filter operator of a column (custom or type default) */
  defaultOperator: (col: ColumnDefinition) => string
}

export function useRosiumTable(
  source: RosiumTable | UseRosiumTableOptions,
  extras: UseRosiumTableExtras = {},
): UseRosiumTableContext {
  const persistenceKey = extras.persistence
  const preferences = persistenceKey ? readPreferences(persistenceKey) : null

  const table = source instanceof RosiumTable ? source : createTable(source, preferences)

  /* Restore visible columns and order via official Core API */
  if (preferences && preferences.visibleColumns.length > 0) {
    const defined = new Set(table.getState().columns.map((c) => c.key))
    const saved = preferences.visibleColumns.filter((k) => defined.has(k))
    if (saved.length > 0) {
      for (const key of saved) table.showColumn(key)
      for (const key of defined) {
        if (!saved.includes(key)) table.hideColumn(key)
      }
      table.reorderColumns(saved)
    }
  }

  const initialState = table.getState()

  const rows = shallowRef<TransformedRow[]>(initialState.rows)
  const total = ref(initialState.total)
  const currentPage = ref(initialState.page)
  const totalPages = ref(initialState.totalPages)
  const sortState = ref(initialState.sort)
  const filters = ref<Filter[]>(initialState.filters)
  const loading = ref(false)
  const error = ref<ValidationError | null>(null)
  const errors = ref<ValidationError[]>([])

  const definitions = shallowRef<ColumnDefinition[]>(initialState.columns)
  const visibleKeys = ref<string[]>(initialState.visibleColumns)

  const columns = computed<ColumnDefinition[]>(() =>
    visibleKeys.value
      .map((key) => definitions.value.find((c) => c.key === key))
      .filter((c): c is ColumnDefinition => c !== undefined),
  )

  const allColumns = computed<ColumnDefinition[]>(() => definitions.value)

  const onDataLoaded = (...args: unknown[]) => {
    rows.value = args[0] as TransformedRow[]
  }

  const onError = (...args: unknown[]) => {
    const e = args[0] as ValidationError
    error.value = e
    errors.value = [...errors.value, e]
  }

  const onStateChanged = (...args: unknown[]) => {
    const state = args[0] as RosiumTableState
    rows.value = state.rows
    total.value = state.total
    currentPage.value = state.page
    totalPages.value = state.totalPages
    sortState.value = state.sort
    filters.value = state.filters
    definitions.value = state.columns
    visibleKeys.value = state.visibleColumns

    if (persistenceKey && typeof window !== 'undefined') {
      savePreferences(persistenceKey, {
        visibleColumns: state.visibleColumns,
        pageSize: state.pageSize,
      })
    }
  }

  table.on('data:loaded', onDataLoaded)
  table.on('error', onError)
  table.on('state:changed', onStateChanged)

  /* Action listeners (Render → consumer). Trigger, never executor. */
  const actionListeners = new Set<(payload: RosiumActionEvent) => void>()

  function on(event: 'action', callback: (payload: RosiumActionEvent) => void): void {
    if (event === 'action') actionListeners.add(callback)
  }

  function off(event: 'action', callback: (payload: RosiumActionEvent) => void): void {
    if (event === 'action') actionListeners.delete(callback)
  }

  function emitAction(payload: RosiumActionEvent): void {
    for (const listener of [...actionListeners]) listener(payload)
  }

  function disconnect(): void {
    table.off('data:loaded', onDataLoaded)
    table.off('error', onError)
    table.off('state:changed', onStateChanged)
    actionListeners.clear()
  }

  if (getCurrentScope()) {
    onScopeDispose(disconnect)
  }

  async function execute(operation: () => Promise<void>): Promise<void> {
    loading.value = true
    error.value = null
    errors.value = []
    try {
      await operation()
    } finally {
      loading.value = false
    }
  }

  return {
    table,
    rows,
    total,
    currentPage,
    totalPages,
    sortState,
    filters,
    columns,
    allColumns,
    loading,
    error,
    errors,
    filter: (filter) => execute(() => table.filter(filter)),
    sort: (column, direction) => execute(() => table.sort(column, direction)),
    goToPage: (n) => execute(() => table.goToPage(n)),
    setPageSize: (n) => execute(() => table.setPageSize(n)),
    hideColumn: (key) => table.hideColumn(key),
    showColumn: (key) => table.showColumn(key),
    reorderColumns: (keys) => table.reorderColumns(keys),
    load: () => execute(() => table.goToPage(currentPage.value)),
    disconnect,
    on,
    off,
    emitAction,
    alignment: (col) => col.alignment ?? DEFAULT_ALIGNMENT[col.type],
    defaultOperator: (col) => col.defaultOperator ?? DEFAULT_OPERATOR[col.type],
  }
}

function createTable(
  options: UseRosiumTableOptions,
  preferences: RosiumPreferences | null,
): RosiumTable {
  const savedPageSize =
    preferences && preferences.pageSize > 0 ? preferences.pageSize : undefined
  const table = new RosiumTable({
    columns: options.columns,
    pageSize: savedPageSize ?? options.pageSize,
  })
  table.useAdapter(options.adapter)
  return table
}
