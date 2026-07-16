import { describe, it, expect, vi } from 'vitest'
import { RsTable, LocalAdapter, coluna } from '@rsdata/core'
import type { DataAdapter, Query, Row } from '@rsdata/core'
import { useRsTable } from '@rsdata/nuxt'

const DADOS: Row[] = [
  { id: 1, nome: 'Coca-Cola', preco: 5.99, ativo: true, status: 1 },
  { id: 2, nome: 'Guarana', preco: 4.5, ativo: true, status: 1 },
  { id: 3, nome: 'Agua', preco: 2.0, ativo: false, status: 2 },
  { id: 4, nome: 'Suco', preco: 7.25, ativo: true, status: 1 },
  { id: 5, nome: 'Cerveja', preco: 8.9, ativo: false, status: 2 },
]

const COLUNAS = [
  coluna('id', { type: 'numero' }),
  coluna('nome', { type: 'texto' }),
  coluna('preco', { type: 'numero', mask: 'R$ #.##0,00' }),
  coluna('ativo', { type: 'booleano' }),
  coluna('status', { type: 'selecao', options: { 1: 'Ativo', 2: 'Inativo' } }),
]

function criarContexto(pageSize = 2) {
  const tabela = new RsTable({ columns: COLUNAS, pageSize })
  tabela.usarAdapter(new LocalAdapter(DADOS))
  return useRsTable(tabela)
}

describe('useRsTable — conexão com o Core', () => {
  it('aceita uma instância RsTable e expõe o estado inicial', () => {
    const ctx = criarContexto()
    expect(ctx.linhas.value).toEqual([])
    expect(ctx.total.value).toBe(0)
    expect(ctx.paginaAtual.value).toBe(1)
    expect(ctx.ordenacao.value).toBeUndefined()
    expect(ctx.filtros.value).toEqual([])
    expect(ctx.loading.value).toBe(false)
    expect(ctx.erro.value).toBeNull()
  })

  it('aceita { columns, adapter } no modo rápido e cria a instância', async () => {
    const ctx = useRsTable({
      columns: COLUNAS,
      adapter: new LocalAdapter(DADOS),
      pageSize: 3,
    })
    await ctx.carregar()
    expect(ctx.linhas.value).toHaveLength(3)
    expect(ctx.total.value).toBe(5)
  })

  it('carregar() dispara o primeiro fetch e popula o estado reativo', async () => {
    const ctx = criarContexto()
    await ctx.carregar()
    expect(ctx.linhas.value).toHaveLength(2)
    expect(ctx.total.value).toBe(5)
    expect(ctx.totalPaginas.value).toBe(3)
  })

  it('linhas expõem raw e display vindos do Core (Linha Sagrada)', async () => {
    const ctx = criarContexto()
    await ctx.carregar()
    const primeira = ctx.linhas.value[0]!
    expect(primeira.preco!.raw).toBe(5.99)
    expect(primeira.preco!.display).toContain('5,99')
    expect(primeira.ativo!.display).toBe('Sim')
    expect(primeira.status!.display).toBe('Ativo')
  })
})

describe('useRsTable — reage a eventos do Core', () => {
  it('atualiza linhas quando o Core emite dados:carregados (chamada direta no Core)', async () => {
    const tabela = new RsTable({ columns: COLUNAS, pageSize: 10 })
    tabela.usarAdapter(new LocalAdapter(DADOS))
    const ctx = useRsTable(tabela)

    await tabela.irParaPagina(1)

    expect(ctx.linhas.value).toHaveLength(5)
    expect(ctx.total.value).toBe(5)
  })

  it('atualiza colunas quando o Core esconde/mostra/reordena', () => {
    const ctx = criarContexto()
    expect(ctx.colunas.value.map((c) => c.key)).toEqual(['id', 'nome', 'preco', 'ativo', 'status'])

    ctx.esconderColuna('id')
    expect(ctx.colunas.value.map((c) => c.key)).toEqual(['nome', 'preco', 'ativo', 'status'])

    ctx.mostrarColuna('id')
    expect(ctx.colunas.value.map((c) => c.key)).toContain('id')

    ctx.reordenarColunas(['nome', 'id', 'preco', 'ativo', 'status'])
    expect(ctx.colunas.value.map((c) => c.key)).toEqual(['nome', 'id', 'preco', 'ativo', 'status'])
  })

  it('captura evento erro do Core (Falhe Alto)', async () => {
    const tabela = new RsTable({ columns: COLUNAS, pageSize: 10 })
    tabela.usarAdapter(new LocalAdapter([{ id: 1, nome: 123, preco: 1, ativo: true, status: 1 }]))
    const ctx = useRsTable(tabela)

    await ctx.carregar()

    expect(ctx.erro.value).not.toBeNull()
    expect(ctx.erro.value!.column).toBe('nome')
    expect(ctx.erro.value!.rowIndex).toBe(0)
    expect(ctx.erros.value).toHaveLength(1)
  })

  it('emite erro quando não há adapter configurado', async () => {
    const tabela = new RsTable({ columns: COLUNAS })
    const ctx = useRsTable(tabela)

    await ctx.carregar()

    expect(ctx.erro.value).not.toBeNull()
    expect(ctx.erro.value!.received).toBe('nenhum adapter')
  })
})

describe('useRsTable — métodos delegam ao Core', () => {
  it('filtrar() delega e atualiza linhas/filtros', async () => {
    const ctx = criarContexto(10)
    await ctx.carregar()

    await ctx.filtrar({ column: 'nome', operator: 'contem', value: 'co' })

    expect(ctx.filtros.value).toHaveLength(1)
    expect(ctx.total.value).toBe(2)
    const nomes = ctx.linhas.value.map((l) => l.nome!.raw)
    expect(nomes).toEqual(['Coca-Cola', 'Suco'])
  })

  it('filtrar() com valor vazio remove o filtro', async () => {
    const ctx = criarContexto(10)
    await ctx.filtrar({ column: 'nome', operator: 'contem', value: 'co' })
    expect(ctx.total.value).toBe(2)

    await ctx.filtrar({ column: 'nome', operator: 'contem', value: '' })
    expect(ctx.filtros.value).toHaveLength(0)
    expect(ctx.total.value).toBe(5)
  })

  it('ordenar() delega e atualiza ordenacao', async () => {
    const ctx = criarContexto(10)
    await ctx.ordenar('preco', 'asc')

    expect(ctx.ordenacao.value).toEqual({ column: 'preco', direction: 'asc' })
    expect(ctx.linhas.value[0]!.nome!.raw).toBe('Agua')

    await ctx.ordenar('preco', 'desc')
    expect(ctx.linhas.value[0]!.nome!.raw).toBe('Cerveja')
  })

  it('irParaPagina() delega e atualiza paginaAtual', async () => {
    const ctx = criarContexto(2)
    await ctx.carregar()

    await ctx.irParaPagina(2)
    expect(ctx.paginaAtual.value).toBe(2)
    expect(ctx.linhas.value[0]!.nome!.raw).toBe('Agua')

    await ctx.irParaPagina(99)
    expect(ctx.paginaAtual.value).toBe(3)
  })
})

describe('useRsTable — loading', () => {
  it('loading fica true durante o fetch e false ao terminar', async () => {
    let resolver!: (value: { rows: Row[]; total: number }) => void
    const adapterLento: DataAdapter = {
      fetch: (_query: Query) => new Promise((resolve) => { resolver = resolve }),
      fetchAll: async () => [],
    }
    const tabela = new RsTable({ columns: COLUNAS })
    tabela.usarAdapter(adapterLento)
    const ctx = useRsTable(tabela)

    const pendente = ctx.carregar()
    expect(ctx.loading.value).toBe(true)

    resolver({ rows: DADOS, total: 5 })
    await pendente
    expect(ctx.loading.value).toBe(false)
    expect(ctx.linhas.value).toHaveLength(5)
  })
})

describe('useRsTable — helpers de apresentação', () => {
  it('alinhamento() usa o padrão do tipo ou o customizado', () => {
    const ctx = criarContexto()
    expect(ctx.alinhamento(coluna('n', { type: 'numero' }))).toBe('right')
    expect(ctx.alinhamento(coluna('t', { type: 'texto' }))).toBe('left')
    expect(ctx.alinhamento(coluna('b', { type: 'booleano' }))).toBe('center')
    expect(ctx.alinhamento(coluna('x', { type: 'numero', alignment: 'left' }))).toBe('left')
  })

  it('operadorPadrao() usa o padrão do tipo ou o customizado', () => {
    const ctx = criarContexto()
    expect(ctx.operadorPadrao(coluna('t', { type: 'texto' }))).toBe('contem')
    expect(ctx.operadorPadrao(coluna('n', { type: 'numero' }))).toBe('=')
    expect(ctx.operadorPadrao(coluna('t', { type: 'texto', defaultOperator: 'igual' }))).toBe('igual')
  })
})

describe('useRsTable — desconectar', () => {
  it('remove os listeners do Core', async () => {
    const tabela = new RsTable({ columns: COLUNAS, pageSize: 10 })
    tabela.usarAdapter(new LocalAdapter(DADOS))
    const ctx = useRsTable(tabela)

    await ctx.carregar()
    expect(ctx.linhas.value).toHaveLength(5)

    ctx.desconectar()
    await tabela.filtrar({ column: 'nome', operator: 'contem', value: 'co' })

    expect(ctx.linhas.value).toHaveLength(5)
    expect(ctx.filtros.value).toEqual([])
  })

  it('dois consumidores da mesma instância não conflitam', async () => {
    const tabela = new RsTable({ columns: COLUNAS, pageSize: 10 })
    tabela.usarAdapter(new LocalAdapter(DADOS))
    const a = useRsTable(tabela)
    const b = useRsTable(tabela)

    await a.carregar()
    expect(a.linhas.value).toHaveLength(5)
    expect(b.linhas.value).toHaveLength(5)
  })
})

describe('useRsTable — mock da RsTable (isolamento do Render)', () => {
  it('escuta eventos sem depender do adapter real', async () => {
    const tabela = new RsTable({ columns: COLUNAS })
    const fetchMock = vi.fn().mockResolvedValue({ rows: [DADOS[0]], total: 1 })
    tabela.usarAdapter({ fetch: fetchMock, fetchAll: async () => [] })
    const ctx = useRsTable(tabela)

    await ctx.filtrar({ column: 'nome', operator: 'contem', value: 'coca' })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ column: 'nome', operator: 'contem', value: 'coca' }],
        page: 1,
      }),
    )
    expect(ctx.linhas.value).toHaveLength(1)
    expect(ctx.total.value).toBe(1)
  })
})
