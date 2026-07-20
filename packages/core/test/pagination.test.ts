import { describe, it, expect } from 'vitest'
import { calculateTotalPages, validatePage } from '@rosiumdata/core'

describe('calculateTotalPages()', () => {
  it('deve calcular paginas corretamente', () => {
    expect(calculateTotalPages(100, 20)).toBe(5)
  })

  it('deve arredondar para cima', () => {
    expect(calculateTotalPages(101, 20)).toBe(6)
  })

  it('deve retornar 1 quando total e menor que pageSize', () => {
    expect(calculateTotalPages(5, 20)).toBe(1)
  })

  it('deve retornar 0 para total 0', () => {
    expect(calculateTotalPages(0, 20)).toBe(0)
  })

  it('deve retornar 0 para total negativo', () => {
    expect(calculateTotalPages(-5, 20)).toBe(0)
  })

  it('deve retornar 0 para pageSize 0', () => {
    expect(calculateTotalPages(100, 0)).toBe(0)
  })

  it('deve retornar 0 para pageSize negativo', () => {
    expect(calculateTotalPages(100, -5)).toBe(0)
  })
})

describe('validatePage()', () => {
  it('deve retornar a pagina se estiver dentro dos limites', () => {
    expect(validatePage(3, 10)).toBe(3)
  })

  it('deve retornar 1 se pagina for menor que 1', () => {
    expect(validatePage(0, 10)).toBe(1)
    expect(validatePage(-5, 10)).toBe(1)
  })

  it('deve retornar a ultima pagina se pagina exceder o total', () => {
    expect(validatePage(15, 10)).toBe(10)
  })

  it('deve retornar 1 quando totalPages e 0', () => {
    expect(validatePage(5, 0)).toBe(1)
  })
})
