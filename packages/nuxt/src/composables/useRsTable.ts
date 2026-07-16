import { computed, ref, shallowRef, getCurrentScope, onScopeDispose } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { RsTable, ALINHAMENTO_PADRAO, OPERADOR_PADRAO, coluna } from '@rsdata/core'
import type {
  ActionDefinition,
  ColumnAlignment,
  ColumnDefinition,
  DataAdapter,
  Filter,
  RsTableState,
  SortDirection,
  TransformedRow,
  ValidationError,
} from '@rsdata/core'

export type {
  ColumnAlignment,
  ColumnDefinition,
  DataAdapter,
  Filter,
  RsTableState,
  SortDirection,
  TransformedRow,
  ValidationError,
}

export type { RsTable } from '@rsdata/core'

/**
 * Definição declarativa de uma action (gatilho).
 *
 * A RSdata renderiza o botão e emite o evento com o dado da linha — a lógica
 * do que acontece depois (API, exclusão, navegação) é 100% do usuário.
 * A RSdata é o transportador; o usuário traz a arma.
 */
export type { ActionDefinition as RsActionDefinition }
export type { ActionDefinition }

/** Payload do evento 'action': qual action e a linha completa (raw + display) */
export interface RsActionEvent {
  key: string
  row: TransformedRow
}

/**
 * Helper para definir uma coluna do tipo 'acao' com actions tipadas.
 *
 * As actions são guardadas em `options.actions`. O Core tipa `options`
 * como `Record<string, unknown> & { actions?: ActionDefinition[] }`
 * — ver interface ColumnDefinition em @rsdata/core.
 */
export function colunaAcao(
  key: string,
  config: { label?: string; actions: ActionDefinition[] },
): ColumnDefinition {
  const def = coluna(key, { type: 'acao', label: config.label })
  def.options = { actions: config.actions }
  return def
}

/**
 * Preferências de exibição persistidas em localStorage.
 * Estado de UI (nunca dado) — lógica 100% do composable, zero no Core.
 */
export interface RsPreferencias {
  /** Colunas visíveis, na ordem de exibição */
  colunasVisiveis: string[]
  /** Tamanho de página */
  pageSize: number
}

const PREFIXO_STORAGE = 'rsdata:'

export function lerPreferencias(chave: string): RsPreferencias | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const bruto = localStorage.getItem(PREFIXO_STORAGE + chave)
    if (!bruto) return null
    const dados = JSON.parse(bruto) as Partial<RsPreferencias>
    if (!Array.isArray(dados.colunasVisiveis)) return null
    return {
      colunasVisiveis: dados.colunasVisiveis.filter((k): k is string => typeof k === 'string'),
      pageSize: typeof dados.pageSize === 'number' ? dados.pageSize : 0,
    }
  } catch {
    return null
  }
}

export function salvarPreferencias(chave: string, prefs: RsPreferencias): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PREFIXO_STORAGE + chave, JSON.stringify(prefs))
  } catch {
    /* storage cheio ou indisponível — preferências são conveniência, não dado */
  }
}

export interface UseRsTableOptions {
  columns: ColumnDefinition[]
  adapter: DataAdapter
  pageSize?: number
}

export interface UseRsTableExtras {
  /**
   * Chave de persistência de preferências (colunas visíveis, ordem, pageSize)
   * em localStorage. Sem a chave, nada é salvo nem restaurado — comportamento
   * explícito, visível no código de uso (Princípio #6).
   */
  persistencia?: string
}

export interface UseRsTableContext {
  /** Instância do Core sendo observada */
  tabela: RsTable

  /** Linhas da página atual (raw + display, transformadas pelo Core) */
  linhas: Ref<TransformedRow[]>
  /** Total de registros (todas as páginas) */
  total: Ref<number>
  /** Página atual (1-based) */
  paginaAtual: Ref<number>
  /** Total de páginas */
  totalPaginas: Ref<number>
  /** Ordenação ativa (coluna + direção) ou undefined */
  ordenacao: Ref<{ column: string; direction: SortDirection } | undefined>
  /** Filtros ativos */
  filtros: Ref<Filter[]>
  /** Colunas visíveis, na ordem de exibição definida pelo Core */
  colunas: ComputedRef<ColumnDefinition[]>
  /** Todas as colunas definidas (visíveis ou não), na ordem de definição */
  todasColunas: ComputedRef<ColumnDefinition[]>
  /** Verdadeiro enquanto uma operação assíncrona está em andamento */
  loading: Ref<boolean>
  /** Último erro emitido pelo Core (Falhe Alto), ou null */
  erro: Ref<ValidationError | null>
  /** Todos os erros emitidos desde a última operação */
  erros: Ref<ValidationError[]>

  /** Delegam ao Core */
  filtrar: (filter: Filter) => Promise<void>
  ordenar: (column: string, direction: SortDirection) => Promise<void>
  irParaPagina: (n: number) => Promise<void>
  setPageSize: (n: number) => Promise<void>
  esconderColuna: (key: string) => void
  mostrarColuna: (key: string) => void
  reordenarColunas: (keys: string[]) => void

  /** Dispara o primeiro fetch (recarrega a página atual) */
  carregar: () => Promise<void>
  /** Remove os listeners registrados no Core (chamado automaticamente no unmount) */
  desconectar: () => void

  /**
   * Escuta eventos do Render. Hoje o único evento é 'action': disparado quando
   * o usuário clica em um botão de ação de uma linha. O evento NÃO executa
   * nada — apenas notifica ({ key, row }). A lógica é do consumidor.
   */
  on: (evento: 'action', callback: (payload: RsActionEvent) => void) => void
  /** Remove um listener registrado com on() */
  off: (evento: 'action', callback: (payload: RsActionEvent) => void) => void
  /**
   * Dispara o evento 'action' para os listeners registrados. Chamado pelos
   * componentes de Render (RsTbody/RsActions) ao capturar o clique — nunca
   * executa lógica de negócio.
   */
  emitirAcao: (payload: RsActionEvent) => void

  /** Alinhamento efetivo de uma coluna (customizado ou padrão do tipo) */
  alinhamento: (col: ColumnDefinition) => ColumnAlignment
  /** Operador de filtro efetivo de uma coluna (customizado ou padrão do tipo) */
  operadorPadrao: (col: ColumnDefinition) => string
}

export function useRsTable(
  fonte: RsTable | UseRsTableOptions,
  extras: UseRsTableExtras = {},
): UseRsTableContext {
  const chavePersistencia = extras.persistencia
  const preferencias = chavePersistencia ? lerPreferencias(chavePersistencia) : null

  const tabela = fonte instanceof RsTable ? fonte : criarTabela(fonte, preferencias)

  /* Restaura colunas visíveis e ordem via API oficial do Core */
  if (preferencias && preferencias.colunasVisiveis.length > 0) {
    const definidas = new Set(tabela.getEstado().columns.map((c) => c.key))
    const salvas = preferencias.colunasVisiveis.filter((k) => definidas.has(k))
    if (salvas.length > 0) {
      for (const key of salvas) tabela.mostrarColuna(key)
      for (const key of definidas) {
        if (!salvas.includes(key)) tabela.esconderColuna(key)
      }
      tabela.reordenarColunas(salvas)
    }
  }

  const estadoInicial = tabela.getEstado()

  const linhas = shallowRef<TransformedRow[]>(estadoInicial.rows)
  const total = ref(estadoInicial.total)
  const paginaAtual = ref(estadoInicial.page)
  const totalPaginas = ref(estadoInicial.totalPages)
  const ordenacao = ref(estadoInicial.sort)
  const filtros = ref<Filter[]>(estadoInicial.filters)
  const loading = ref(false)
  const erro = ref<ValidationError | null>(null)
  const erros = ref<ValidationError[]>([])

  const definicoes = shallowRef<ColumnDefinition[]>(estadoInicial.columns)
  const chavesVisiveis = ref<string[]>(estadoInicial.visibleColumns)

  const colunas = computed<ColumnDefinition[]>(() =>
    chavesVisiveis.value
      .map((key) => definicoes.value.find((c) => c.key === key))
      .filter((c): c is ColumnDefinition => c !== undefined),
  )

  const todasColunas = computed<ColumnDefinition[]>(() => definicoes.value)

  const aoCarregarDados = (...args: unknown[]) => {
    linhas.value = args[0] as TransformedRow[]
  }

  const aoErro = (...args: unknown[]) => {
    const e = args[0] as ValidationError
    erro.value = e
    erros.value = [...erros.value, e]
  }

  const aoEstadoAlterado = (...args: unknown[]) => {
    const estado = args[0] as RsTableState
    linhas.value = estado.rows
    total.value = estado.total
    paginaAtual.value = estado.page
    totalPaginas.value = estado.totalPages
    ordenacao.value = estado.sort
    filtros.value = estado.filters
    definicoes.value = estado.columns
    chavesVisiveis.value = estado.visibleColumns

    if (chavePersistencia) {
      salvarPreferencias(chavePersistencia, {
        colunasVisiveis: estado.visibleColumns,
        pageSize: estado.pageSize,
      })
    }
  }

  tabela.on('dados:carregados', aoCarregarDados)
  tabela.on('erro', aoErro)
  tabela.on('estado:alterado', aoEstadoAlterado)

  /* Listeners de action (Render → consumidor). Gatilho, nunca executor. */
  const listenersAcao = new Set<(payload: RsActionEvent) => void>()

  function on(evento: 'action', callback: (payload: RsActionEvent) => void): void {
    if (evento === 'action') listenersAcao.add(callback)
  }

  function off(evento: 'action', callback: (payload: RsActionEvent) => void): void {
    if (evento === 'action') listenersAcao.delete(callback)
  }

  function emitirAcao(payload: RsActionEvent): void {
    for (const listener of [...listenersAcao]) listener(payload)
  }

  function desconectar(): void {
    tabela.off('dados:carregados', aoCarregarDados)
    tabela.off('erro', aoErro)
    tabela.off('estado:alterado', aoEstadoAlterado)
    listenersAcao.clear()
  }

  if (getCurrentScope()) {
    onScopeDispose(desconectar)
  }

  async function executar(operacao: () => Promise<void>): Promise<void> {
    loading.value = true
    erro.value = null
    erros.value = []
    try {
      await operacao()
    } finally {
      loading.value = false
    }
  }

  return {
    tabela,
    linhas,
    total,
    paginaAtual,
    totalPaginas,
    ordenacao,
    filtros,
    colunas,
    todasColunas,
    loading,
    erro,
    erros,
    filtrar: (filter) => executar(() => tabela.filtrar(filter)),
    ordenar: (column, direction) => executar(() => tabela.ordenar(column, direction)),
    irParaPagina: (n) => executar(() => tabela.irParaPagina(n)),
    setPageSize: (n) => executar(() => tabela.setPageSize(n)),
    esconderColuna: (key) => tabela.esconderColuna(key),
    mostrarColuna: (key) => tabela.mostrarColuna(key),
    reordenarColunas: (keys) => tabela.reordenarColunas(keys),
    carregar: () => executar(() => tabela.irParaPagina(paginaAtual.value)),
    desconectar,
    on,
    off,
    emitirAcao,
    alinhamento: (col) => col.alignment ?? ALINHAMENTO_PADRAO[col.type],
    operadorPadrao: (col) => col.defaultOperator ?? OPERADOR_PADRAO[col.type],
  }
}

function criarTabela(
  options: UseRsTableOptions,
  preferencias: RsPreferencias | null,
): RsTable {
  const pageSizeSalvo =
    preferencias && preferencias.pageSize > 0 ? preferencias.pageSize : undefined
  const tabela = new RsTable({
    columns: options.columns,
    pageSize: pageSizeSalvo ?? options.pageSize,
  })
  tabela.usarAdapter(options.adapter)
  return tabela
}
