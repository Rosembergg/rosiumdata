import { describe, it, expect } from 'vitest'
import { VERSION, NAME } from '@rsdata/core'

describe('@rsdata/core — smoke test', () => {
  it('deve exportar NAME', () => {
    expect(NAME).toBe('@rsdata/core')
  })

  it('deve exportar VERSION', () => {
    expect(VERSION).toBe('0.0.1')
  })

  it('deve ter versão no formato SemVer', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('deve ser pacote válido', () => {
    expect(NAME).toBeTruthy()
    expect(VERSION).toBeTruthy()
  })
})
