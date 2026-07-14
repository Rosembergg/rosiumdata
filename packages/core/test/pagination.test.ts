import { describe, it, expect } from 'vitest'
import { calcularTotalPaginas, validarPagina } from '@rsdata/core'

describe('calcularTotalPaginas()', () => {
  it('deve calcular paginas corretamente', () => {
    expect(calcularTotalPaginas(100, 20)).toBe(5)
  })

  it('deve arredondar para cima', () => {
    expect(calcularTotalPaginas(101, 20)).toBe(6)
  })

  it('deve retornar 1 quando total e menor que pageSize', () => {
    expect(calcularTotalPaginas(5, 20)).toBe(1)
  })

  it('deve retornar 0 para total 0', () => {
    expect(calcularTotalPaginas(0, 20)).toBe(0)
  })

  it('deve retornar 0 para total negativo', () => {
    expect(calcularTotalPaginas(-5, 20)).toBe(0)
  })

  it('deve retornar 0 para pageSize 0', () => {
    expect(calcularTotalPaginas(100, 0)).toBe(0)
  })

  it('deve retornar 0 para pageSize negativo', () => {
    expect(calcularTotalPaginas(100, -5)).toBe(0)
  })
})

describe('validarPagina()', () => {
  it('deve retornar a pagina se estiver dentro dos limites', () => {
    expect(validarPagina(3, 10)).toBe(3)
  })

  it('deve retornar 1 se pagina for menor que 1', () => {
    expect(validarPagina(0, 10)).toBe(1)
    expect(validarPagina(-5, 10)).toBe(1)
  })

  it('deve retornar a ultima pagina se pagina exceder o total', () => {
    expect(validarPagina(15, 10)).toBe(10)
  })

  it('deve retornar 1 quando totalPages e 0', () => {
    expect(validarPagina(5, 0)).toBe(1)
  })
})
