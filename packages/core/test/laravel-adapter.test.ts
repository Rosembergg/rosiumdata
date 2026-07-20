import { describe, it, expect, vi, afterEach } from 'vitest'
import { LaravelAdapter, LARAVEL_OPERATOR } from '@rosiumdata/core'
import type { Row, Query } from '@rosiumdata/core'

function criarQuery(overrides?: Partial<Query>): Query {
  return {
    filters: [],
    page: 1,
    pageSize: 20,
    ...overrides,
  }
}

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

function mockFetch(response: Response) {
  const fetchMock = vi.fn(async () => response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function urlDaChamada(fetchMock: ReturnType<typeof vi.fn>, n = 0): string {
  return String(fetchMock.mock.calls[n]![0])
}

function paramsDaChamada(fetchMock: ReturnType<typeof vi.fn>, n = 0): URLSearchParams {
  const url = new URL(urlDaChamada(fetchMock, n), 'http://localhost')
  return url.searchParams
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('LaravelAdapter — implementa DataAdapter', () => {
  it('deve ter fetch, fetchAll e fetchFilterOptions', () => {
    const adapter = new LaravelAdapter('/api/produtos')
    expect(typeof adapter.fetch).toBe('function')
    expect(typeof adapter.fetchAll).toBe('function')
    expect(typeof adapter.fetchFilterOptions).toBe('function')
  })

  it('fetch retorna Promise', () => {
    mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    const result = adapter.fetch(criarQuery())
    expect(result).toBeInstanceOf(Promise)
  })
})

describe('LaravelAdapter — tradução Query → query params Laravel', () => {
  it('paginação → page e per_page', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    await adapter.fetch(criarQuery({ page: 3, pageSize: 20 }))

    const params = paramsDaChamada(fetchMock)
    expect(params.get('page')).toBe('3')
    expect(params.get('per_page')).toBe('20')
  })

  it('ordenação asc → sort=nome', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    await adapter.fetch(criarQuery({ sort: { column: 'nome', direction: 'asc' } }))

    expect(paramsDaChamada(fetchMock).get('sort')).toBe('nome')
  })

  it('ordenação desc → sort=-nome', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    await adapter.fetch(criarQuery({ sort: { column: 'nome', direction: 'desc' } }))

    expect(paramsDaChamada(fetchMock).get('sort')).toBe('-nome')
  })

  it('sem ordenação → sem param sort', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    await adapter.fetch(criarQuery())

    expect(paramsDaChamada(fetchMock).get('sort')).toBeNull()
  })

  const operadores: Array<[string, string, unknown, string]> = [
    ['=', 'eq', 50, '50'],
    ['>', 'gt', 50, '50'],
    ['<', 'lt', 50, '50'],
    ['>=', 'gte', 50, '50'],
    ['<=', 'lte', 50, '50'],
    ['equals', 'eq', 'Ativo', 'Ativo'],
    ['contains', 'like', 'coca', 'coca'],
    ['startsWith', 'starts_with', 'co', 'co'],
    ['endsWith', 'ends_with', 'la', 'la'],
    ['between', 'between', [20, 60], '20,60'],
    ['before', 'before', '2024-01-01', '2024-01-01'],
    ['after', 'after', '2024-01-01', '2024-01-01'],
  ]

  for (const [operador, traduzido, valor, serializado] of operadores) {
    it(`operador \`${operador}\` → filter[col][${traduzido}]=${serializado}`, async () => {
      const fetchMock = mockFetch(respostaLaravel([]))
      const adapter = new LaravelAdapter('/api/produtos')
      await adapter.fetch(
        criarQuery({ filters: [{ column: 'col', operator: operador, value: valor }] })
      )

      expect(paramsDaChamada(fetchMock).get(`filter[col][${traduzido}]`)).toBe(serializado)
    })
  }

  it('todos os operadores da Fase 1 estão no mapa de tradução', () => {
    const operadoresFase1 = [
      'contains', 'equals', 'startsWith', 'endsWith',
      '=', '>', '<', '>=', '<=', 'between', 'before', 'after',
    ]
    for (const op of operadoresFase1) {
      expect(LARAVEL_OPERATOR[op], `operador \`${op}\` sem tradução`).toBeTruthy()
    }
  })

  it('múltiplos filtros → múltiplos params (AND)', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    await adapter.fetch(
      criarQuery({
        filters: [
          { column: 'preco', operator: '>', value: 50 },
          { column: 'status', operator: 'equals', value: 'Ativo' },
        ],
      })
    )

    const params = paramsDaChamada(fetchMock)
    expect(params.get('filter[preco][gt]')).toBe('50')
    expect(params.get('filter[status][eq]')).toBe('Ativo')
  })

  it('valor Date → ISO 8601', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    const data = new Date('2024-01-15T00:00:00.000Z')
    await adapter.fetch(
      criarQuery({ filters: [{ column: 'criadoEm', operator: 'after', value: data }] })
    )

    expect(paramsDaChamada(fetchMock).get('filter[criadoEm][after]')).toBe(
      '2024-01-15T00:00:00.000Z'
    )
  })

  it('valor booleano → 1/0', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    await adapter.fetch(
      criarQuery({ filters: [{ column: 'ativo', operator: 'equals', value: true }] })
    )
    await adapter.fetch(
      criarQuery({ filters: [{ column: 'ativo', operator: 'equals', value: false }] })
    )

    expect(paramsDaChamada(fetchMock, 0).get('filter[ativo][eq]')).toBe('1')
    expect(paramsDaChamada(fetchMock, 1).get('filter[ativo][eq]')).toBe('0')
  })

  it('baseUrl que já tem query string recebe & em vez de ?', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos?tenant=1')
    await adapter.fetch(criarQuery())

    const url = urlDaChamada(fetchMock)
    expect(url).toContain('/api/produtos?tenant=1&')
    expect(paramsDaChamada(fetchMock).get('tenant')).toBe('1')
    expect(paramsDaChamada(fetchMock).get('page')).toBe('1')
  })

  it('operador desconhecido → rejeita com mensagem clara', async () => {
    mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(
      adapter.fetch(criarQuery({ filters: [{ column: 'x', operator: 'invalid', value: 1 }] }))
    ).rejects.toThrow('unknown operator `invalid`')
  })
})

describe('LaravelAdapter — headers e fetchOptions', () => {
  it('envia Accept: application/json e headers customizados', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos', {
      headers: { Authorization: 'Bearer token123' },
    })
    await adapter.fetch(criarQuery())

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(init.headers).toMatchObject({
      accept: 'application/json',
      authorization: 'Bearer token123',
    })
    expect(init.method).toBe('GET')
  })

  it('repassa fetchOptions ao fetch nativo', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos', {
      fetchOptions: { credentials: 'include' },
    })
    await adapter.fetch(criarQuery())

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(init.credentials).toBe('include')
  })

  it('fetchOptions.headers é mesclado — headers do adapter têm precedência', async () => {
    const fetchMock = mockFetch(respostaLaravel([]))
    const adapter = new LaravelAdapter('/api/produtos', {
      headers: { 'X-Custom': 'adapter' },
      fetchOptions: {
        headers: { 'X-Custom': 'fetchOptions', 'X-Extra': 'mantido' },
      },
    })
    await adapter.fetch(criarQuery())

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(init.headers).toMatchObject({
      accept: 'application/json',
      'x-custom': 'adapter',
      'x-extra': 'mantido',
    })
  })
})

describe('LaravelAdapter — parsing response Laravel → FetchResult', () => {
  it('formato paginator: rows de data, total de meta.total', async () => {
    mockFetch(
      respostaJson({
        data: [{ id: 1, nome: 'Coca' }, { id: 2, nome: 'Pepsi' }],
        meta: { current_page: 1, total: 100, per_page: 20 },
      })
    )
    const adapter = new LaravelAdapter('/api/produtos')
    const result = await adapter.fetch(criarQuery())

    expect(result.rows).toEqual([{ id: 1, nome: 'Coca' }, { id: 2, nome: 'Pepsi' }])
    expect(result.total).toBe(100)
  })

  it('formato simplificado: fallback para total na raiz', async () => {
    mockFetch(respostaJson({ data: [{ id: 1 }], total: 42 }))
    const adapter = new LaravelAdapter('/api/produtos')
    const result = await adapter.fetch(criarQuery())

    expect(result.rows).toEqual([{ id: 1 }])
    expect(result.total).toBe(42)
  })

  it('meta.total tem prioridade sobre total na raiz', async () => {
    mockFetch(respostaJson({ data: [], meta: { total: 10 }, total: 99 }))
    const adapter = new LaravelAdapter('/api/produtos')
    const result = await adapter.fetch(criarQuery())
    expect(result.total).toBe(10)
  })

  it('data vazio funciona', async () => {
    mockFetch(respostaJson({ data: [], meta: { total: 0 } }))
    const adapter = new LaravelAdapter('/api/produtos')
    const result = await adapter.fetch(criarQuery())
    expect(result.rows).toEqual([])
    expect(result.total).toBe(0)
  })

  it('dado aninhado é achatado (categoria.nome → categoria_nome)', async () => {
    mockFetch(
      respostaJson({
        data: [
          { id: 1, categoria: { nome: 'Bebidas', grupo: { id: 7 } }, tags: ['a', 'b'] },
        ],
        total: 1,
      })
    )
    const adapter = new LaravelAdapter('/api/produtos')
    const result = await adapter.fetch(criarQuery())

    expect(result.rows[0]).toEqual({
      id: 1,
      categoria_nome: 'Bebidas',
      categoria_grupo_id: 7,
      tags: ['a', 'b'],
    })
  })

  it('adapter não transforma valor — entrega raw do servidor', async () => {
    mockFetch(respostaJson({ data: [{ status: 1, preco: 100 }], total: 1 }))
    const adapter = new LaravelAdapter('/api/produtos')
    const result = await adapter.fetch(criarQuery())

    expect(result.rows[0]!.status).toBe(1)
    expect(result.rows[0]!.preco).toBe(100)
  })

  it('resposta sem data → rejeita com mensagem clara', async () => {
    mockFetch(respostaJson({ resultado: [] }))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow('missing `data` as array')
  })

  it('resposta que não é objeto → rejeita com mensagem clara', async () => {
    mockFetch(respostaJson([1, 2, 3]))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow('unexpected response format')
  })

  it('data com item que não é objeto → rejeita com mensagem clara', async () => {
    mockFetch(respostaJson({ data: [{ id: 1 }, 'sujeira'], total: 2 }))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow('item 1 of `data` is not an object')
  })

  it('resposta sem total → rejeita com mensagem clara', async () => {
    mockFetch(respostaJson({ data: [{ id: 1 }] }))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow('missing numeric total')
  })

  it('total não-numérico → rejeita com mensagem clara', async () => {
    mockFetch(respostaJson({ data: [], total: 'muitos' }))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow('missing numeric total')
  })
})

describe('LaravelAdapter — erros de rede (nunca quebra, sempre rejeita com mensagem clara)', () => {
  it('HTTP 400 → mensagem com status e body', async () => {
    mockFetch(respostaJson({ message: 'Filtro inválido' }, 400))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow(/HTTP 400.*Filtro inválido/)
  })

  it('HTTP 404 → mensagem com status', async () => {
    mockFetch(respostaJson('Not Found', 404))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow('HTTP 404')
  })

  it('HTTP 500 → mensagem com status e body', async () => {
    mockFetch(respostaJson({ message: 'Server Error' }, 500))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow(/HTTP 500.*Server Error/)
  })

  it('resposta não-JSON → mensagem clara', async () => {
    const response = {
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON')
      },
      text: async () => '<html>erro</html>',
    } as unknown as Response
    mockFetch(response)
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow('is not valid JSON')
  })

  it('rede offline → mensagem amigável', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('fetch failed')
    }))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetch(criarQuery())).rejects.toThrow(
      /network failure.*check connection/
    )
  })

  it('timeout → mensagem clara com o limite configurado', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new Error('This operation was aborted'))
          })
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new LaravelAdapter('/api/produtos', { timeout: 5000 })
    const promessa = adapter.fetch(criarQuery())
    const expectativa = expect(promessa).rejects.toThrow('timeout of 5000ms')

    await vi.advanceTimersByTimeAsync(5001)
    await expectativa
  })

  it('timeout durante a leitura do body → mensagem de timeout (não fica pendurado)', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      return {
        ok: true,
        status: 200,
        json: () =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              reject(new Error('The operation was aborted'))
            })
          }),
        text: async () => '',
      } as unknown as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new LaravelAdapter('/api/produtos', { timeout: 5000 })
    const promessa = adapter.fetch(criarQuery())
    const expectativa = expect(promessa).rejects.toThrow('timeout of 5000ms')

    await vi.advanceTimersByTimeAsync(5001)
    await expectativa
  })

  it('faz 1 tentativa apenas — sem retry automático', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })
    vi.stubGlobal('fetch', fetchMock)
    const adapter = new LaravelAdapter('/api/produtos')

    await expect(adapter.fetch(criarQuery())).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('LaravelAdapter — fetchAll', () => {
  it('usa o mesmo endpoint com page=1 e per_page grande', async () => {
    const fetchMock = mockFetch(respostaJson({ data: [{ id: 1 }, { id: 2 }], total: 2 }))
    const adapter = new LaravelAdapter('/api/produtos')
    const rows = await adapter.fetchAll(criarQuery({ page: 5, pageSize: 20 }))

    const params = paramsDaChamada(fetchMock)
    expect(params.get('page')).toBe('1')
    expect(params.get('per_page')).toBe('1000000')
    expect(rows).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('per_page do fetchAll é configurável', async () => {
    const fetchMock = mockFetch(respostaJson({ data: [], total: 0 }))
    const adapter = new LaravelAdapter('/api/produtos', { fetchAllPageSize: 5000 })
    await adapter.fetchAll(criarQuery())

    expect(paramsDaChamada(fetchMock).get('per_page')).toBe('5000')
  })

  it('mantém filtros e ordenação', async () => {
    const fetchMock = mockFetch(respostaJson({ data: [], total: 0 }))
    const adapter = new LaravelAdapter('/api/produtos')
    await adapter.fetchAll(
      criarQuery({
        filters: [{ column: 'preco', operator: '>', value: 50 }],
        sort: { column: 'nome', direction: 'desc' },
      })
    )

    const params = paramsDaChamada(fetchMock)
    expect(params.get('filter[preco][gt]')).toBe('50')
    expect(params.get('sort')).toBe('-nome')
  })
})

describe('LaravelAdapter — fetchFilterOptions', () => {
  it('chama {baseUrl}/filter-options/{coluna}', async () => {
    const fetchMock = mockFetch(respostaJson({ data: [] }))
    const adapter = new LaravelAdapter('/api/produtos')
    await adapter.fetchFilterOptions('status')

    expect(urlDaChamada(fetchMock)).toBe('/api/produtos/filter-options/status')
  })

  it('baseUrl com barra final não duplica a barra', async () => {
    const fetchMock = mockFetch(respostaJson({ data: [] }))
    const adapter = new LaravelAdapter('/api/produtos/')
    await adapter.fetchFilterOptions('status')

    expect(urlDaChamada(fetchMock)).toBe('/api/produtos/filter-options/status')
  })

  it('baseUrl com query string gera URL válida (qs preservada após o caminho)', async () => {
    const fetchMock = mockFetch(respostaJson({ data: [] }))
    const adapter = new LaravelAdapter('/api/produtos?tenant=1')
    await adapter.fetchFilterOptions('status')

    expect(urlDaChamada(fetchMock)).toBe('/api/produtos/filter-options/status?tenant=1')
  })

  it('parseia { data: [{ label, value }] }', async () => {
    mockFetch(
      respostaJson({ data: [{ label: 'Ativo', value: 1 }, { label: 'Inativo', value: 2 }] })
    )
    const adapter = new LaravelAdapter('/api/produtos')
    const options = await adapter.fetchFilterOptions('status')

    expect(options).toEqual([
      { label: 'Ativo', value: 1 },
      { label: 'Inativo', value: 2 },
    ])
  })

  it('parseia array na raiz', async () => {
    mockFetch(respostaJson([{ label: 'Yes', value: true }]))
    const adapter = new LaravelAdapter('/api/produtos')
    const options = await adapter.fetchFilterOptions('ativo')

    expect(options).toEqual([{ label: 'Yes', value: true }])
  })

  it('itens escalares viram { label, value }', async () => {
    mockFetch(respostaJson({ data: ['Bebidas', 'Comidas'] }))
    const adapter = new LaravelAdapter('/api/produtos')
    const options = await adapter.fetchFilterOptions('categoria')

    expect(options).toEqual([
      { label: 'Bebidas', value: 'Bebidas' },
      { label: 'Comidas', value: 'Comidas' },
    ])
  })

  it('item objeto sem label usa String(value)', async () => {
    mockFetch(respostaJson({ data: [{ value: 7 }] }))
    const adapter = new LaravelAdapter('/api/produtos')
    const options = await adapter.fetchFilterOptions('grupo')

    expect(options).toEqual([{ label: '7', value: 7 }])
  })

  it('formato inesperado → rejeita com mensagem clara', async () => {
    mockFetch(respostaJson({ opcoes: [] }))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetchFilterOptions('status')).rejects.toThrow(
      'unexpected filter options format'
    )
  })

  it('erro HTTP no endpoint de opções → rejeita', async () => {
    mockFetch(respostaJson('Not Found', 404))
    const adapter = new LaravelAdapter('/api/produtos')
    await expect(adapter.fetchFilterOptions('status')).rejects.toThrow('HTTP 404')
  })
})
