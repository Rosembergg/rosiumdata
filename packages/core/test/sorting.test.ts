import { describe, it, expect } from 'vitest'
import { ordenarArray } from '@rsdata/core'
import type { Row } from '@rsdata/core'

describe('ordenarArray — texto', () => {
  const dados: Row[] = [
    { nome: 'Zebrinha' },
    { nome: 'Abacate' },
    { nome: 'Manga' },
  ]

  it('asc — ordem alfabetica crescente', () => {
    const result = ordenarArray(dados, 'nome', 'asc')
    expect(result.map((r) => r.nome)).toEqual(['Abacate', 'Manga', 'Zebrinha'])
  })

  it('desc — ordem alfabetica decrescente', () => {
    const result = ordenarArray(dados, 'nome', 'desc')
    expect(result.map((r) => r.nome)).toEqual(['Zebrinha', 'Manga', 'Abacate'])
  })
})

describe('ordenarArray — numero', () => {
  const dados: Row[] = [
    { preco: 99.9 },
    { preco: 10.5 },
    { preco: 50 },
  ]

  it('asc — ordem numerica crescente', () => {
    const result = ordenarArray(dados, 'preco', 'asc')
    expect(result.map((r) => r.preco)).toEqual([10.5, 50, 99.9])
  })

  it('desc — ordem numerica decrescente', () => {
    const result = ordenarArray(dados, 'preco', 'desc')
    expect(result.map((r) => r.preco)).toEqual([99.9, 50, 10.5])
  })
})

describe('ordenarArray — data', () => {
  const dados: Row[] = [
    { data: new Date('2024-12-31') },
    { data: new Date('2024-01-15') },
    { data: new Date('2024-06-01') },
  ]

  it('asc — ordem cronologica crescente', () => {
    const result = ordenarArray(dados, 'data', 'asc')
    expect(result[0]!.data).toEqual(new Date('2024-01-15'))
    expect(result[1]!.data).toEqual(new Date('2024-06-01'))
    expect(result[2]!.data).toEqual(new Date('2024-12-31'))
  })

  it('desc — ordem cronologica decrescente', () => {
    const result = ordenarArray(dados, 'data', 'desc')
    expect(result[0]!.data).toEqual(new Date('2024-12-31'))
    expect(result[1]!.data).toEqual(new Date('2024-06-01'))
    expect(result[2]!.data).toEqual(new Date('2024-01-15'))
  })
})

describe('ordenarArray — booleano', () => {
  const dados: Row[] = [
    { ativo: true },
    { ativo: false },
    { ativo: true },
  ]

  it('asc — false antes de true', () => {
    const result = ordenarArray(dados, 'ativo', 'asc')
    expect(result[0]!.ativo).toBe(false)
    expect(result[1]!.ativo).toBe(true)
    expect(result[2]!.ativo).toBe(true)
  })

  it('desc — true antes de false', () => {
    const result = ordenarArray(dados, 'ativo', 'desc')
    expect(result[0]!.ativo).toBe(true)
    expect(result[1]!.ativo).toBe(true)
    expect(result[2]!.ativo).toBe(false)
  })
})

describe('ordenarArray — valores nulos/undefined', () => {
  const dados: Row[] = [
    { nome: 'B' },
    { nome: null },
    { nome: 'A' },
    { nome: undefined },
  ]

  it('nulos vao para o final em asc', () => {
    const result = ordenarArray(dados, 'nome', 'asc')
    expect(result[0]!.nome).toBe('A')
    expect(result[1]!.nome).toBe('B')
    expect(result[2]!.nome).toBeNull()
    expect(result[3]!.nome).toBeUndefined()
  })

  it('nulos vao para o final em desc', () => {
    const result = ordenarArray(dados, 'nome', 'desc')
    expect(result[0]!.nome).toBe('B')
    expect(result[1]!.nome).toBe('A')
    expect(result[2]!.nome).toBeNull()
    expect(result[3]!.nome).toBeUndefined()
  })
})

describe('ordenarArray — dados repetidos', () => {
  it('valores repetidos mantem ordem estavel', () => {
    const dados: Row[] = [
      { preco: 10, id: 1 },
      { preco: 10, id: 2 },
      { preco: 10, id: 3 },
    ]
    const result = ordenarArray(dados, 'preco', 'asc')
    expect(result.map((r) => r.id)).toEqual([1, 2, 3])
  })
})

describe('ordenarArray — casos de borda', () => {
  it('array vazio', () => {
    const result = ordenarArray([], 'coluna', 'asc')
    expect(result).toEqual([])
  })

  it('array com um unico elemento', () => {
    const result = ordenarArray([{ nome: 'A' }], 'nome', 'asc')
    expect(result).toEqual([{ nome: 'A' }])
  })

  it('coluna inexistente — todos undefined, ordem mantida', () => {
    const dados: Row[] = [
      { nome: 'B' },
      { nome: 'A' },
    ]
    const result = ordenarArray(dados, 'inexistente', 'asc')
    expect(result).toHaveLength(2)
  })

  it('deve retornar novo array, nao modificar original', () => {
    const dados: Row[] = [
      { nome: 'B' },
      { nome: 'A' },
    ]
    const result = ordenarArray(dados, 'nome', 'asc')
    expect(result).not.toBe(dados)
    expect(dados[0]!.nome).toBe('B')
    expect(dados[1]!.nome).toBe('A')
  })
})
