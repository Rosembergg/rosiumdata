import { describe, it, expect, vi } from 'vitest'
import { RsTable, column } from '@rsdata/core'
import type { DataAdapter, ColumnDefinition, Filter, FetchResult, Row, Query } from '@rsdata/core'

function criarMockAdapter(dados: Row[]): DataAdapter {
  return {
    async fetch(query: Query): Promise<FetchResult> {
      return {
        rows: dados,
        total: dados.length,
      }
    },
    async fetchAll(query: Query): Promise<Row[]> {
      return dados
    },
  }
}

const colunas: ColumnDefinition[] = [
  column('id', { type: 'number' }),
  column('nome', { type: 'text' }),
  column('preco', { type: 'number' }),
  column('ativo', { type: 'boolean' }),
  column('criadoEm', { type: 'date' }),
  column('status', { type: 'select', options: { 1: 'Ativo', 2: 'Inativo' } }),
  column('acoes', { type: 'action' }),
]

const dadosMock = [
  { id: 1, nome: 'Produto A', preco: 10.5, ativo: true, criadoEm: new Date('2024-01-15'), status: 1 },
  { id: 2, nome: 'Produto B', preco: 25.0, ativo: false, criadoEm: new Date('2024-03-20'), status: 2 },
  { id: 3, nome: 'Servico C', preco: 99.9, ativo: true, criadoEm: new Date('2024-06-01'), status: 1 },
]

describe('RsTable — instancia viva com estado', () => {
  it('deve ser instanciavel', () => {
    const tabela = new RsTable({ columns: colunas })
    expect(tabela).toBeInstanceOf(RsTable)
  })

  it('deve aceitar pageSize customizado', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas, pageSize: 10 })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)
    expect(tabela.getState().pageSize).toBe(10)
  })
})

describe('RsTable — getLinhas() e transformacao de dados', () => {
  it('deve retornar array vazio antes de carregar dados', () => {
    const tabela = new RsTable({ columns: colunas })
    expect(tabela.getRows()).toEqual([])
  })

  it('deve retornar dados transformados apos fetch', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const linhas = tabela.getRows()
    expect(linhas).toHaveLength(3)

    expect(linhas[0]!.nome!.raw).toBe('Produto A')
    expect(linhas[0]!.nome!.display).toBe('Produto A')

    expect(linhas[0]!.preco!.raw).toBe(10.5)
    expect(linhas[0]!.preco!.display).toBe('10,5')

    expect(linhas[0]!.ativo!.raw).toBe(true)
    expect(linhas[0]!.ativo!.display).toBe('Yes')
  })

  it('deve mapear selecao para valor de exibicao', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const linhas = tabela.getRows()
    expect(linhas[0]!.status!.raw).toBe(1)
    expect(linhas[0]!.status!.display).toBe('Ativo')
    expect(linhas[1]!.status!.display).toBe('Inativo')
  })

  it('deve usar transform customizado da coluna', async () => {
    const colunasComTransform = [
      column('nome', { type: 'text', transform: (v) => 'Transformado: ' + String(v) }),
    ]
    const adapter = criarMockAdapter([{ nome: 'Original' }])
    const tabela = new RsTable({ columns: colunasComTransform })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const linhas = tabela.getRows()
    expect(linhas[0]!.nome!.raw).toBe('Original')
    expect(linhas[0]!.nome!.display).toBe('Transformado: Original')
  })

  it('cada celula deve ter raw e display', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const linhas = tabela.getRows()
    for (const linha of linhas) {
      for (const key of Object.keys(linha)) {
        expect(linha[key]).toHaveProperty('raw')
        expect(linha[key]).toHaveProperty('display')
      }
    }
  })
})

describe('RsTable — getTotal()', () => {
  it('deve retornar 0 antes de carregar dados', () => {
    const tabela = new RsTable({ columns: colunas })
    expect(tabela.getTotal()).toBe(0)
  })

  it('deve retornar total apos fetch', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    expect(tabela.getTotal()).toBe(3)
  })
})

describe('RsTable — getEstado()', () => {
  it('deve retornar snapshot completo do estado', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas, pageSize: 20 })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const estado = tabela.getState()
    expect(estado.columns).toBe(colunas)
    expect(estado.filters).toEqual([])
    expect(estado.page).toBe(1)
    expect(estado.pageSize).toBe(20)
    expect(estado.total).toBe(3)
    expect(estado.totalPages).toBe(1)
    expect(estado.rows).toHaveLength(3)
    expect(estado.visibleColumns).toEqual(['id', 'nome', 'preco', 'ativo', 'criadoEm', 'status', 'acoes'])
    expect(estado.columnOrder).toEqual(['id', 'nome', 'preco', 'ativo', 'criadoEm', 'status', 'acoes'])
  })
})

describe('RsTable — sistema de eventos', () => {
  it('deve emitir dados:carregados apos fetch', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('data:loaded', handler)

    await tabela.goToPage(1)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(expect.any(Array))
  })

  it('deve emitir estado:alterado apos fetch', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('state:changed', handler)

    await tabela.goToPage(1)

    expect(handler).toHaveBeenCalled()
    const estado = handler.mock.calls[0]![0]
    expect(estado).toHaveProperty('total', 3)
  })

  it('deve emitir estado:alterado ao esconder coluna', () => {
    const tabela = new RsTable({ columns: colunas })

    const handler = vi.fn()
    tabela.on('state:changed', handler)

    tabela.hideColumn('id')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('deve emitir estado:alterado ao mostrar coluna', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.hideColumn('id')

    const handler = vi.fn()
    tabela.on('state:changed', handler)

    tabela.showColumn('id')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('deve emitir estado:alterado ao reordenar colunas', () => {
    const tabela = new RsTable({ columns: colunas })

    const handler = vi.fn()
    tabela.on('state:changed', handler)

    tabela.reorderColumns(['nome', 'id', 'preco'])
    expect(handler).toHaveBeenCalledOnce()
  })

  it('deve emitir erro quando adapter nao configurado', async () => {
    const tabela = new RsTable({ columns: colunas })

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)

    expect(handler).toHaveBeenCalledOnce()
    const erro = handler.mock.calls[0]![0]
    expect(erro).toHaveProperty('expected', 'adapter configured')
  })
})

describe('RsTable — Falhe Alto integrado', () => {
  it('deve emitir evento erro para dados invalidos', async () => {
    const dadosInvalidos = [
      { nome: 'OK', preco: 'nao-e-numero' },
    ]
    const colunasValidacao = [
      column('nome', { type: 'text' }),
      column('preco', { type: 'number' }),
    ]
    const adapter = criarMockAdapter(dadosInvalidos)
    const tabela = new RsTable({ columns: colunasValidacao })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)

    const chamadasErro = handler.mock.calls.filter(
      (call) => call[0] && (call[0] as Record<string, unknown>).column === 'preco'
    )
    expect(chamadasErro.length).toBe(1)
    expect(chamadasErro[0]![0]).toMatchObject({
      column: 'preco',
      rowIndex: 0,
      expected: 'number',
      received: 'nao-e-numero',
    })
  })

  it('nao deve emitir erro para dados validos', async () => {
    const dadosValidos = [
      { nome: 'OK', preco: 10 },
    ]
    const colunasValidacao = [
      column('nome', { type: 'text' }),
      column('preco', { type: 'number' }),
    ]
    const adapter = criarMockAdapter(dadosValidos)
    const tabela = new RsTable({ columns: colunasValidacao })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)

    expect(handler).not.toHaveBeenCalled()
  })
})

describe('RsTable — gerenciamento de colunas', () => {
  it('deve esconder coluna', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.hideColumn('id')

    const estado = tabela.getState()
    expect(estado.visibleColumns).not.toContain('id')
    expect(estado.visibleColumns).toContain('nome')
  })

  it('deve mostrar coluna', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.hideColumn('id')
    tabela.showColumn('id')

    const estado = tabela.getState()
    expect(estado.visibleColumns).toContain('id')
  })

  it('deve reordenar colunas preservando nao-listadas', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.reorderColumns(['nome', 'preco', 'id'])

    const estado = tabela.getState()
    expect(estado.visibleColumns[0]).toBe('nome')
    expect(estado.visibleColumns[1]).toBe('preco')
    expect(estado.visibleColumns[2]).toBe('id')
    expect(estado.visibleColumns).toContain('ativo')
    expect(estado.visibleColumns).toContain('criadoEm')
    expect(estado.visibleColumns).toContain('status')
    expect(estado.visibleColumns).toContain('acoes')
    expect(estado.visibleColumns.length).toBe(7)
  })

  it('deve preservar colunas visiveis nao listadas na reordenacao', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.reorderColumns(['nome', 'preco'])

    const estado = tabela.getState()
    expect(estado.visibleColumns[0]).toBe('nome')
    expect(estado.visibleColumns[1]).toBe('preco')
    expect(estado.visibleColumns.length).toBe(7)
  })

  it('deve ignorar chaves inexistentes e preservar resto', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.reorderColumns(['nome', 'chave-inexistente', 'preco'])

    const estado = tabela.getState()
    expect(estado.visibleColumns[0]).toBe('nome')
    expect(estado.visibleColumns[1]).toBe('preco')
    expect(estado.visibleColumns).not.toContain('chave-inexistente')
    expect(estado.visibleColumns.length).toBe(7)
  })

  it('coluna com visible:false nao aparece em visibleColumns inicial', () => {
    const colunasComInvisivel = [
      column('nome', { type: 'text' }),
      column('id', { type: 'number', visible: false }),
    ]
    const tabela = new RsTable({ columns: colunasComInvisivel })

    const estado = tabela.getState()
    expect(estado.visibleColumns).toEqual(['nome'])
    expect(estado.visibleColumns).not.toContain('id')
  })
})

describe('RsTable — filtros (API .filtrar)', () => {
  it('deve adicionar filtro e resetar pagina para 1', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.goToPage(1)

    const fetchSpy = vi.spyOn(adapter, 'fetch')

    await tabela.filter({ column: 'nome', operator: 'contains', value: 'Produto' })

    expect(fetchSpy).toHaveBeenCalled()
    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.filters).toEqual([
      { column: 'nome', operator: 'contains', value: 'Produto' },
    ])
    expect(queryArg.page).toBe(1)
  })

  it('deve substituir filtro existente para mesma coluna', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'nome', operator: 'contains', value: 'Produto' })

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.filter({ column: 'nome', operator: 'equals', value: 'Servico' })

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.filters).toHaveLength(1)
    expect(queryArg.filters[0]).toEqual({
      column: 'nome', operator: 'equals', value: 'Servico',
    })
  })

  it('deve acumular multiplos filtros em AND', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'nome', operator: 'contains', value: 'Produto' })

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.filter({ column: 'preco', operator: '>', value: 20 })

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.filters).toHaveLength(2)
    expect(queryArg.filters).toContainEqual({ column: 'nome', operator: 'contains', value: 'Produto' })
    expect(queryArg.filters).toContainEqual({ column: 'preco', operator: '>', value: 20 })
  })

  it('deve remover filtro com valor vazio', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.filter({ column: 'nome', operator: 'contains', value: 'Produto' })
    await tabela.filter({ column: 'preco', operator: '>', value: 20 })

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.filter({ column: 'nome', operator: 'contains', value: '' })

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.filters).toHaveLength(1)
    expect(queryArg.filters[0]!.column).toBe('preco')
  })
})

describe('RsTable — ordenacao (API .ordenar)', () => {
  it('deve configurar ordenacao e resetar pagina', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.sort('nome', 'asc')

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.sort).toEqual({ column: 'nome', direction: 'asc' })
    expect(queryArg.page).toBe(1)
  })

  it('deve alternar entre asc e desc', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    await tabela.sort('nome', 'asc')

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.sort('nome', 'desc')

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.sort).toEqual({ column: 'nome', direction: 'desc' })
  })
})

describe('RsTable — paginacao (API .irParaPagina)', () => {
  it('deve navegar para pagina especifica', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas, pageSize: 1 })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.goToPage(2)

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.page).toBe(2)
    expect(queryArg.pageSize).toBe(1)
  })

  it('deve limitar pagina ao maximo disponivel', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas, pageSize: 1 })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.goToPage(99)

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.page).toBe(3)
  })

  it('deve limitar pagina ao minimo 1', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.goToPage(-5)

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.page).toBe(1)
  })
})

describe('RsTable — casos de borda', () => {
  it('tabela vazia — deve funcionar sem dados', async () => {
    const adapter = criarMockAdapter([])
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    expect(tabela.getRows()).toEqual([])
    expect(tabela.getTotal()).toBe(0)
  })

  it('deve emitir dados:carregados mesmo com resultado vazio', async () => {
    const adapter = criarMockAdapter([])
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('data:loaded', handler)

    await tabela.goToPage(1)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith([])
  })

  it('deve permitir off para remover listener', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)

    const handler = vi.fn()
    tabela.on('data:loaded', handler)
    tabela.off('data:loaded', handler)

    await tabela.goToPage(1)
    expect(handler).not.toHaveBeenCalled()
  })

  it('estado do getEstado() deve ser imutavel (snapshot)', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const estado1 = tabela.getState()
    estado1.filters.push({ column: 'x', operator: 'y', value: 'z' })

    const estado2 = tabela.getState()
    expect(estado2.filters).toEqual([])
    expect(estado1.filters).not.toEqual(estado2.filters)
  })
})

describe('RsTable — locale', () => {
  it('default locale is pt-BR', () => {
    const tabela = new RsTable({ columns: [column('x', { type: 'number' })] })
    expect(tabela.getState().locale).toBe('pt-BR')
  })

  it('custom locale is stored and exposed', () => {
    const tabela = new RsTable({ columns: [column('x', { type: 'number' })], locale: 'en-US' })
    expect(tabela.getState().locale).toBe('en-US')
  })

  it('formats numbers in pt-BR by default', async () => {
    const adapter = criarMockAdapter([{ preco: 1500.5 }])
    const tabela = new RsTable({
      columns: [column('preco', { type: 'number' })],
    })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const rows = tabela.getRows()
    expect(rows[0]!.preco!.display).toBe('1.500,5')
  })

  it('formats numbers in en-US when configured', async () => {
    const adapter = criarMockAdapter([{ preco: 1500.5 }])
    const tabela = new RsTable({
      columns: [column('preco', { type: 'number' })],
      locale: 'en-US',
    })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const rows = tabela.getRows()
    expect(rows[0]!.preco!.display).toBe('1,500.5')
  })

  it('formats numbers in de-DE when configured', async () => {
    const adapter = criarMockAdapter([{ preco: 1500.5 }])
    const tabela = new RsTable({
      columns: [column('preco', { type: 'number' })],
      locale: 'de-DE',
    })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const rows = tabela.getRows()
    expect(rows[0]!.preco!.display).toBe('1.500,5')
  })

  it('column locale overrides table locale', async () => {
    const adapter = criarMockAdapter([{ preco: 1500.5 }])
    const tabela = new RsTable({
      columns: [column('preco', { type: 'number', locale: 'en-US' })],
      locale: 'pt-BR',
    })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const rows = tabela.getRows()
    expect(rows[0]!.preco!.display).toBe('1,500.5')
  })

  it('formats dates in pt-BR by default', async () => {
    const adapter = criarMockAdapter([{ data: new Date(2024, 11, 25) }])
    const tabela = new RsTable({
      columns: [column('data', { type: 'date' })],
    })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const rows = tabela.getRows()
    expect(rows[0]!.data!.display).toBe('25/12/2024')
  })

  it('formats dates in en-US when configured', async () => {
    const adapter = criarMockAdapter([{ data: new Date(2024, 11, 25) }])
    const tabela = new RsTable({
      columns: [column('data', { type: 'date' })],
      locale: 'en-US',
    })
    tabela.useAdapter(adapter)
    await tabela.goToPage(1)

    const rows = tabela.getRows()
    expect(rows[0]!.data!.display).toBe('12/25/2024')
  })
})
