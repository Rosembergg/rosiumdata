import { describe, it, expect } from 'vitest'
import { validateRow, validateRows, column } from '@rsdata/core'
import type { ColumnDefinition } from '@rsdata/core'

describe('validateRow() — Falhe Alto', () => {
  const colunas: ColumnDefinition[] = [
    column('nome', { type: 'text' }),
    column('preco', { type: 'number' }),
    column('ativo', { type: 'boolean' }),
    column('criadoEm', { type: 'date' }),
    column('status', { type: 'select', options: { 1: 'Ativo', 2: 'Inativo' } }),
    column('acoes', { type: 'action' }),
  ]

  it('deve validar linha com todos os dados corretos', () => {
    const erros = validateRow({
      nome: 'Produto',
      preco: 10.5,
      ativo: true,
      criadoEm: new Date('2024-01-01'),
      status: 1,
      acoes: null,
    }, 0, colunas)

    expect(erros).toHaveLength(0)
  })

  it('deve aceitar null/undefined em qualquer coluna', () => {
    const erros = validateRow({
      nome: null,
      preco: undefined,
      ativo: null,
      criadoEm: undefined,
      status: null,
    }, 0, colunas)

    expect(erros).toHaveLength(0)
  })

  it('deve detectar numero invalido', () => {
    const erros = validateRow({
      nome: 'OK',
      preco: 'nao-e-numero',
    }, 0, colunas)

    const erroPreco = erros.find((e) => e.column === 'preco')
    expect(erroPreco).toBeDefined()
    expect(erroPreco!.expected).toBe('number')
    expect(erroPreco!.received).toBe('nao-e-numero')
    expect(erroPreco!.rowIndex).toBe(0)
  })

  it('deve detectar booleano invalido', () => {
    const erros = validateRow({
      nome: 'OK',
      preco: 10,
      ativo: 'sim',
    }, 0, colunas)

    const erroAtivo = erros.find((e) => e.column === 'ativo')
    expect(erroAtivo).toBeDefined()
    expect(erroAtivo!.expected).toBe('boolean')
  })

  it('deve detectar data invalida', () => {
    const erros = validateRow({
      nome: 'OK',
      preco: 10,
      criadoEm: 'data-invalida-totalmente',
    }, 0, colunas)

    const erroData = erros.find((e) => e.column === 'criadoEm')
    expect(erroData).toBeDefined()
    expect(erroData!.expected).toBe('valid date')
  })

  it('deve detectar selecao fora das opcoes', () => {
    const erros = validateRow({
      nome: 'OK',
      preco: 10,
      status: 99,
    }, 0, colunas)

    const erroStatus = erros.find((e) => e.column === 'status')
    expect(erroStatus).toBeDefined()
    expect(erroStatus!.expected).toBe('valid option')
    expect(erroStatus!.received).toBe(99)
  })

  it('deve ignorar coluna tipo acao na validacao', () => {
    const erros = validateRow({
      nome: 'OK',
      preco: 10,
      acoes: 'qualquer-coisa',
    }, 0, colunas)

    expect(erros).toHaveLength(0)
  })

  it('deve retornar erro com column, rowIndex, expected e received', () => {
    const erros = validateRow({
      nome: 123,
      preco: 'abc',
    }, 5, colunas)

    expect(erros.length).toBeGreaterThanOrEqual(2)
    for (const erro of erros) {
      expect(erro).toHaveProperty('column')
      expect(erro).toHaveProperty('rowIndex', 5)
      expect(erro).toHaveProperty('expected')
      expect(erro).toHaveProperty('received')
    }
  })
})

describe('validateRows() — validacao em lote', () => {
  const colunas: ColumnDefinition[] = [
    column('nome', { type: 'text' }),
    column('preco', { type: 'number' }),
  ]

  it('deve validar multiplas linhas', () => {
    const rows = [
      { nome: 'A', preco: 10 },
      { nome: 'B', preco: 'errado' },
      { nome: 'C', preco: 20 },
      { nome: 'D', preco: 'tambem-errado' },
    ]

    const erros = validateRows(rows, colunas)

    expect(erros).toHaveLength(2)
    expect(erros[0]!.rowIndex).toBe(1)
    expect(erros[0]!.column).toBe('preco')
    expect(erros[1]!.rowIndex).toBe(3)
    expect(erros[1]!.column).toBe('preco')
  })

  it('deve retornar array vazio quando todos os dados sao validos', () => {
    const rows = [
      { nome: 'A', preco: 10 },
      { nome: 'B', preco: 20 },
    ]

    const erros = validateRows(rows, colunas)
    expect(erros).toHaveLength(0)
  })

  it('deve retornar array vazio para lista vazia', () => {
    const erros = validateRows([], colunas)
    expect(erros).toHaveLength(0)
  })
})
