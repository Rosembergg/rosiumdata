import { describe, it, expect, vi } from 'vitest'
import { RsTable, coluna, LocalAdapter } from '@rsdata/core'
import type { ColumnDefinition, Row } from '@rsdata/core'

const colunas: ColumnDefinition[] = [
  coluna('id', { type: 'numero' }),
  coluna('nome', { type: 'texto' }),
  coluna('preco', { type: 'numero' }),
  coluna('ativo', { type: 'booleano' }),
  coluna('criadoEm', { type: 'data' }),
  coluna('status', { type: 'selecao', options: { 1: 'Ativo', 2: 'Inativo', 3: 'Pendente' } }),
  coluna('acoes', { type: 'acao' }),
]

const dados: Row[] = [
  { id: 1, nome: 'Produto A', preco: 10.5, ativo: true, criadoEm: '2024-01-15', status: 1 },
  { id: 2, nome: 'Produto B', preco: 25.0, ativo: false, criadoEm: '2024-03-20', status: 2 },
  { id: 3, nome: 'Servico C', preco: 99.9, ativo: true, criadoEm: '2024-06-01', status: 1 },
  { id: 4, nome: 'Zebrinha D', preco: 50.0, ativo: true, criadoEm: '2024-12-31', status: 3 },
  { id: 5, nome: 'Item E', preco: 15.0, ativo: false, criadoEm: '2024-02-14', status: 2 },
]

describe('Integracao RsTable + LocalAdapter — fluxo completo', () => {
  it('deve carregar dados e retornar linhas transformadas', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const linhas = tabela.getLinhas()
    expect(linhas).toHaveLength(5)

    expect(linhas[0]!.nome!.raw).toBe('Produto A')
    expect(linhas[0]!.nome!.display).toBe('Produto A')

    expect(linhas[0]!.preco!.raw).toBe(10.5)

    expect(linhas[0]!.status!.raw).toBe(1)
    expect(linhas[0]!.status!.display).toBe('Ativo')
  })

  it('deve filtrar via RsTable.filtrar e refletir no adapter', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    await tabela.filtrar({ column: 'nome', operator: 'contem', value: 'Produto' })

    const linhas = tabela.getLinhas()
    expect(linhas).toHaveLength(2)
    expect(tabela.getTotal()).toBe(2)
  })

  it('deve ordenar via RsTable.ordenar e refletir no adapter', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.ordenar('preco', 'asc')

    const linhas = tabela.getLinhas()
    expect(linhas[0]!.preco!.raw).toBe(10.5)
    expect(linhas[4]!.preco!.raw).toBe(99.9)
  })

  it('deve paginar via RsTable.irParaPagina', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas, pageSize: 2 })
    tabela.usarAdapter(adapter)

    await tabela.irParaPagina(1)
    expect(tabela.getLinhas()).toHaveLength(2)

    await tabela.irParaPagina(2)
    expect(tabela.getLinhas()).toHaveLength(2)

    await tabela.irParaPagina(3)
    expect(tabela.getLinhas()).toHaveLength(1)
  })

  it('fluxo: filtrar → ordenar → paginar', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas, pageSize: 2 })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'ativo', operator: 'igual', value: true })
    await tabela.ordenar('preco', 'asc')

    await tabela.irParaPagina(1)
    let linhas = tabela.getLinhas()
    expect(linhas).toHaveLength(2)
    expect(linhas[0]!.preco!.raw).toBe(10.5)
    expect(linhas[1]!.preco!.raw).toBe(50.0)

    await tabela.irParaPagina(2)
    linhas = tabela.getLinhas()
    expect(linhas).toHaveLength(1)
    expect(linhas[0]!.preco!.raw).toBe(99.9)

    expect(tabela.getTotal()).toBe(3)
  })

  it('tabela vazia funciona', async () => {
    const adapter = new LocalAdapter([])
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.irParaPagina(1)
    expect(tabela.getLinhas()).toEqual([])
    expect(tabela.getTotal()).toBe(0)
  })

  it('deve emitir dados:carregados com dados do adapter', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('dados:carregados', handler)

    await tabela.irParaPagina(1)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('deve emitir estado:alterado apos operacoes', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('estado:alterado', handler)

    await tabela.irParaPagina(1)
    expect(handler).toHaveBeenCalled()
    const estado = tabela.getEstado()
    expect(estado.total).toBe(5)
  })
})

describe('Integracao — Falhe Alto com dados do adapter', () => {
  it('deve emitir erro para dado invalido vindo do adapter', async () => {
    const dadosInvalidos: Row[] = [
      { nome: 123, preco: 10 },
    ]
    const adapter = new LocalAdapter(dadosInvalidos)
    const colunasValidacao: ColumnDefinition[] = [
      coluna('nome', { type: 'texto' }),
      coluna('preco', { type: 'numero' }),
    ]
    const tabela = new RsTable({ columns: colunasValidacao })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('erro', handler)

    await tabela.irParaPagina(1)

    const chamadasErro = handler.mock.calls.filter(
      (call) => call[0] && (call[0] as Record<string, unknown>).column === 'nome'
    )
    expect(chamadasErro.length).toBe(1)
    expect(chamadasErro[0]![0]).toMatchObject({
      column: 'nome',
      rowIndex: 0,
      expected: 'texto',
      received: 123,
    })
  })

  it('nao deve emitir erro para dados validos', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('erro', handler)

    await tabela.irParaPagina(1)
    expect(handler).not.toHaveBeenCalled()
  })

  it('deve emitir erro quando adapter nao configurado', async () => {
    const tabela = new RsTable({ columns: colunas })

    const handler = vi.fn()
    tabela.on('erro', handler)

    await tabela.irParaPagina(1)
    expect(handler).toHaveBeenCalled()
  })
})

describe('Integracao — getEstado com LocalAdapter', () => {
  it('estado deve refletir dados do adapter', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas, pageSize: 2 })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'ativo', operator: 'igual', value: true })
    await tabela.ordenar('preco', 'asc')
    await tabela.irParaPagina(1)

    const estado = tabela.getEstado()
    expect(estado.total).toBe(3)
    expect(estado.page).toBe(1)
    expect(estado.pageSize).toBe(2)
    expect(estado.rows).toHaveLength(2)
    expect(estado.totalPages).toBe(2)
    expect(estado.filters).toHaveLength(1)
    expect(estado.sort).toEqual({ column: 'preco', direction: 'asc' })
  })

  it('estado com filtro sem match', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'nome', operator: 'contem', value: 'Inexistente' })
    await tabela.irParaPagina(1)

    const estado = tabela.getEstado()
    expect(estado.total).toBe(0)
    expect(estado.rows).toHaveLength(0)
    expect(estado.totalPages).toBe(0)
  })
})

describe('Integracao — colunas gerenciadas com LocalAdapter', () => {
  it('esconder/mostrar coluna nao afeta os dados', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    tabela.esconderColuna('id')
    const estado = tabela.getEstado()
    expect(estado.visibleColumns).not.toContain('id')
    expect(estado.rows).toHaveLength(5)

    tabela.mostrarColuna('id')
    expect(tabela.getEstado().visibleColumns).toContain('id')
  })
})

describe('Integracao — operadores de filtro especificos com dados reais', () => {
  it('filtro de data — entre', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'criadoEm', operator: 'entre', value: ['2024-01-01', '2024-03-31'] })
    await tabela.irParaPagina(1)

    expect(tabela.getTotal()).toBe(3)
    const ids = tabela.getLinhas().map((l) => l.id!.raw)
    expect(ids).toEqual([1, 2, 5])
  })

  it('filtro de data — antes', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'criadoEm', operator: 'antes', value: '2024-03-01' })
    await tabela.irParaPagina(1)

    expect(tabela.getTotal()).toBe(2)
  })

  it('filtro de data — depois', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'criadoEm', operator: 'depois', value: '2024-05-01' })
    await tabela.irParaPagina(1)

    expect(tabela.getTotal()).toBe(2)
  })

  it('filtro numero — entre', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'preco', operator: 'entre', value: [20, 60] })
    await tabela.irParaPagina(1)

    expect(tabela.getTotal()).toBe(2)
  })

  it('filtros multiplos AND — numero + booleano', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'preco', operator: '>', value: 20 })
    await tabela.filtrar({ column: 'ativo', operator: 'igual', value: true })
    await tabela.irParaPagina(1)

    expect(tabela.getTotal()).toBe(2)
  })

  it('filtro removido por valor vazio', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'nome', operator: 'contem', value: 'Produto' })
    await tabela.filtrar({ column: 'nome', operator: 'contem', value: '' })
    await tabela.irParaPagina(1)

    expect(tabela.getTotal()).toBe(5)
  })
})

describe('Integracao — troca de adapter', () => {
  it('deve funcionar com adapter trocado em runtime', async () => {
    const adapter1 = new LocalAdapter([{ id: 1, nome: 'A' }])
    const adapter2 = new LocalAdapter([{ id: 2, nome: 'B' }, { id: 3, nome: 'C' }])

    const colunasSimples: ColumnDefinition[] = [
      coluna('id', { type: 'numero' }),
      coluna('nome', { type: 'texto' }),
    ]

    const tabela = new RsTable({ columns: colunasSimples })
    tabela.usarAdapter(adapter1)
    await tabela.irParaPagina(1)
    expect(tabela.getTotal()).toBe(1)

    tabela.usarAdapter(adapter2)
    await tabela.irParaPagina(1)
    expect(tabela.getTotal()).toBe(2)
  })
})
