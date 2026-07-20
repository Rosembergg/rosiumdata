// Integração RosiumTable + LaravelAdapter — a PROVA DE FOGO da arquitetura headless:
// trocar LocalAdapter por LaravelAdapter NÃO exige mudar nada no Core.
// O mesmo fluxo da Fase 2, agora com o dado vindo "da rede" (fetch mockado).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { RosiumTable, column, LaravelAdapter } from '@rosiumdata/core'
import type { ColumnDefinition, Row } from '@rosiumdata/core'

const colunas: ColumnDefinition[] = [
  column('id', { type: 'number' }),
  column('nome', { type: 'text' }),
  column('preco', { type: 'number' }),
  column('ativo', { type: 'boolean' }),
  column('criadoEm', { type: 'date' }),
  column('status', { type: 'select', options: { 1: 'Ativo', 2: 'Inativo', 3: 'Pendente' } }),
]

const dados: Row[] = [
  { id: 1, nome: 'Produto A', preco: 10.5, ativo: true, criadoEm: '2024-01-15', status: 1 },
  { id: 2, nome: 'Produto B', preco: 25.0, ativo: false, criadoEm: '2024-03-20', status: 2 },
  { id: 3, nome: 'Servico C', preco: 99.9, ativo: true, criadoEm: '2024-06-01', status: 1 },
]

function respostaJson(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response
}

function respostaLaravel(rows: Row[], total = rows.length): Response {
  return respostaJson({
    data: rows,
    meta: { current_page: 1, total, per_page: 20 },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('Integracao RosiumTable + LaravelAdapter — fluxo completo', () => {
  it('deve carregar dados do servidor e retornar linhas transformadas', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaLaravel(dados)))

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))
    await tabela.goToPage(1)

    const linhas = tabela.getRows()
    expect(linhas).toHaveLength(3)
    expect(tabela.getTotal()).toBe(3)

    // Linha Sagrada: raw do servidor + display transformado pelo Data Engine
    expect(linhas[0]!.nome!.raw).toBe('Produto A')
    expect(linhas[0]!.preco!.raw).toBe(10.5)
    expect(linhas[0]!.status!.raw).toBe(1)
    expect(linhas[0]!.status!.display).toBe('Ativo')
  })

  it('filtrar → o Query vira query params na URL do servidor', async () => {
    const fetchMock = vi.fn(async () => respostaLaravel([dados[0]!, dados[1]!], 2))
    vi.stubGlobal('fetch', fetchMock)

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))
    await tabela.filter({ column: 'nome', operator: 'contains', value: 'Produto' })

    const url = new URL(String(fetchMock.mock.calls[0]![0]), 'http://localhost')
    expect(url.searchParams.get('filter[nome][like]')).toBe('Produto')
    expect(tabela.getTotal()).toBe(2)
    expect(tabela.getRows()).toHaveLength(2)
  })

  it('ordenar → sort na URL', async () => {
    const fetchMock = vi.fn(async () => respostaLaravel(dados))
    vi.stubGlobal('fetch', fetchMock)

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))
    await tabela.sort('preco', 'desc')

    const url = new URL(String(fetchMock.mock.calls[0]![0]), 'http://localhost')
    expect(url.searchParams.get('sort')).toBe('-preco')
  })

  it('paginar → page/per_page na URL, total do meta controla as páginas', async () => {
    const fetchMock = vi.fn(async () => respostaLaravel([dados[2]!], 41))
    vi.stubGlobal('fetch', fetchMock)

    const tabela = new RosiumTable({ columns: colunas, pageSize: 20 })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))
    await tabela.goToPage(1)

    // total=41 com pageSize=20 → 3 páginas; página 3 é válida
    await tabela.goToPage(3)
    const url = new URL(String(fetchMock.mock.calls[1]![0]), 'http://localhost')
    expect(url.searchParams.get('page')).toBe('3')
    expect(url.searchParams.get('per_page')).toBe('20')
    expect(tabela.getState().totalPages).toBe(3)
  })

  it('deve emitir dados:carregados com dados do servidor', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaLaravel(dados)))

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const handler = vi.fn()
    tabela.on('data:loaded', handler)

    await tabela.goToPage(1)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('troca de LocalAdapter → LaravelAdapter é transparente para o Core', async () => {
    const { LocalAdapter } = await import('@rosiumdata/core')
    vi.stubGlobal('fetch', vi.fn(async () => respostaLaravel(dados)))

    const tabela = new RosiumTable({ columns: colunas })

    tabela.useAdapter(new LocalAdapter(dados.slice(0, 1)))
    await tabela.goToPage(1)
    expect(tabela.getTotal()).toBe(1)

    tabela.useAdapter(new LaravelAdapter('/api/produtos'))
    await tabela.goToPage(1)
    expect(tabela.getTotal()).toBe(3)
  })
})

describe('Integracao — erros de rede viram evento `erro` (RosiumTable continua viva)', () => {
  it('HTTP 500 → evento erro com a mensagem do adapter', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaJson({ message: 'Server Error' }, 500)))

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)

    expect(handler).toHaveBeenCalledOnce()
    const erro = handler.mock.calls[0]![0] as Record<string, unknown>
    expect(String(erro.received)).toContain('HTTP 500')
  })

  it('HTTP 404 → evento erro, sem exception não-tratada', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaJson('Not Found', 404)))

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const handler = vi.fn()
    tabela.on('error', handler)

    await expect(tabela.goToPage(1)).resolves.toBeUndefined()
    expect(String((handler.mock.calls[0]![0] as Record<string, unknown>).received)).toContain(
      'HTTP 404'
    )
  })

  it('rede offline → evento erro amigável', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('fetch failed')
    }))

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)
    expect(String((handler.mock.calls[0]![0] as Record<string, unknown>).received)).toContain(
      'network failure'
    )
  })

  it('resposta malformada → evento erro, não quebra', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaJson({ qualquer: 'coisa' })))

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const handler = vi.fn()
    tabela.on('error', handler)

    await expect(tabela.goToPage(1)).resolves.toBeUndefined()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('timeout → evento erro e tabela continua viva — fetch seguinte funciona', async () => {
    vi.useFakeTimers()
    let chamada = 0
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      chamada++
      if (chamada === 1) {
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new Error('The operation was aborted'))
          })
        })
      }
      return Promise.resolve(respostaLaravel(dados))
    })
    vi.stubGlobal('fetch', fetchMock)

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos', { timeout: 1000 }))

    const handler = vi.fn()
    tabela.on('error', handler)

    const primeira = tabela.goToPage(1)
    await vi.advanceTimersByTimeAsync(1001)
    await expect(primeira).resolves.toBeUndefined()

    expect(handler).toHaveBeenCalledOnce()
    expect(String((handler.mock.calls[0]![0] as Record<string, unknown>).received)).toContain(
      'timeout of 1000ms'
    )

    vi.useRealTimers()
    await tabela.goToPage(1)
    expect(tabela.getRows()).toHaveLength(3)
    expect(tabela.getTotal()).toBe(3)
  })

  it('depois de um erro a tabela continua viva — próximo fetch funciona', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respostaJson({ message: 'Server Error' }, 500))
      .mockResolvedValue(respostaLaravel(dados))
    vi.stubGlobal('fetch', fetchMock)

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const erros = vi.fn()
    tabela.on('error', erros)

    await tabela.goToPage(1)
    expect(erros).toHaveBeenCalledOnce()
    expect(tabela.getRows()).toHaveLength(0)

    await tabela.goToPage(1)
    expect(tabela.getRows()).toHaveLength(3)
    expect(tabela.getTotal()).toBe(3)
  })
})

describe('Integracao — Falhe Alto com dados sujos vindos do servidor', () => {
  it('servidor manda { preco: "grátis" } em coluna numero → erro com localização exata', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      respostaLaravel([
        { id: 1, nome: 'Produto A', preco: 10.5, ativo: true, criadoEm: '2024-01-15', status: 1 },
        { id: 2, nome: 'Produto B', preco: 'grátis', ativo: false, criadoEm: '2024-03-20', status: 2 },
      ])
    ))

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0]![0]).toMatchObject({
      column: 'preco',
      rowIndex: 1,
      expected: 'number',
      received: 'grátis',
    })

    // a tabela continua viva com as linhas carregadas
    expect(tabela.getRows()).toHaveLength(2)
  })

  it('servidor manda null → não é erro (aceito em qualquer tipo)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      respostaLaravel([
        { id: 1, nome: null, preco: null, ativo: null, criadoEm: null, status: null },
      ])
    ))

    const tabela = new RosiumTable({ columns: colunas })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)
    expect(handler).not.toHaveBeenCalled()
    expect(tabela.getRows()).toHaveLength(1)
  })

  it('dado aninhado do servidor chega plano no Core (achatado pelo adapter)', async () => {
    const colunasComCategoria: ColumnDefinition[] = [
      column('id', { type: 'number' }),
      column('categoria_nome', { type: 'text' }),
    ]
    vi.stubGlobal('fetch', vi.fn(async () =>
      respostaLaravel([{ id: 1, categoria: { nome: 'Bebidas' } }])
    ))

    const tabela = new RosiumTable({ columns: colunasComCategoria })
    tabela.useAdapter(new LaravelAdapter('/api/produtos'))

    const handler = vi.fn()
    tabela.on('error', handler)

    await tabela.goToPage(1)
    expect(handler).not.toHaveBeenCalled()
    expect(tabela.getRows()[0]!.categoria_nome!.raw).toBe('Bebidas')
  })
})
