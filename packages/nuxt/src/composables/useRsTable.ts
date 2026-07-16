import { computed, ref, shallowRef, getCurrentScope, onScopeDispose } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { RsTable, ALINHAMENTO_PADRAO, OPERADOR_PADRAO } from '@rsdata/core'
import type {
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

export interface UseRsTableOptions {
  columns: ColumnDefinition[]
  adapter: DataAdapter
  pageSize?: number
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
  esconderColuna: (key: string) => void
  mostrarColuna: (key: string) => void
  reordenarColunas: (keys: string[]) => void

  /** Dispara o primeiro fetch (recarrega a página atual) */
  carregar: () => Promise<void>
  /** Remove os listeners registrados no Core (chamado automaticamente no unmount) */
  desconectar: () => void

  /** Alinhamento efetivo de uma coluna (customizado ou padrão do tipo) */
  alinhamento: (col: ColumnDefinition) => ColumnAlignment
  /** Operador de filtro efetivo de uma coluna (customizado ou padrão do tipo) */
  operadorPadrao: (col: ColumnDefinition) => string
}

export function useRsTable(fonte: RsTable | UseRsTableOptions): UseRsTableContext {
  const tabela = fonte instanceof RsTable ? fonte : criarTabela(fonte)

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
  }

  tabela.on('dados:carregados', aoCarregarDados)
  tabela.on('erro', aoErro)
  tabela.on('estado:alterado', aoEstadoAlterado)

  function desconectar(): void {
    tabela.off('dados:carregados', aoCarregarDados)
    tabela.off('erro', aoErro)
    tabela.off('estado:alterado', aoEstadoAlterado)
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
    esconderColuna: (key) => tabela.esconderColuna(key),
    mostrarColuna: (key) => tabela.mostrarColuna(key),
    reordenarColunas: (keys) => tabela.reordenarColunas(keys),
    carregar: () => executar(() => tabela.irParaPagina(paginaAtual.value)),
    desconectar,
    alinhamento: (col) => col.alignment ?? ALINHAMENTO_PADRAO[col.type],
    operadorPadrao: (col) => col.defaultOperator ?? OPERADOR_PADRAO[col.type],
  }
}

function criarTabela(options: UseRsTableOptions): RsTable {
  const tabela = new RsTable({
    columns: options.columns,
    pageSize: options.pageSize,
  })
  tabela.usarAdapter(options.adapter)
  return tabela
}
