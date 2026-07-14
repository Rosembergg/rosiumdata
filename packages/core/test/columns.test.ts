import { describe, it, expect } from 'vitest'
import { coluna, formatarValorPadrao, ALINHAMENTO_PADRAO, OPERADORES_PADRAO } from '@rsdata/core'
import type { ColumnType } from '@rsdata/core'

describe('coluna() — factory de definicao de coluna', () => {
  it('deve criar coluna com tipo texto por padrao', () => {
    const c = coluna('nome', {})
    expect(c.key).toBe('nome')
    expect(c.type).toBe('texto')
    expect(c.label).toBe('nome')
  })

  it('deve usar label customizado', () => {
    const c = coluna('nome', { label: 'Nome Completo' })
    expect(c.label).toBe('Nome Completo')
  })

  it('deve marcar tipo acao como nao-filtravel por padrao', () => {
    const c = coluna('acoes', { type: 'acao' })
    expect(c.filterable).toBe(false)
  })

  it('deve aceitar todas as opcoes de configuracao', () => {
    const c = coluna('preco', {
      type: 'numero',
      label: 'Preco',
      mask: 'R$ #.##0,00',
      alignment: 'right',
      filterOperators: ['=', '>'],
      defaultOperator: '>',
      exportAsFormatted: true,
    })

    expect(c.type).toBe('numero')
    expect(c.mask).toBe('R$ #.##0,00')
    expect(c.alignment).toBe('right')
    expect(c.filterOperators).toEqual(['=', '>'])
    expect(c.defaultOperator).toBe('>')
    expect(c.exportAsFormatted).toBe(true)
  })

  it('deve aceitar opcoes para tipo selecao', () => {
    const c = coluna('status', {
      type: 'selecao',
      options: { 1: 'Ativo', 2: 'Inativo' },
    })
    expect(c.options).toEqual({ 1: 'Ativo', 2: 'Inativo' })
  })

  it('deve aceitar funcao transform', () => {
    const fn = (v: unknown) => String(v).toUpperCase()
    const c = coluna('nome', { transform: fn })
    expect(c.transform).toBe(fn)
  })
})

describe('formatarValorPadrao()', () => {
  it('deve retornar string vazia para null/undefined', () => {
    const c = coluna('nome', { type: 'texto' })
    expect(formatarValorPadrao(null, c)).toBe('')
    expect(formatarValorPadrao(undefined, c)).toBe('')
  })

  it('deve formatar booleano como Sim/Nao', () => {
    const c = coluna('ativo', { type: 'booleano' })
    expect(formatarValorPadrao(true, c)).toBe('Sim')
    expect(formatarValorPadrao(false, c)).toBe('Nao')
  })

  it('deve formatar numero como string', () => {
    const c = coluna('preco', { type: 'numero' })
    expect(formatarValorPadrao(100, c)).toBe('100')
    expect(formatarValorPadrao(5.99, c)).toBe('5.99')
  })

  it('deve aplicar mascara R$ em coluna numero', () => {
    const c = coluna('preco', { type: 'numero', mask: 'R$ #.##0,00' })
    const formatted = formatarValorPadrao(100, c)
    expect(formatted).toContain('R$')
    expect(formatted).toContain('100')
  })

  it('deve aplicar mascara de numero sem currency', () => {
    const c = coluna('quantidade', { type: 'numero', mask: '#.##0' })
    const formatted = formatarValorPadrao(1500, c)
    expect(formatted).toContain('1.500')
  })

  it('deve formatar selecao usando opcoes', () => {
    const c = coluna('status', {
      type: 'selecao',
      options: { 1: 'Ativo', 2: 'Inativo' },
    })
    expect(formatarValorPadrao(1, c)).toBe('Ativo')
    expect(formatarValorPadrao(2, c)).toBe('Inativo')
  })

  it('deve retornar o proprio valor se nao estiver nas opcoes de selecao', () => {
    const c = coluna('status', {
      type: 'selecao',
      options: { 1: 'Ativo' },
    })
    expect(formatarValorPadrao(999, c)).toBe('999')
  })

  it('deve formatar data com locale pt-BR', () => {
    const c = coluna('criadoEm', { type: 'data' })
    const date = new Date(2024, 0, 15)
    const formatted = formatarValorPadrao(date, c)
    expect(formatted).toBe('15/01/2024')
  })

  it('deve formatar data-hora com locale pt-BR', () => {
    const c = coluna('atualizadoEm', { type: 'data-hora' })
    const date = new Date(2024, 0, 15, 14, 30, 0)
    const formatted = formatarValorPadrao(date, c)
    expect(formatted).toContain('15/01/2024')
    expect(formatted).toContain('14:30')
  })

  it('deve retornar string vazia para tipo acao', () => {
    const c = coluna('acoes', { type: 'acao' })
    expect(formatarValorPadrao('qualquer', c)).toBe('')
  })

  it('deve formatar texto como string', () => {
    const c = coluna('nome', { type: 'texto' })
    expect(formatarValorPadrao('Coca-Cola', c)).toBe('Coca-Cola')
  })
})

describe('ALINHAMENTO_PADRAO', () => {
  it('texto deve alinhar a esquerda', () => {
    expect(ALINHAMENTO_PADRAO.texto).toBe('left')
  })

  it('numero deve alinhar a direita', () => {
    expect(ALINHAMENTO_PADRAO.numero).toBe('right')
  })

  it('data/data-hora devem alinhar ao centro', () => {
    expect(ALINHAMENTO_PADRAO.data).toBe('center')
    expect(ALINHAMENTO_PADRAO['data-hora']).toBe('center')
  })

  it('booleano deve alinhar ao centro', () => {
    expect(ALINHAMENTO_PADRAO.booleano).toBe('center')
  })

  it('acao deve alinhar ao centro', () => {
    expect(ALINHAMENTO_PADRAO.acao).toBe('center')
  })
})

describe('OPERADORES_PADRAO', () => {
  it('texto deve ter contem, igual, comeca_com, termina_com', () => {
    expect(OPERADORES_PADRAO.texto).toEqual(['contem', 'igual', 'comeca_com', 'termina_com'])
  })

  it('numero deve ter =, >, <, >=, <=, entre', () => {
    expect(OPERADORES_PADRAO.numero).toEqual(['=', '>', '<', '>=', '<=', 'entre'])
  })

  it('data/data-hora devem ter entre, antes, depois, igual', () => {
    expect(OPERADORES_PADRAO.data).toEqual(['entre', 'antes', 'depois', 'igual'])
    expect(OPERADORES_PADRAO['data-hora']).toEqual(['entre', 'antes', 'depois', 'igual'])
  })

  it('booleano deve ter apenas igual', () => {
    expect(OPERADORES_PADRAO.booleano).toEqual(['igual'])
  })

  it('selecao deve ter apenas igual', () => {
    expect(OPERADORES_PADRAO.selecao).toEqual(['igual'])
  })

  it('acao nao deve ter operadores', () => {
    expect(OPERADORES_PADRAO.acao).toEqual([])
  })
})
