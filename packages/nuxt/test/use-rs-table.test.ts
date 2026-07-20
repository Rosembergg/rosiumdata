import { describe, it, expect, vi } from 'vitest'
import { RsTable, LocalAdapter, column } from '@rosiumdata/core'
import type { DataAdapter, Query, Row } from '@rosiumdata/core'
import { useRsTable } from '@rosiumdata/nuxt'

const DADOS: Row[] = [
  { id: 1, nome: 'Coca-Cola', preco: 5.99, ativo: true, status: 1 },
  { id: 2, nome: 'Guarana', preco: 4.5, ativo: true, status: 1 },
  { id: 3, nome: 'Agua', preco: 2.0, ativo: false, status: 2 },
  { id: 4, nome: 'Suco', preco: 7.25, ativo: true, status: 1 },
  { id: 5, nome: 'Cerveja', preco: 8.9, ativo: false, status: 2 },
]

const COLUNAS = [
  column('id', { type: 'number' }),
  column('nome', { type: 'text' }),
  column('preco', { type: 'number', mask: 'R$ #.##0,00' }),
  column('ativo', { type: 'boolean' }),
  column('status', { type: 'select', options: { 1: 'Ativo', 2: 'Inativo' } }),
]

function criarContexto(pageSize = 2) {
  const table = new RsTable({ columns: COLUNAS, pageSize })
  table.useAdapter(new LocalAdapter(DADOS))
  return useRsTable(table)
}

describe('useRsTable — conexão com o Core', () => {
  it('aceita uma instância RsTable e expõe o estado inicial', () => {
    const ctx = criarContexto()
    expect(ctx.rows.value).toEqual([])
    expect(ctx.total.value).toBe(0)
    expect(ctx.currentPage.value).toBe(1)
    expect(ctx.sortState.value).toBeUndefined()
    expect(ctx.filters.value).toEqual([])
    expect(ctx.loading.value).toBe(false)
    expect(ctx.error.value).toBeNull()
  })

  it('aceita { columns, adapter } no modo rápido e cria a instância', async () => {
    const ctx = useRsTable({
      columns: COLUNAS,
      adapter: new LocalAdapter(DADOS),
      pageSize: 3,
    })
    await ctx.load()
    expect(ctx.rows.value).toHaveLength(3)
    expect(ctx.total.value).toBe(5)
  })

  it('carregar() dispara o primeiro fetch e popula o estado reativo', async () => {
    const ctx = criarContexto()
    await ctx.load()
    expect(ctx.rows.value).toHaveLength(2)
    expect(ctx.total.value).toBe(5)
    expect(ctx.totalPages.value).toBe(3)
  })

  it('linhas expõem raw e display vindos do Core (Linha Sagrada)', async () => {
    const ctx = criarContexto()
    await ctx.load()
    const primeira = ctx.rows.value[0]!
    expect(primeira.preco!.raw).toBe(5.99)
    expect(primeira.preco!.display).toContain('5,99')
    expect(primeira.ativo!.display).toBe('Yes')
    expect(primeira.status!.display).toBe('Ativo')
  })
})

describe('useRsTable — reage a eventos do Core', () => {
  it('atualiza linhas quando o Core emite dados:carregados (chamada direta no Core)', async () => {
    const table = new RsTable({ columns: COLUNAS, pageSize: 10 })
    table.useAdapter(new LocalAdapter(DADOS))
    const ctx = useRsTable(table)

    await table.goToPage(1)

    expect(ctx.rows.value).toHaveLength(5)
    expect(ctx.total.value).toBe(5)
  })

  it('atualiza colunas quando o Core esconde/mostra/reordena', () => {
    const ctx = criarContexto()
    expect(ctx.columns.value.map((c) => c.key)).toEqual(['id', 'nome', 'preco', 'ativo', 'status'])

    ctx.hideColumn('id')
    expect(ctx.columns.value.map((c) => c.key)).toEqual(['nome', 'preco', 'ativo', 'status'])

    ctx.showColumn('id')
    expect(ctx.columns.value.map((c) => c.key)).toContain('id')

    ctx.reorderColumns(['nome', 'id', 'preco', 'ativo', 'status'])
    expect(ctx.columns.value.map((c) => c.key)).toEqual(['nome', 'id', 'preco', 'ativo', 'status'])
  })

  it('captura evento erro do Core (Falhe Alto)', async () => {
    const table = new RsTable({ columns: COLUNAS, pageSize: 10 })
    table.useAdapter(new LocalAdapter([{ id: 1, nome: 123, preco: 1, ativo: true, status: 1 }]))
    const ctx = useRsTable(table)

    await ctx.load()

    expect(ctx.error.value).not.toBeNull()
    expect(ctx.error.value!.column).toBe('nome')
    expect(ctx.error.value!.rowIndex).toBe(0)
    expect(ctx.errors.value).toHaveLength(1)
  })

  it('emite erro quando não há adapter configurado', async () => {
    const table = new RsTable({ columns: COLUNAS })
    const ctx = useRsTable(table)

    await ctx.load()

    expect(ctx.error.value).not.toBeNull()
    expect(ctx.error.value!.received).toBe('no adapter')
  })
})

describe('useRsTable — métodos delegam ao Core', () => {
  it('filtrar() delega e atualiza linhas/filtros', async () => {
    const ctx = criarContexto(10)
    await ctx.load()

    await ctx.filter({ column: 'nome', operator: 'contains', value: 'co' })

    expect(ctx.filters.value).toHaveLength(1)
    expect(ctx.total.value).toBe(2)
    const nomes = ctx.rows.value.map((l) => l.nome!.raw)
    expect(nomes).toEqual(['Coca-Cola', 'Suco'])
  })

  it('filtrar() com valor vazio remove o filtro', async () => {
    const ctx = criarContexto(10)
    await ctx.filter({ column: 'nome', operator: 'contains', value: 'co' })
    expect(ctx.total.value).toBe(2)

    await ctx.filter({ column: 'nome', operator: 'contains', value: '' })
    expect(ctx.filters.value).toHaveLength(0)
    expect(ctx.total.value).toBe(5)
  })

  it('ordenar() delega e atualiza ordenacao', async () => {
    const ctx = criarContexto(10)
    await ctx.sort('preco', 'asc')

    expect(ctx.sortState.value).toEqual({ column: 'preco', direction: 'asc' })
    expect(ctx.rows.value[0]!.nome!.raw).toBe('Agua')

    await ctx.sort('preco', 'desc')
    expect(ctx.rows.value[0]!.nome!.raw).toBe('Cerveja')
  })

  it('irParaPagina() delega e atualiza paginaAtual', async () => {
    const ctx = criarContexto(2)
    await ctx.load()

    await ctx.goToPage(2)
    expect(ctx.currentPage.value).toBe(2)
    expect(ctx.rows.value[0]!.nome!.raw).toBe('Agua')

    await ctx.goToPage(99)
    expect(ctx.currentPage.value).toBe(3)
  })
})

describe('useRsTable — loading', () => {
  it('loading fica true durante o fetch e false ao terminar', async () => {
    let resolver!: (value: { rows: Row[]; total: number }) => void
    const adapterLento: DataAdapter = {
      fetch: (_query: Query) => new Promise((resolve) => { resolver = resolve }),
      fetchAll: async () => [],
    }
    const table = new RsTable({ columns: COLUNAS })
    table.useAdapter(adapterLento)
    const ctx = useRsTable(table)

    const pendente = ctx.load()
    expect(ctx.loading.value).toBe(true)

    resolver({ rows: DADOS, total: 5 })
    await pendente
    expect(ctx.loading.value).toBe(false)
    expect(ctx.rows.value).toHaveLength(5)
  })
})

describe('useRsTable — helpers de apresentação', () => {
  it('alinhamento() usa o padrão do tipo ou o customizado', () => {
    const ctx = criarContexto()
    expect(ctx.alignment(column('n', { type: 'number' }))).toBe('right')
    expect(ctx.alignment(column('t', { type: 'text' }))).toBe('left')
    expect(ctx.alignment(column('b', { type: 'boolean' }))).toBe('center')
    expect(ctx.alignment(column('x', { type: 'number', alignment: 'left' }))).toBe('left')
  })

  it('operadorPadrao() usa o padrão do tipo ou o customizado', () => {
    const ctx = criarContexto()
    expect(ctx.defaultOperator(column('t', { type: 'text' }))).toBe('contains')
    expect(ctx.defaultOperator(column('n', { type: 'number' }))).toBe('=')
    expect(ctx.defaultOperator(column('t', { type: 'text', defaultOperator: 'equals' }))).toBe('equals')
  })
})

describe('useRsTable — desconectar', () => {
  it('remove os listeners do Core', async () => {
    const table = new RsTable({ columns: COLUNAS, pageSize: 10 })
    table.useAdapter(new LocalAdapter(DADOS))
    const ctx = useRsTable(table)

    await ctx.load()
    expect(ctx.rows.value).toHaveLength(5)

    ctx.disconnect()
    await table.filter({ column: 'nome', operator: 'contains', value: 'co' })

    expect(ctx.rows.value).toHaveLength(5)
    expect(ctx.filters.value).toEqual([])
  })

  it('dois consumidores da mesma instância não conflitam', async () => {
    const table = new RsTable({ columns: COLUNAS, pageSize: 10 })
    table.useAdapter(new LocalAdapter(DADOS))
    const a = useRsTable(table)
    const b = useRsTable(table)

    await a.load()
    expect(a.rows.value).toHaveLength(5)
    expect(b.rows.value).toHaveLength(5)
  })
})

describe('useRsTable — mock da RsTable (isolamento do Render)', () => {
  it('escuta eventos sem depender do adapter real', async () => {
    const table = new RsTable({ columns: COLUNAS })
    const fetchMock = vi.fn().mockResolvedValue({ rows: [DADOS[0]], total: 1 })
    table.useAdapter({ fetch: fetchMock, fetchAll: async () => [] })
    const ctx = useRsTable(table)

    await ctx.filter({ column: 'nome', operator: 'contains', value: 'coca' })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ column: 'nome', operator: 'contains', value: 'coca' }],
        page: 1,
      }),
    )
    expect(ctx.rows.value).toHaveLength(1)
    expect(ctx.total.value).toBe(1)
  })
})
