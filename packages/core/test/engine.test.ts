import { describe, it, expect, vi } from 'vitest'
import { RsTable, coluna } from '@rsdata/core'
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
  coluna('id', { type: 'numero' }),
  coluna('nome', { type: 'texto' }),
  coluna('preco', { type: 'numero' }),
  coluna('ativo', { type: 'booleano' }),
  coluna('criadoEm', { type: 'data' }),
  coluna('status', { type: 'selecao', options: { 1: 'Ativo', 2: 'Inativo' } }),
  coluna('acoes', { type: 'acao' }),
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
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)
    expect(tabela.getEstado().pageSize).toBe(10)
  })
})

describe('RsTable — getLinhas() e transformacao de dados', () => {
  it('deve retornar array vazio antes de carregar dados', () => {
    const tabela = new RsTable({ columns: colunas })
    expect(tabela.getLinhas()).toEqual([])
  })

  it('deve retornar dados transformados apos fetch', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const linhas = tabela.getLinhas()
    expect(linhas).toHaveLength(3)

    expect(linhas[0]!.nome!.raw).toBe('Produto A')
    expect(linhas[0]!.nome!.display).toBe('Produto A')

    expect(linhas[0]!.preco!.raw).toBe(10.5)
    expect(linhas[0]!.preco!.display).toBe('10.5')

    expect(linhas[0]!.ativo!.raw).toBe(true)
    expect(linhas[0]!.ativo!.display).toBe('Sim')
  })

  it('deve mapear selecao para valor de exibicao', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const linhas = tabela.getLinhas()
    expect(linhas[0]!.status!.raw).toBe(1)
    expect(linhas[0]!.status!.display).toBe('Ativo')
    expect(linhas[1]!.status!.display).toBe('Inativo')
  })

  it('deve usar transform customizado da coluna', async () => {
    const colunasComTransform = [
      coluna('nome', { type: 'texto', transform: (v) => 'Transformado: ' + String(v) }),
    ]
    const adapter = criarMockAdapter([{ nome: 'Original' }])
    const tabela = new RsTable({ columns: colunasComTransform })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const linhas = tabela.getLinhas()
    expect(linhas[0]!.nome!.raw).toBe('Original')
    expect(linhas[0]!.nome!.display).toBe('Transformado: Original')
  })

  it('cada celula deve ter raw e display', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const linhas = tabela.getLinhas()
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
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    expect(tabela.getTotal()).toBe(3)
  })
})

describe('RsTable — getEstado()', () => {
  it('deve retornar snapshot completo do estado', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas, pageSize: 20 })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const estado = tabela.getEstado()
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
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('dados:carregados', handler)

    await tabela.irParaPagina(1)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(expect.any(Array))
  })

  it('deve emitir estado:alterado apos fetch', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('estado:alterado', handler)

    await tabela.irParaPagina(1)

    expect(handler).toHaveBeenCalled()
    const estado = handler.mock.calls[0]![0]
    expect(estado).toHaveProperty('total', 3)
  })

  it('deve emitir estado:alterado ao esconder coluna', () => {
    const tabela = new RsTable({ columns: colunas })

    const handler = vi.fn()
    tabela.on('estado:alterado', handler)

    tabela.esconderColuna('id')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('deve emitir estado:alterado ao mostrar coluna', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.esconderColuna('id')

    const handler = vi.fn()
    tabela.on('estado:alterado', handler)

    tabela.mostrarColuna('id')
    expect(handler).toHaveBeenCalledOnce()
  })

  it('deve emitir estado:alterado ao reordenar colunas', () => {
    const tabela = new RsTable({ columns: colunas })

    const handler = vi.fn()
    tabela.on('estado:alterado', handler)

    tabela.reordenarColunas(['nome', 'id', 'preco'])
    expect(handler).toHaveBeenCalledOnce()
  })

  it('deve emitir erro quando adapter nao configurado', async () => {
    const tabela = new RsTable({ columns: colunas })

    const handler = vi.fn()
    tabela.on('erro', handler)

    await tabela.irParaPagina(1)

    expect(handler).toHaveBeenCalledOnce()
    const erro = handler.mock.calls[0]![0]
    expect(erro).toHaveProperty('expected', 'adapter configurado')
  })
})

describe('RsTable — Falhe Alto integrado', () => {
  it('deve emitir evento erro para dados invalidos', async () => {
    const dadosInvalidos = [
      { nome: 'OK', preco: 'nao-e-numero' },
    ]
    const colunasValidacao = [
      coluna('nome', { type: 'texto' }),
      coluna('preco', { type: 'numero' }),
    ]
    const adapter = criarMockAdapter(dadosInvalidos)
    const tabela = new RsTable({ columns: colunasValidacao })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('erro', handler)

    await tabela.irParaPagina(1)

    const chamadasErro = handler.mock.calls.filter(
      (call) => call[0] && (call[0] as Record<string, unknown>).column === 'preco'
    )
    expect(chamadasErro.length).toBe(1)
    expect(chamadasErro[0]![0]).toMatchObject({
      column: 'preco',
      rowIndex: 0,
      expected: 'numero',
      received: 'nao-e-numero',
    })
  })

  it('nao deve emitir erro para dados validos', async () => {
    const dadosValidos = [
      { nome: 'OK', preco: 10 },
    ]
    const colunasValidacao = [
      coluna('nome', { type: 'texto' }),
      coluna('preco', { type: 'numero' }),
    ]
    const adapter = criarMockAdapter(dadosValidos)
    const tabela = new RsTable({ columns: colunasValidacao })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('erro', handler)

    await tabela.irParaPagina(1)

    expect(handler).not.toHaveBeenCalled()
  })
})

describe('RsTable — gerenciamento de colunas', () => {
  it('deve esconder coluna', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.esconderColuna('id')

    const estado = tabela.getEstado()
    expect(estado.visibleColumns).not.toContain('id')
    expect(estado.visibleColumns).toContain('nome')
  })

  it('deve mostrar coluna', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.esconderColuna('id')
    tabela.mostrarColuna('id')

    const estado = tabela.getEstado()
    expect(estado.visibleColumns).toContain('id')
  })

  it('deve reordenar colunas preservando nao-listadas', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.reordenarColunas(['nome', 'preco', 'id'])

    const estado = tabela.getEstado()
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
    tabela.reordenarColunas(['nome', 'preco'])

    const estado = tabela.getEstado()
    expect(estado.visibleColumns[0]).toBe('nome')
    expect(estado.visibleColumns[1]).toBe('preco')
    expect(estado.visibleColumns.length).toBe(7)
  })

  it('deve ignorar chaves inexistentes e preservar resto', () => {
    const tabela = new RsTable({ columns: colunas })
    tabela.reordenarColunas(['nome', 'chave-inexistente', 'preco'])

    const estado = tabela.getEstado()
    expect(estado.visibleColumns[0]).toBe('nome')
    expect(estado.visibleColumns[1]).toBe('preco')
    expect(estado.visibleColumns).not.toContain('chave-inexistente')
    expect(estado.visibleColumns.length).toBe(7)
  })

  it('coluna com visible:false nao aparece em visibleColumns inicial', () => {
    const colunasComInvisivel = [
      coluna('nome', { type: 'texto' }),
      coluna('id', { type: 'numero', visible: false }),
    ]
    const tabela = new RsTable({ columns: colunasComInvisivel })

    const estado = tabela.getEstado()
    expect(estado.visibleColumns).toEqual(['nome'])
    expect(estado.visibleColumns).not.toContain('id')
  })
})

describe('RsTable — filtros (API .filtrar)', () => {
  it('deve adicionar filtro e resetar pagina para 1', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.irParaPagina(1)

    const fetchSpy = vi.spyOn(adapter, 'fetch')

    await tabela.filtrar({ column: 'nome', operator: 'contem', value: 'Produto' })

    expect(fetchSpy).toHaveBeenCalled()
    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.filters).toEqual([
      { column: 'nome', operator: 'contem', value: 'Produto' },
    ])
    expect(queryArg.page).toBe(1)
  })

  it('deve substituir filtro existente para mesma coluna', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'nome', operator: 'contem', value: 'Produto' })

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.filtrar({ column: 'nome', operator: 'igual', value: 'Servico' })

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.filters).toHaveLength(1)
    expect(queryArg.filters[0]).toEqual({
      column: 'nome', operator: 'igual', value: 'Servico',
    })
  })

  it('deve acumular multiplos filtros em AND', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'nome', operator: 'contem', value: 'Produto' })

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.filtrar({ column: 'preco', operator: '>', value: 20 })

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.filters).toHaveLength(2)
    expect(queryArg.filters).toContainEqual({ column: 'nome', operator: 'contem', value: 'Produto' })
    expect(queryArg.filters).toContainEqual({ column: 'preco', operator: '>', value: 20 })
  })

  it('deve remover filtro com valor vazio', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.filtrar({ column: 'nome', operator: 'contem', value: 'Produto' })
    await tabela.filtrar({ column: 'preco', operator: '>', value: 20 })

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.filtrar({ column: 'nome', operator: 'contem', value: '' })

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.filters).toHaveLength(1)
    expect(queryArg.filters[0]!.column).toBe('preco')
  })
})

describe('RsTable — ordenacao (API .ordenar)', () => {
  it('deve configurar ordenacao e resetar pagina', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.ordenar('nome', 'asc')

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.sort).toEqual({ column: 'nome', direction: 'asc' })
    expect(queryArg.page).toBe(1)
  })

  it('deve alternar entre asc e desc', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    await tabela.ordenar('nome', 'asc')

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.ordenar('nome', 'desc')

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.sort).toEqual({ column: 'nome', direction: 'desc' })
  })
})

describe('RsTable — paginacao (API .irParaPagina)', () => {
  it('deve navegar para pagina especifica', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas, pageSize: 1 })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.irParaPagina(2)

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.page).toBe(2)
    expect(queryArg.pageSize).toBe(1)
  })

  it('deve limitar pagina ao maximo disponivel', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas, pageSize: 1 })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.irParaPagina(99)

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.page).toBe(3)
  })

  it('deve limitar pagina ao minimo 1', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const fetchSpy = vi.spyOn(adapter, 'fetch')
    await tabela.irParaPagina(-5)

    const queryArg = fetchSpy.mock.calls[0]![0]
    expect(queryArg.page).toBe(1)
  })
})

describe('RsTable — casos de borda', () => {
  it('tabela vazia — deve funcionar sem dados', async () => {
    const adapter = criarMockAdapter([])
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    expect(tabela.getLinhas()).toEqual([])
    expect(tabela.getTotal()).toBe(0)
  })

  it('deve emitir dados:carregados mesmo com resultado vazio', async () => {
    const adapter = criarMockAdapter([])
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('dados:carregados', handler)

    await tabela.irParaPagina(1)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith([])
  })

  it('deve permitir off para remover listener', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)

    const handler = vi.fn()
    tabela.on('dados:carregados', handler)
    tabela.off('dados:carregados', handler)

    await tabela.irParaPagina(1)
    expect(handler).not.toHaveBeenCalled()
  })

  it('estado do getEstado() deve ser imutavel (snapshot)', async () => {
    const adapter = criarMockAdapter(dadosMock)
    const tabela = new RsTable({ columns: colunas })
    tabela.usarAdapter(adapter)
    await tabela.irParaPagina(1)

    const estado1 = tabela.getEstado()
    estado1.filters.push({ column: 'x', operator: 'y', value: 'z' })

    const estado2 = tabela.getEstado()
    expect(estado2.filters).toEqual([])
    expect(estado1.filters).not.toEqual(estado2.filters)
  })
})
