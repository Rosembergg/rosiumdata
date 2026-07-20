import { describe, it, expect, vi } from 'vitest'
import { RosiumTable, column, LocalAdapter } from '@rosiumdata/core'
import type { ColumnDefinition, Row } from '@rosiumdata/core'

const colunas: ColumnDefinition[] = [
  column('id', { type: 'number' }),
  column('nome', { type: 'text' }),
  column('preco', { type: 'number' }),
  column('ativo', { type: 'boolean' }),
  column('criadoEm', { type: 'date' }),
  column('status', { type: 'select', options: { 1: 'Ativo', 2: 'Inativo', 3: 'Pendente' } }),
  column('acoes', { type: 'action' }),
]

const dados: Row[] = [
  { id: 1, nome: 'Produto A', preco: 10.5, ativo: true, criadoEm: '2024-01-15', status: 1 },
  { id: 2, nome: 'Produto B', preco: 25.0, ativo: false, criadoEm: '2024-03-20', status: 2 },
  { id: 3, nome: 'Servico C', preco: 99.9, ativo: true, criadoEm: '2024-06-01', status: 1 },
  { id: 4, nome: 'Zebrinha D', preco: 50.0, ativo: true, criadoEm: '2024-12-31', status: 3 },
  { id: 5, nome: 'Item E', preco: 15.0, ativo: false, criadoEm: '2024-02-14', status: 2 },
]

describe('Integracao RosiumTable + LocalAdapter — fluxo completo', () => {
  it('deve carregar dados e retornar linhas transformadas', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const linhas = tabela.getRows()
    expect(linhas).toHaveLength(5)

    expect(linhas[0]!.nome!.raw).toBe('Produto A')
    expect(linhas[0]!.nome!.display).toBe('Produto A')

    expect(linhas[0]!.preco!.raw).toBe(10.5)

    expect(linhas[0]!.status!.raw).toBe(1)
    expect(linhas[0]!.status!.display).toBe('Ativo')
  })

  it('deve filtrar via RosiumTable.filtrar e refletir no adapter', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    await tabela.filter({ column: 'nome', operator: 'contains', value: 'Produto' })

    const linhas = tabela.getRows()
    expect(linhas).toHaveLength(2)
    expect(tabela.getTotal()).toBe(2)
  })

  it('deve ordenar via RosiumTable.ordenar e refletir no adapter', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.sort('preco', 'asc')

    const linhas = tabela.getRows()
    expect(linhas[0]!.preco!.raw).toBe(10.5)
    expect(linhas[4]!.preco!.raw).toBe(99.9)
  })

  it('deve paginar via RosiumTable.irParaPagina', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas, pageSize: 2 })
    tabela.useAdapter(adapter)

    await tabela.goToPage(1)
    expect(tabela.getRows()).toHaveLength(2)

    await tabela.goToPage(2)
    expect(tabela.getRows()).toHaveLength(2)

    await tabela.goToPage(3)
    expect(tabela.getRows()).toHaveLength(1)
  })

  it('fluxo: filtrar → ordenar → paginar', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas, pageSize: 2 })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'ativo', operator: 'equals', value: true })
    await tabela.sort('preco', 'asc')

    await tabela.goToPage(1)
    let linhas = tabela.getRows()
    expect(linhas).toHaveLength(2)
    expect(linhas[0]!.preco!.raw).toBe(10.5)
    expect(linhas[1]!.preco!.raw).toBe(50.0)

    await tabela.goToPage(2)
    linhas = tabela.getRows()
    expect(linhas).toHaveLength(1)
    expect(linhas[0]!.preco!.raw).toBe(99.9)

    expect(tabela.getTotal()).toBe(3)
  })

  it('tabela vazia funciona', async () => {
    const adapter = new LocalAdapter([])
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.goToPage(1)
    expect(tabela.getRows()).toEqual([])
    expect(tabela.getTotal()).toBe(0)
  })

  it('deve emitir dados:carregados com dados do adapter', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('data:loaded', handler)

    await tabela.goToPage(1)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('deve emitir estado:alterado apos operacoes', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('state:changed', handler)

    await tabela.goToPage(1)
    expect(handler).toHaveBeenCalled()
    const estado = tabela.getState()
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
      column('nome', { type: 'text' }),
      column('preco', { type: 'number' }),
    ]
    const tabela = new RosiumTable({ columns: colunasValidacao })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)

    const chamadasErro = handler.mock.calls.filter(
      (call) => call[0] && (call[0] as Record<string, unknown>).column === 'nome'
    )
    expect(chamadasErro.length).toBe(1)
    expect(chamadasErro[0]![0]).toMatchObject({
      column: 'nome',
      rowIndex: 0,
      expected: 'text',
      received: 123,
    })
  })

  it('nao deve emitir erro para dados validos', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)
    expect(handler).not.toHaveBeenCalled()
  })

  it('deve emitir erro quando adapter nao configurado', async () => {
    const tabela = new RosiumTable({ columns: colunas })

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)
    expect(handler).toHaveBeenCalled()
  })
})

describe('Integracao — getEstado com LocalAdapter', () => {
  it('estado deve refletir dados do adapter', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas, pageSize: 2 })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'ativo', operator: 'equals', value: true })
    await tabela.sort('preco', 'asc')
    await tabela.goToPage(1)

    const estado = tabela.getState()
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
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'nome', operator: 'contains', value: 'Inexistente' })
    await tabela.goToPage(1)

    const estado = tabela.getState()
    expect(estado.total).toBe(0)
    expect(estado.rows).toHaveLength(0)
    expect(estado.totalPages).toBe(0)
  })
})

describe('Integracao — colunas gerenciadas com LocalAdapter', () => {
  it('esconder/mostrar coluna nao afeta os dados', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    tabela.hideColumn('id')
    const estado = tabela.getState()
    expect(estado.visibleColumns).not.toContain('id')
    expect(estado.rows).toHaveLength(5)

    tabela.showColumn('id')
    expect(tabela.getState().visibleColumns).toContain('id')
  })
})

describe('Integracao — operadores de filtro especificos com dados reais', () => {
  it('filtro de data — entre', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'criadoEm', operator: 'between', value: ['2024-01-01', '2024-03-31'] })
    await tabela.goToPage(1)

    expect(tabela.getTotal()).toBe(3)
    const ids = tabela.getRows().map((l) => l.id!.raw)
    expect(ids).toEqual([1, 2, 5])
  })

  it('filtro de data — antes', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'criadoEm', operator: 'before', value: '2024-03-01' })
    await tabela.goToPage(1)

    expect(tabela.getTotal()).toBe(2)
  })

  it('filtro de data — depois', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'criadoEm', operator: 'after', value: '2024-05-01' })
    await tabela.goToPage(1)

    expect(tabela.getTotal()).toBe(2)
  })

  it('filtro numero — entre', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'preco', operator: 'between', value: [20, 60] })
    await tabela.goToPage(1)

    expect(tabela.getTotal()).toBe(2)
  })

  it('filtros multiplos AND — numero + booleano', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'preco', operator: '>', value: 20 })
    await tabela.filter({ column: 'ativo', operator: 'equals', value: true })
    await tabela.goToPage(1)

    expect(tabela.getTotal()).toBe(2)
  })

  it('filtro removido por valor vazio', async () => {
    const adapter = new LocalAdapter(dados)
    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'nome', operator: 'contains', value: 'Produto' })
    await tabela.filter({ column: 'nome', operator: 'contains', value: '' })
    await tabela.goToPage(1)

    expect(tabela.getTotal()).toBe(5)
  })
})

describe('Integracao — troca de adapter', () => {
  it('deve funcionar com adapter trocado em runtime', async () => {
    const adapter1 = new LocalAdapter([{ id: 1, nome: 'A' }])
    const adapter2 = new LocalAdapter([{ id: 2, nome: 'B' }, { id: 3, nome: 'C' }])

    const colunasSimples: ColumnDefinition[] = [
      column('id', { type: 'number' }),
      column('nome', { type: 'text' }),
    ]

    const tabela = new RosiumTable({ columns: colunasSimples })
    tabela.useAdapter(adapter1)
    await tabela.goToPage(1)
    expect(tabela.getTotal()).toBe(1)

    tabela.useAdapter(adapter2)
    await tabela.goToPage(1)
    expect(tabela.getTotal()).toBe(2)
  })
})
