import type { DataAdapter, Query, FetchResult, Row, FilterOption, Filter } from './index'

/**
 * # LaravelAdapter — adapter server-side para backends Laravel
 *
 * Implementa a MESMA interface `DataAdapter` do `LocalAdapter`. Para a RsTable
 * a troca é transparente: ela chama `adapter.fetch(query)` e recebe
 * `{ rows, total }` — nunca sabe se o dado veio da memória ou da rede.
 *
 * O servidor é quem filtra, ordena e pagina (server-side por padrão).
 * O adapter só traduz: `Query` → query params Laravel → response → `FetchResult`.
 *
 * Zero dependências: usa `fetch()` nativo (Node 18+ e navegadores).
 *
 * ---
 *
 * ## CONTRATO PÚBLICO DO BACKEND LARAVEL
 *
 * O backend precisa aceitar este formato de request e responder neste
 * formato de JSON. Esse contrato é documentação pública da RSdata.
 *
 * ### Request de dados (fetch)
 *
 * ```
 * GET {baseUrl}?filter[preco][gt]=50&filter[status][eq]=Ativo&sort=nome&page=1&per_page=20
 * ```
 *
 * Query params enviados:
 *
 * | Param                        | Significado                                  |
 * |------------------------------|----------------------------------------------|
 * | `filter[coluna][operador]`   | Um por filtro ativo (múltiplos = lógica AND) |
 * | `sort=nome`                  | Ordenação ascendente pela coluna `nome`      |
 * | `sort=-nome`                 | Ordenação descendente (prefixo `-`)          |
 * | `page`                       | Página atual (1-based)                       |
 * | `per_page`                   | Tamanho da página                            |
 *
 * ### Tradução dos operadores (Core → URL)
 *
 * | Operador do Core | Na URL        | Exemplo                                     |
 * |------------------|---------------|---------------------------------------------|
 * | `=`              | `eq`          | `filter[preco][eq]=50`                      |
 * | `>`              | `gt`          | `filter[preco][gt]=50`                      |
 * | `<`              | `lt`          | `filter[preco][lt]=50`                      |
 * | `>=`             | `gte`         | `filter[preco][gte]=50`                     |
 * | `<=`             | `lte`         | `filter[preco][lte]=50`                     |
 * | `igual`          | `eq`          | `filter[status][eq]=Ativo`                  |
 * | `contem`         | `like`        | `filter[nome][like]=coca`                   |
 * | `comeca_com`     | `starts_with` | `filter[nome][starts_with]=co`              |
 * | `termina_com`    | `ends_with`   | `filter[nome][ends_with]=la`                |
 * | `entre`          | `between`     | `filter[preco][between]=20,60`              |
 * | `antes`          | `before`      | `filter[criadoEm][before]=2024-01-01`       |
 * | `depois`         | `after`       | `filter[criadoEm][after]=2024-01-01`        |
 *
 * ### Serialização de valores
 *
 * - Array (ex.: `entre`) → valores separados por vírgula: `20,60`
 * - `Date` → ISO 8601: `2024-01-15T00:00:00.000Z`
 * - Booleano → `1` / `0`
 * - Demais → `String(valor)`
 *
 * ### Response esperado (fetch)
 *
 * Formato Laravel padrão (paginator):
 * ```json
 * { "data": [{ "id": 1, "nome": "Coca" }], "meta": { "current_page": 1, "total": 100, "per_page": 20 } }
 * ```
 *
 * OU formato simplificado:
 * ```json
 * { "data": [{ "id": 1, "nome": "Coca" }], "total": 100 }
 * ```
 *
 * - `rows` sai de `data` (obrigatório, sempre array de objetos).
 * - `total` sai de `meta.total`, com fallback para `total` na raiz (obrigatório).
 * - Dado aninhado é achatado pelo adapter: `{ categoria: { nome: "Bebidas" } }`
 *   vira `{ categoria_nome: "Bebidas" }` — o Core só trabalha com dado plano.
 *
 * ### Request de todas as linhas (fetchAll — exportação)
 *
 * Mesmo endpoint, mesma tradução de filtros/ordenação, sem paginação real:
 * ```
 * GET {baseUrl}?filter[...]...&sort=...&page=1&per_page=1000000
 * ```
 * O `per_page` usado é configurável via `fetchAllPageSize` (default 1000000).
 *
 * ### Request de opções de filtro (fetchFilterOptions — dropdowns)
 *
 * ```
 * GET {baseUrl}/filter-options/{coluna}
 * ```
 *
 * Response esperado (qualquer um dos dois):
 * ```json
 * { "data": [{ "label": "Ativo", "value": 1 }, { "label": "Inativo", "value": 2 }] }
 * ```
 * ```json
 * [{ "label": "Ativo", "value": 1 }]
 * ```
 * Itens escalares também são aceitos (`["Ativo", "Inativo"]`) — viram
 * `{ label: String(valor), value: valor }`.
 *
 * ---
 *
 * ## Tratamento de erros — a rede falha, o adapter não quebra
 *
 * Toda falha (timeout, HTTP 4xx/5xx, resposta não-JSON, formato inesperado,
 * rede offline) vira um `Error` com mensagem clara, propagado pela rejeição
 * da Promise. A `RsTable` (Core) captura essa rejeição no caminho oficial e a
 * converte no evento `erro` — a tabela continua viva. O adapter faz **1
 * tentativa apenas** (retry é política do usuário, não da lib).
 *
 * ---
 *
 * ## Uso
 *
 * ```ts
 * const adapter = new LaravelAdapter('/api/produtos', {
 *   headers: { Authorization: 'Bearer token' },
 *   timeout: 10000,
 * })
 * tabela.usarAdapter(adapter)
 * ```
 */

/** Opções de configuração do LaravelAdapter. */
export interface LaravelAdapterOptions {
  /**
   * Headers extras enviados em toda request (ex.: Authorization).
   * Têm precedência sobre `fetchOptions.headers` e sobre o default
   * `Accept: application/json`.
   */
  headers?: Record<string, string>
  /**
   * Opções extras repassadas ao fetch() nativo (ex.: credentials, mode).
   * `fetchOptions.headers` é mesclado (não descartado) — precedência:
   * `Accept` default → `fetchOptions.headers` → `headers` do adapter.
   * `method` (sempre GET, read-only) e `signal` (timeout do adapter)
   * não são sobrescrevíveis.
   */
  fetchOptions?: RequestInit
  /** Timeout em milissegundos. Default: 30000 (30s). */
  timeout?: number
  /** per_page usado pelo fetchAll (busca "sem paginação"). Default: 1000000. */
  fetchAllPageSize?: number
}

/** Tradução operador do Core → operador URL-safe do contrato Laravel. */
export const OPERADOR_LARAVEL: Record<string, string> = {
  '=': 'eq',
  '>': 'gt',
  '<': 'lt',
  '>=': 'gte',
  '<=': 'lte',
  igual: 'eq',
  contem: 'like',
  comeca_com: 'starts_with',
  termina_com: 'ends_with',
  entre: 'between',
  antes: 'before',
  depois: 'after',
}

const TIMEOUT_PADRAO = 30000
const FETCH_ALL_PAGE_SIZE_PADRAO = 1000000

/** Serializa um valor de filtro para a URL (contrato documentado acima). */
function serializarValor(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((v) => serializarValor(v)).join(',')
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }
  return String(value)
}

/** Objeto plano (JSON object) — candidato a achatamento. */
function ehObjetoPlano(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Achata uma linha aninhada: `{ categoria: { nome: 'Bebidas' } }` →
 * `{ categoria_nome: 'Bebidas' }`. O Core só trabalha com dado plano (R5).
 * O adapter NUNCA transforma valor (1→"Ativo") — isso é Data Engine.
 */
function achatarLinha(obj: Record<string, unknown>, prefixo = ''): Row {
  const plano: Row = {}
  for (const [key, value] of Object.entries(obj)) {
    const chave = prefixo ? `${prefixo}_${key}` : key
    if (ehObjetoPlano(value)) {
      Object.assign(plano, achatarLinha(value, chave))
    } else {
      plano[chave] = value
    }
  }
  return plano
}

export class LaravelAdapter implements DataAdapter {
  private baseUrl: string
  private headers: Record<string, string>
  private fetchOptions: RequestInit
  private timeout: number
  private fetchAllPageSize: number

  constructor(baseUrl: string, options: LaravelAdapterOptions = {}) {
    this.baseUrl = baseUrl
    this.headers = options.headers ?? {}
    this.fetchOptions = options.fetchOptions ?? {}
    this.timeout = options.timeout ?? TIMEOUT_PADRAO
    this.fetchAllPageSize = options.fetchAllPageSize ?? FETCH_ALL_PAGE_SIZE_PADRAO
  }

  /**
   * Busca dados paginados. Traduz o Query do Core para query params Laravel,
   * faz a request e converte o response em `{ rows, total }`.
   */
  async fetch(query: Query): Promise<FetchResult> {
    const params = this.montarParams(query)
    const url = this.montarUrl(params)
    const json = await this.request(url)
    return this.parseFetchResult(json, url)
  }

  /**
   * Busca TODAS as linhas que batem com filtros + ordenação (exportação).
   * Mesmo endpoint do fetch, com `page=1` e `per_page` grande
   * (configurável via `fetchAllPageSize`).
   */
  async fetchAll(query: Query): Promise<Row[]> {
    const params = this.montarParams({
      ...query,
      page: 1,
      pageSize: this.fetchAllPageSize,
    })
    const url = this.montarUrl(params)
    const json = await this.request(url)
    return this.parseFetchResult(json, url).rows
  }

  /**
   * Busca as opções de filtro de uma coluna (dropdown) no endpoint
   * `{baseUrl}/filter-options/{coluna}`. Se a baseUrl tiver query string
   * (ex.: `/api/produtos?tenant=1`), ela é preservada após o caminho:
   * `/api/produtos/filter-options/status?tenant=1`.
   */
  async fetchFilterOptions(column: string): Promise<FilterOption[]> {
    const [caminho = '', qs] = this.baseUrl.split('?')
    const base = caminho.endsWith('/') ? caminho.slice(0, -1) : caminho
    const url = `${base}/filter-options/${encodeURIComponent(column)}${qs ? `?${qs}` : ''}`
    const json = await this.request(url)
    return this.parseFilterOptions(json, url)
  }

  /** Query do Core → query params Laravel (contrato documentado no topo). */
  private montarParams(query: Query): URLSearchParams {
    const params = new URLSearchParams()

    for (const filter of query.filters) {
      params.set(
        `filter[${filter.column}][${this.traduzirOperador(filter)}]`,
        serializarValor(filter.value)
      )
    }

    if (query.sort) {
      const prefixo = query.sort.direction === 'desc' ? '-' : ''
      params.set('sort', `${prefixo}${query.sort.column}`)
    }

    params.set('page', String(query.page))
    params.set('per_page', String(query.pageSize))

    return params
  }

  private traduzirOperador(filter: Filter): string {
    const traduzido = OPERADOR_LARAVEL[filter.operator]
    if (!traduzido) {
      throw new Error(
        `LaravelAdapter: operador desconhecido \`${filter.operator}\` no filtro da coluna \`${filter.column}\` — operadores suportados: ${Object.keys(OPERADOR_LARAVEL).join(', ')}`
      )
    }
    return traduzido
  }

  private montarUrl(params: URLSearchParams): string {
    const qs = params.toString()
    if (!qs) return this.baseUrl
    const separador = this.baseUrl.includes('?') ? '&' : '?'
    return `${this.baseUrl}${separador}${qs}`
  }

  /**
   * Faz a request HTTP com fetch() nativo. 1 tentativa, sem retry.
   * O timeout cobre a request inteira, incluindo a leitura do body.
   * Toda falha vira Error com mensagem clara (a RsTable converte em evento `erro`).
   */
  private async request(url: string): Promise<unknown> {
    const controller = new AbortController()
    let estourouTimeout = false
    const timer = setTimeout(() => {
      estourouTimeout = true
      controller.abort()
    }, this.timeout)

    try {
      let response: Response
      try {
        response = await fetch(url, {
          ...this.fetchOptions,
          method: 'GET',
          headers: this.montarHeaders(),
          signal: controller.signal,
        })
      } catch (err) {
        if (estourouTimeout) throw this.erroTimeout(url)
        const detalhe = err instanceof Error ? err.message : String(err)
        throw new Error(
          `LaravelAdapter: falha de rede ao buscar \`${url}\` — verifique a conexão e o servidor (${detalhe})`
        )
      }

      if (!response.ok) {
        let body = ''
        try {
          body = await response.text()
        } catch {
          if (estourouTimeout) throw this.erroTimeout(url)
          body = '(corpo indisponível)'
        }
        throw new Error(
          `LaravelAdapter: HTTP ${response.status} ao buscar \`${url}\` — ${body || '(corpo vazio)'}`
        )
      }

      try {
        return await response.json()
      } catch (err) {
        if (estourouTimeout) throw this.erroTimeout(url)
        const detalhe = err instanceof Error ? err.message : String(err)
        throw new Error(
          `LaravelAdapter: resposta de \`${url}\` não é JSON válido (${detalhe})`
        )
      }
    } finally {
      clearTimeout(timer)
    }
  }

  private erroTimeout(url: string): Error {
    return new Error(
      `LaravelAdapter: timeout de ${this.timeout}ms excedido ao buscar \`${url}\``
    )
  }

  /**
   * Mescla os headers da request. Precedência (do mais fraco ao mais forte):
   * `Accept: application/json` (default) → `fetchOptions.headers` → `headers`
   * do adapter. Nomes normalizados em minúsculas (HTTP é case-insensitive).
   */
  private montarHeaders(): Record<string, string> {
    const headers = new Headers({ Accept: 'application/json' })
    if (this.fetchOptions.headers) {
      new Headers(this.fetchOptions.headers).forEach((valor, nome) => {
        headers.set(nome, valor)
      })
    }
    for (const [nome, valor] of Object.entries(this.headers)) {
      headers.set(nome, valor)
    }
    const plano: Record<string, string> = {}
    headers.forEach((valor, nome) => {
      plano[nome] = valor
    })
    return plano
  }

  /** Response Laravel → FetchResult. Formato inesperado = erro claro (Falhe Alto). */
  private parseFetchResult(json: unknown, url: string): FetchResult {
    if (!ehObjetoPlano(json)) {
      throw new Error(
        `LaravelAdapter: formato de resposta inesperado de \`${url}\` — esperava objeto \`{ data: [...], meta: { total } }\`, recebeu ${JSON.stringify(json)}`
      )
    }

    const data = json.data
    if (!Array.isArray(data)) {
      throw new Error(
        `LaravelAdapter: resposta de \`${url}\` sem \`data\` como array — esperava \`{ data: [...] }\`, recebeu ${JSON.stringify(json).slice(0, 200)}`
      )
    }

    const rows: Row[] = data.map((item, index) => {
      if (!ehObjetoPlano(item)) {
        throw new Error(
          `LaravelAdapter: item ${index} de \`data\` não é um objeto — esperava \`{ campo: valor }\`, recebeu ${JSON.stringify(item)}`
        )
      }
      return achatarLinha(item)
    })

    const meta = ehObjetoPlano(json.meta) ? json.meta : undefined
    const totalBruto = meta?.total ?? json.total
    const total = Number(totalBruto)
    if (totalBruto === null || totalBruto === undefined || isNaN(total)) {
      throw new Error(
        `LaravelAdapter: resposta de \`${url}\` sem total numérico — esperava \`meta.total\` ou \`total\` na raiz, recebeu ${JSON.stringify(totalBruto)}`
      )
    }

    return { rows, total }
  }

  /** Response do endpoint de opções → FilterOption[]. */
  private parseFilterOptions(json: unknown, url: string): FilterOption[] {
    const lista = Array.isArray(json)
      ? json
      : ehObjetoPlano(json) && Array.isArray(json.data)
        ? json.data
        : null

    if (!lista) {
      throw new Error(
        `LaravelAdapter: formato de opções de filtro inesperado de \`${url}\` — esperava \`{ data: [{ label, value }] }\` ou array, recebeu ${JSON.stringify(json).slice(0, 200)}`
      )
    }

    return lista.map((item) => {
      if (ehObjetoPlano(item) && 'value' in item) {
        const label = 'label' in item ? String(item.label) : String(item.value)
        return { label, value: item.value }
      }
      return { label: String(item), value: item }
    })
  }
}
