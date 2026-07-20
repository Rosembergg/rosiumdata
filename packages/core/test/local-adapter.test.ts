import { describe, it, expect } from 'vitest'
import { LocalAdapter, column, RsTable } from '@rsdata/core'
import type { Row, Query } from '@rsdata/core'

const dados: Row[] = [
  { id: 1, nome: 'Produto A', preco: 10.5, ativo: true, criadoEm: '2024-01-15', status: 1 },
  { id: 2, nome: 'Produto B', preco: 25.0, ativo: false, criadoEm: '2024-03-20', status: 2 },
  { id: 3, nome: 'Servico C', preco: 99.9, ativo: true, criadoEm: '2024-06-01', status: 1 },
  { id: 4, nome: 'Zebrinha D', preco: 50.0, ativo: true, criadoEm: '2024-12-31', status: 3 },
  { id: 5, nome: 'Item E', preco: 15.0, ativo: false, criadoEm: '2024-02-14', status: 2 },
]

function criarQuery(overrides?: Partial<Query>): Query {
  return {
    filters: [],
    page: 1,
    pageSize: 20,
    ...overrides,
  }
}

describe('LocalAdapter — fetch', () => {
  it('deve retornar todas as linhas sem filtros', async () => {
    const adapter = new LocalAdapter(dados)
    const result = await adapter.fetch(criarQuery())
    expect(result.rows).toHaveLength(5)
    expect(result.total).toBe(5)
  })

  it('deve retornar linhas paginadas', async () => {
    const adapter = new LocalAdapter(dados)
    const result = await adapter.fetch(criarQuery({ page: 1, pageSize: 2 }))
    expect(result.rows).toHaveLength(2)
    expect(result.total).toBe(5)
    expect(result.rows[0]!.id).toBe(1)
    expect(result.rows[1]!.id).toBe(2)
  })

  it('deve retornar pagina 2', async () => {
    const adapter = new LocalAdapter(dados)
    const result = await adapter.fetch(criarQuery({ page: 2, pageSize: 2 }))
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]!.id).toBe(3)
    expect(result.rows[1]!.id).toBe(4)
  })

  it('deve retornar ultima pagina com menos itens', async () => {
    const adapter = new LocalAdapter(dados)
    const result = await adapter.fetch(criarQuery({ page: 3, pageSize: 2 }))
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]!.id).toBe(5)
  })

  it('pagina alem do total deve retornar array vazio', async () => {
    const adapter = new LocalAdapter(dados)
    const result = await adapter.fetch(criarQuery({ page: 99, pageSize: 2 }))
    expect(result.rows).toHaveLength(0)
    expect(result.total).toBe(5)
  })

  it('pagina 0 ou negativa — slice vazio do inicio', async () => {
    const adapter = new LocalAdapter(dados)
    const result = await adapter.fetch(criarQuery({ page: 0, pageSize: 5 }))
    expect(result.rows).toHaveLength(5)
  })

  it('array vazio retorna sucesso', async () => {
    const adapter = new LocalAdapter([])
    const result = await adapter.fetch(criarQuery())
    expect(result.rows).toEqual([])
    expect(result.total).toBe(0)
  })

  it('fetch retorna Promise', () => {
    const adapter = new LocalAdapter(dados)
    const result = adapter.fetch(criarQuery())
    expect(result).toBeInstanceOf(Promise)
  })
})

describe('LocalAdapter — fetch com filtro', () => {
  it('deve filtrar e retornar total correto', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({
      filters: [{ column: 'nome', operator: 'contains', value: 'Produto' }],
    })
    const result = await adapter.fetch(query)
    expect(result.rows).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.rows[0]!.id).toBe(1)
    expect(result.rows[1]!.id).toBe(2)
  })

  it('filtro + paginacao', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({
      filters: [{ column: 'ativo', operator: 'equals', value: true }],
      page: 1,
      pageSize: 2,
    })
    const result = await adapter.fetch(query)
    expect(result.rows).toHaveLength(2)
    expect(result.total).toBe(3)
  })

  it('filtro sem match', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({
      filters: [{ column: 'nome', operator: 'contains', value: 'Inexistente' }],
    })
    const result = await adapter.fetch(query)
    expect(result.rows).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})

describe('LocalAdapter — fetch com ordenacao', () => {
  it('deve ordenar asc', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({ sort: { column: 'preco', direction: 'asc' } })
    const result = await adapter.fetch(query)
    expect(result.rows[0]!.preco).toBe(10.5)
    expect(result.rows[4]!.preco).toBe(99.9)
  })

  it('deve ordenar desc', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({ sort: { column: 'preco', direction: 'desc' } })
    const result = await adapter.fetch(query)
    expect(result.rows[0]!.preco).toBe(99.9)
    expect(result.rows[4]!.preco).toBe(10.5)
  })

  it('filtro + ordenacao + paginacao combinados', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({
      filters: [{ column: 'preco', operator: '>=', value: 15 }],
      sort: { column: 'preco', direction: 'asc' },
      page: 1,
      pageSize: 2,
    })
    const result = await adapter.fetch(query)
    expect(result.total).toBe(4)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]!.preco).toBe(15)
    expect(result.rows[1]!.preco).toBe(25)
  })
})

describe('LocalAdapter — fetchAll', () => {
  it('deve retornar todas as linhas sem paginacao', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({ pageSize: 2, page: 1 })
    const result = await adapter.fetchAll(query)
    expect(result).toHaveLength(5)
  })

  it('fetchAll com filtro deve retornar todas as matches', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({
      filters: [{ column: 'ativo', operator: 'equals', value: true }],
    })
    const result = await adapter.fetchAll(query)
    expect(result).toHaveLength(3)
  })

  it('fetchAll com ordenacao', async () => {
    const adapter = new LocalAdapter(dados)
    const query = criarQuery({ sort: { column: 'preco', direction: 'desc' } })
    const result = await adapter.fetchAll(query)
    expect(result[0]!.preco).toBe(99.9)
    expect(result[4]!.preco).toBe(10.5)
  })

  it('fetchAll retorna Promise', () => {
    const adapter = new LocalAdapter(dados)
    const result = adapter.fetchAll(criarQuery())
    expect(result).toBeInstanceOf(Promise)
  })
})

describe('LocalAdapter — fetchFilterOptions', () => {
  it('deve retornar valores unicos', async () => {
    const adapter = new LocalAdapter(dados)
    const options = await adapter.fetchFilterOptions('status')
    expect(options).toHaveLength(3)
    const values = options.map((o) => o.value)
    expect(values).toContain(1)
    expect(values).toContain(2)
    expect(values).toContain(3)
  })

  it('cada opcao deve ter label e value', async () => {
    const adapter = new LocalAdapter(dados)
    const options = await adapter.fetchFilterOptions('status')
    for (const opt of options) {
      expect(opt).toHaveProperty('label')
      expect(opt).toHaveProperty('value')
    }
  })

  it('coluna com valores repetidos retorna unicamente', async () => {
    const adapter = new LocalAdapter(dados)
    const options = await adapter.fetchFilterOptions('ativo')
    expect(options).toHaveLength(2)
  })

  it('coluna inexistente retorna array vazio', async () => {
    const adapter = new LocalAdapter(dados)
    const options = await adapter.fetchFilterOptions('inexistente')
    expect(options).toEqual([])
  })

  it('array vazio retorna array vazio', async () => {
    const adapter = new LocalAdapter([])
    const options = await adapter.fetchFilterOptions('status')
    expect(options).toEqual([])
  })
})

describe('LocalAdapter — implementa DataAdapter', () => {
  it('deve ter fetch, fetchAll e fetchFilterOptions', () => {
    const adapter = new LocalAdapter(dados)
    expect(typeof adapter.fetch).toBe('function')
    expect(typeof adapter.fetchAll).toBe('function')
    expect(typeof adapter.fetchFilterOptions).toBe('function')
  })
})
