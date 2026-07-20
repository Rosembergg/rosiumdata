import { describe, it, expect } from 'vitest'
import { column, formatDefaultValue, DEFAULT_ALIGNMENT, DEFAULT_OPERATORS } from '@rsdata/core'
import type { ColumnType } from '@rsdata/core'

describe('column() — factory de definicao de coluna', () => {
  it('deve criar coluna com tipo texto por padrao', () => {
    const c = column('nome', {})
    expect(c.key).toBe('nome')
    expect(c.type).toBe('text')
    expect(c.label).toBe('nome')
  })

  it('deve usar label customizado', () => {
    const c = column('nome', { label: 'Nome Completo' })
    expect(c.label).toBe('Nome Completo')
  })

  it('deve marcar tipo acao como nao-filtravel por padrao', () => {
    const c = column('acoes', { type: 'action' })
    expect(c.filterable).toBe(false)
  })

  it('deve aceitar todas as opcoes de configuracao', () => {
    const c = column('preco', {
      type: 'number',
      label: 'Preco',
      mask: 'R$ #.##0,00',
      alignment: 'right',
      filterOperators: ['=', '>'],
      defaultOperator: '>',
      exportAsFormatted: true,
    })

    expect(c.type).toBe('number')
    expect(c.mask).toBe('R$ #.##0,00')
    expect(c.alignment).toBe('right')
    expect(c.filterOperators).toEqual(['=', '>'])
    expect(c.defaultOperator).toBe('>')
    expect(c.exportAsFormatted).toBe(true)
  })

  it('deve aceitar opcoes para tipo selecao', () => {
    const c = column('status', {
      type: 'select',
      options: { 1: 'Ativo', 2: 'Inativo' },
    })
    expect(c.options).toEqual({ 1: 'Ativo', 2: 'Inativo' })
  })

  it('deve aceitar funcao transform', () => {
    const fn = (v: unknown) => String(v).toUpperCase()
    const c = column('nome', { transform: fn })
    expect(c.transform).toBe(fn)
  })
})

describe('formatDefaultValue()', () => {
  it('deve retornar string vazia para null/undefined', () => {
    const c = column('nome', { type: 'text' })
    expect(formatDefaultValue(null, c, 'pt-BR')).toBe('')
    expect(formatDefaultValue(undefined, c, 'pt-BR')).toBe('')
  })

  it('deve formatar booleano como Sim/Nao', () => {
    const c = column('ativo', { type: 'boolean' })
    expect(formatDefaultValue(true, c, 'pt-BR')).toBe('Yes')
    expect(formatDefaultValue(false, c, 'pt-BR')).toBe('No')
  })

  it('deve formatar numero como string (pt-BR)', () => {
    const c = column('preco', { type: 'number' })
    expect(formatDefaultValue(100, c, 'pt-BR')).toBe('100')
    expect(formatDefaultValue(5.99, c, 'pt-BR')).toBe('5,99')
  })

  it('deve aplicar mascara R$ em coluna numero (pt-BR)', () => {
    const c = column('preco', { type: 'number', mask: 'R$ #.##0,00' })
    const formatted = formatDefaultValue(100, c, 'pt-BR')
    expect(formatted).toContain('R$')
    expect(formatted).toContain('100')
  })

  it('deve aplicar mascara de numero sem currency (pt-BR)', () => {
    const c = column('quantidade', { type: 'number', mask: '#.##0' })
    const formatted = formatDefaultValue(1500, c, 'pt-BR')
    expect(formatted).toContain('1.500')
  })

  it('deve formatar selecao usando opcoes', () => {
    const c = column('status', {
      type: 'select',
      options: { 1: 'Ativo', 2: 'Inativo' },
    })
    expect(formatDefaultValue(1, c, 'pt-BR')).toBe('Ativo')
    expect(formatDefaultValue(2, c, 'pt-BR')).toBe('Inativo')
  })

  it('deve retornar o proprio valor se nao estiver nas opcoes de selecao', () => {
    const c = column('status', {
      type: 'select',
      options: { 1: 'Ativo' },
    })
    expect(formatDefaultValue(999, c, 'pt-BR')).toBe('999')
  })

  it('deve formatar data com locale pt-BR', () => {
    const c = column('criadoEm', { type: 'date' })
    const date = new Date(2024, 0, 15)
    const formatted = formatDefaultValue(date, c, 'pt-BR')
    expect(formatted).toBe('15/01/2024')
  })

  it('deve formatar data-hora com locale pt-BR', () => {
    const c = column('atualizadoEm', { type: 'datetime' })
    const date = new Date(2024, 0, 15, 14, 30, 0)
    const formatted = formatDefaultValue(date, c, 'pt-BR')
    expect(formatted).toContain('15/01/2024')
    expect(formatted).toContain('14:30')
  })

  it('deve retornar string vazia para tipo acao', () => {
    const c = column('acoes', { type: 'action' })
    expect(formatDefaultValue('qualquer', c, 'pt-BR')).toBe('')
  })

  it('deve formatar texto como string', () => {
    const c = column('nome', { type: 'text' })
    expect(formatDefaultValue('Coca-Cola', c, 'pt-BR')).toBe('Coca-Cola')
  })
})

describe('formatDefaultValue() — locale support', () => {
  it('formats number in pt-BR (default)', () => {
    const c = column('preco', { type: 'number' })
    expect(formatDefaultValue(1500.5, c, 'pt-BR')).toBe('1.500,5')
  })

  it('formats number in en-US', () => {
    const c = column('preco', { type: 'number' })
    expect(formatDefaultValue(1500.5, c, 'en-US')).toBe('1,500.5')
  })

  it('formats number in de-DE', () => {
    const c = column('preco', { type: 'number' })
    expect(formatDefaultValue(1500.5, c, 'de-DE')).toBe('1.500,5')
  })

  it('formats currency in pt-BR with R$ mask', () => {
    const c = column('preco', { type: 'number', mask: 'R$ #.##0,00' })
    const formatted = formatDefaultValue(1500.5, c, 'pt-BR')
    expect(formatted).toContain('R$')
    expect(formatted).toContain('1.500,50')
  })

  it('formats currency in en-US with USD', () => {
    const c = column('preco', { type: 'number', mask: '$ #,##0.00', currency: 'USD' })
    const formatted = formatDefaultValue(1500.5, c, 'en-US')
    expect(formatted).toContain('$1,500.50')
  })

  it('formats currency in de-DE with EUR', () => {
    const c = column('preco', { type: 'number', mask: '#.##0,00 €', currency: 'EUR' })
    const formatted = formatDefaultValue(1500.5, c, 'de-DE')
    expect(formatted).toContain('1.500,50')
    expect(formatted).toContain('€')
  })

  it('formats date in pt-BR', () => {
    const c = column('data', { type: 'date' })
    const date = new Date(2024, 11, 25)
    expect(formatDefaultValue(date, c, 'pt-BR')).toBe('25/12/2024')
  })

  it('formats date in en-US', () => {
    const c = column('data', { type: 'date' })
    const date = new Date(2024, 11, 25)
    expect(formatDefaultValue(date, c, 'en-US')).toBe('12/25/2024')
  })

  it('formats date in de-DE', () => {
    const c = column('data', { type: 'date' })
    const date = new Date(2024, 11, 25)
    expect(formatDefaultValue(date, c, 'de-DE')).toBe('25.12.2024')
  })

  it('formats datetime in pt-BR', () => {
    const c = column('criadoEm', { type: 'datetime' })
    const date = new Date(2024, 0, 15, 14, 30, 0)
    const formatted = formatDefaultValue(date, c, 'pt-BR')
    expect(formatted).toContain('15/01/2024')
    expect(formatted).toContain('14:30')
  })

  it('column locale override > table locale', () => {
    const c = column('preco', { type: 'number', locale: 'en-US' })
    const formatted = formatDefaultValue(1500.5, c, c.locale!)
    expect(formatted).toBe('1,500.5')
  })

  it('column currency override is used', () => {
    const c = column('preco', { type: 'number', mask: 'R$ #,##0.00', currency: 'USD', locale: 'en-US' })
    const formatted = formatDefaultValue(100, c, 'en-US')
    expect(formatted).toContain('$100.00')
  })

  it('column with locale but no mask formats decimal correctly', () => {
    const c = column('preco', { type: 'number', locale: 'de-DE' })
    expect(formatDefaultValue(1000.5, c, 'de-DE')).toBe('1.000,5')
  })
})

describe('DEFAULT_ALIGNMENT', () => {
  it('texto deve alinhar a esquerda', () => {
    expect(DEFAULT_ALIGNMENT.text).toBe('left')
  })

  it('numero deve alinhar a direita', () => {
    expect(DEFAULT_ALIGNMENT.number).toBe('right')
  })

  it('data/data-hora devem alinhar ao centro', () => {
    expect(DEFAULT_ALIGNMENT.date).toBe('center')
    expect(DEFAULT_ALIGNMENT['datetime']).toBe('center')
  })

  it('booleano deve alinhar ao centro', () => {
    expect(DEFAULT_ALIGNMENT.boolean).toBe('center')
  })

  it('acao deve alinhar ao centro', () => {
    expect(DEFAULT_ALIGNMENT.action).toBe('center')
  })
})

describe('DEFAULT_OPERATORS', () => {
  it('texto deve ter contem, igual, comeca_com, termina_com', () => {
    expect(DEFAULT_OPERATORS.text).toEqual(['contains', 'equals', 'startsWith', 'endsWith'])
  })

  it('numero deve ter =, >, <, >=, <=, entre', () => {
    expect(DEFAULT_OPERATORS.number).toEqual(['=', '>', '<', '>=', '<=', 'between'])
  })

  it('data/data-hora devem ter entre, antes, depois, igual', () => {
    expect(DEFAULT_OPERATORS.date).toEqual(['between', 'before', 'after', 'equals'])
    expect(DEFAULT_OPERATORS['datetime']).toEqual(['between', 'before', 'after', 'equals'])
  })

  it('booleano deve ter apenas igual', () => {
    expect(DEFAULT_OPERATORS.boolean).toEqual(['equals'])
  })

  it('selecao deve ter apenas igual', () => {
    expect(DEFAULT_OPERATORS.select).toEqual(['equals'])
  })

  it('acao nao deve ter operadores', () => {
    expect(DEFAULT_OPERATORS.action).toEqual([])
  })
})
