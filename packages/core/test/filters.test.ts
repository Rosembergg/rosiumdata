import { describe, it, expect } from 'vitest'
import { applyFilters } from '@rsdata/core'
import type { Row, Filter } from '@rsdata/core'

const dados: Row[] = [
  { id: 1, nome: 'Produto A', preco: 10.5, ativo: true, criadoEm: '2024-01-15', status: 1 },
  { id: 2, nome: 'Produto B', preco: 25.0, ativo: false, criadoEm: '2024-03-20', status: 2 },
  { id: 3, nome: 'Servico C', preco: 99.9, ativo: true, criadoEm: '2024-06-01', status: 1 },
  { id: 4, nome: 'Zebrinha D', preco: 50.0, ativo: true, criadoEm: '2024-12-31', status: 3 },
]

describe('applyFilters — texto', () => {
  it('contem — deve filtrar parcialmente (case insensitive)', () => {
    const filtro: Filter = { column: 'nome', operator: 'contains', value: 'produto' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([1, 2])
  })

  it('igual — deve filtrar por igualdade exata', () => {
    const filtro: Filter = { column: 'nome', operator: 'equals', value: 'Produto A' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(1)
  })

  it('comeca_com — deve filtrar por prefixo', () => {
    const filtro: Filter = { column: 'nome', operator: 'startsWith', value: 'Produto' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([1, 2])
  })

  it('termina_com — deve filtrar por sufixo', () => {
    const filtro: Filter = { column: 'nome', operator: 'endsWith', value: 'C' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(3)
  })
})

describe('applyFilters — numero', () => {
  it('= — deve filtrar por igualdade numerica', () => {
    const filtro: Filter = { column: 'preco', operator: '=', value: 25 }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(2)
  })

  it('> — deve filtrar maior que', () => {
    const filtro: Filter = { column: 'preco', operator: '>', value: 25 }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([3, 4])
  })

  it('< — deve filtrar menor que', () => {
    const filtro: Filter = { column: 'preco', operator: '<', value: 25 }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(1)
  })

  it('>= — deve filtrar maior ou igual', () => {
    const filtro: Filter = { column: 'preco', operator: '>=', value: 25 }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(3)
    expect(result.map((r) => r.id)).toEqual([2, 3, 4])
  })

  it('<= — deve filtrar menor ou igual', () => {
    const filtro: Filter = { column: 'preco', operator: '<=', value: 25 }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([1, 2])
  })

  it('entre — deve filtrar por intervalo numerico', () => {
    const filtro: Filter = { column: 'preco', operator: 'between', value: [20, 60] }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([2, 4])
  })

  it('entre — bordas inclusivas', () => {
    const filtro: Filter = { column: 'preco', operator: 'between', value: [10.5, 25] }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([1, 2])
  })
})

describe('applyFilters — data', () => {
  it('entre — deve filtrar por intervalo de datas (string)', () => {
    const filtro: Filter = { column: 'criadoEm', operator: 'between', value: ['2024-01-01', '2024-03-31'] }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([1, 2])
  })

  it('entre — deve filtrar por intervalo de datas (Date)', () => {
    const filtro: Filter = { column: 'criadoEm', operator: 'between', value: [new Date('2024-06-01'), new Date('2024-12-31')] }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([3, 4])
  })

  it('antes — deve filtrar datas anteriores', () => {
    const filtro: Filter = { column: 'criadoEm', operator: 'before', value: '2024-04-01' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([1, 2])
  })

  it('depois — deve filtrar datas posteriores', () => {
    const filtro: Filter = { column: 'criadoEm', operator: 'after', value: '2024-04-01' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([3, 4])
  })

  it('igual — deve filtrar por data igual', () => {
    const filtro: Filter = { column: 'criadoEm', operator: 'equals', value: '2024-01-15' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(1)
  })
})

describe('applyFilters — booleano', () => {
  it('igual — deve filtrar true', () => {
    const filtro: Filter = { column: 'ativo', operator: 'equals', value: true }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(3)
  })

  it('igual — deve filtrar false', () => {
    const filtro: Filter = { column: 'ativo', operator: 'equals', value: false }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(2)
  })
})

describe('applyFilters — selecao', () => {
  it('igual — deve filtrar por valor de selecao', () => {
    const filtro: Filter = { column: 'status', operator: 'equals', value: 1 }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.id)).toEqual([1, 3])
  })

  it('igual — deve filtrar por valor 2', () => {
    const filtro: Filter = { column: 'status', operator: 'equals', value: 2 }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(2)
  })
})

describe('applyFilters — multiplos filtros (AND)', () => {
  it('dois filtros devem aplicar AND', () => {
    const filtro1: Filter = { column: 'nome', operator: 'contains', value: 'Produto' }
    const filtro2: Filter = { column: 'preco', operator: '>', value: 20 }
    const result = applyFilters(dados, [filtro1, filtro2])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(2)
  })

  it('tres filtros combinados', () => {
    const filtro1: Filter = { column: 'ativo', operator: 'equals', value: true }
    const filtro2: Filter = { column: 'status', operator: 'equals', value: 1 }
    const filtro3: Filter = { column: 'preco', operator: '<', value: 20 }
    const result = applyFilters(dados, [filtro1, filtro2, filtro3])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(1)
  })

  it('filtros sem match devem retornar vazio', () => {
    const filtro1: Filter = { column: 'nome', operator: 'contains', value: 'Inexistente' }
    const result = applyFilters(dados, [filtro1])
    expect(result).toHaveLength(0)
  })
})

describe('applyFilters — casos de borda', () => {
  it('array vazio deve retornar vazio', () => {
    const filtro: Filter = { column: 'nome', operator: 'contains', value: 'X' }
    const result = applyFilters([], [filtro])
    expect(result).toEqual([])
  })

  it('sem filtros deve retornar todas as linhas', () => {
    const result = applyFilters(dados, [])
    expect(result).toEqual(dados)
  })

  it('valor de filtro null/undefined/vazio passa tudo', () => {
    const filtroVazio: Filter = { column: 'nome', operator: 'contains', value: '' }
    const result = applyFilters(dados, [filtroVazio])
    expect(result).toEqual(dados)
  })

  it('valor null na linha nao deve dar match', () => {
    const dadosComNull: Row[] = [
      { id: 1, nome: 'OK' },
      { id: 2, nome: null },
    ]
    const filtro: Filter = { column: 'nome', operator: 'contains', value: 'OK' }
    const result = applyFilters(dadosComNull, [filtro])
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe(1)
  })

  it('operador desconhecido deve retornar false para a linha', () => {
    const filtro: Filter = { column: 'nome', operator: 'operador_invalido', value: 'X' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(0)
  })

  it('entre com valor nao-array deve retornar false', () => {
    const filtro: Filter = { column: 'preco', operator: 'between', value: 50 }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(0)
  })

  it('entre com array de tamanho 1 deve retornar false', () => {
    const filtro: Filter = { column: 'preco', operator: 'between', value: [50] }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(0)
  })

  it('antes/depois com valor nao-data deve retornar false', () => {
    const filtro: Filter = { column: 'nome', operator: 'before', value: '2024-01-01' }
    const result = applyFilters(dados, [filtro])
    expect(result).toHaveLength(0)
  })
})
