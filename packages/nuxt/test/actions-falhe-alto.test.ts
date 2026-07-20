// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { RsTable, LocalAdapter, column } from '@rosiumdata/core'
import type { Row } from '@rosiumdata/core'
import {
  rosiumdataTable,
  RsTbody,
  RsActions,
  useRsTable,
  actionColumn,
  columnActions,
  errorMessage,
  readPreferences,
} from '@rosiumdata/nuxt'
import type { ActionDefinition, RsActionEvent } from '@rosiumdata/nuxt'

const DADOS: Row[] = [
  { id: 1, nome: 'Coca-Cola', preco: 5.99, status: 1 },
  { id: 2, nome: 'Guarana', preco: 4.5, status: 1 },
  { id: 3, nome: 'Agua', preco: 2.0, status: 2 },
]

const ACAO_UNICA: ActionDefinition[] = [{ key: 'editar', label: 'Editar' }]

const TRES_ACOES: ActionDefinition[] = [
  { key: 'ver', label: 'Ver detalhes' },
  { key: 'editar', label: 'Editar' },
  { key: 'excluir', label: 'Excluir', danger: true },
]

function criarColunas(actions: ActionDefinition[] = ACAO_UNICA) {
  return [
    column('id', { type: 'number' }),
    column('nome', { type: 'text', label: 'Nome' }),
    column('preco', { type: 'number', label: 'Preço', mask: 'R$ #.##0,00' }),
    actionColumn('actions', { label: 'Ações', actions }),
  ]
}

function montarTabela(opcoes: {
  dados?: Row[]
  actions?: ActionDefinition[]
  debug?: boolean
  attach?: boolean
} = {}) {
  const table = new RsTable({ columns: criarColunas(opcoes.actions), pageSize: 10 })
  table.useAdapter(new LocalAdapter(opcoes.dados ?? DADOS))
  const wrapper = mount(rosiumdataTable, {
    props: { table, debug: opcoes.debug },
    ...(opcoes.attach ? { attachTo: document.body } : {}),
  })
  return { table, wrapper }
}

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
})

describe('actionColumn() e columnActions()', () => {
  it('actionColumn cria coluna tipo action com actions em options.actions', () => {
    const col = actionColumn('actions', { label: 'Ações', actions: TRES_ACOES })
    expect(col.type).toBe('action')
    expect(col.label).toBe('Ações')
    expect(col.filterable).toBe(false)
    expect(columnActions(col)).toEqual(TRES_ACOES)
  })

  it('columnActions retorna [] para coluna sem actions', () => {
    expect(columnActions(column('nome', { type: 'text' }))).toEqual([])
    expect(columnActions(column('actions', { type: 'action' }))).toEqual([])
  })
})

describe('Actions — ação única (botão direto)', () => {
  it('renderiza um botão por linha na coluna acao', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    const botoes = wrapper.findAll('.rs-action-btn')
    expect(botoes).toHaveLength(3)
    expect(botoes[0]!.text()).toBe('Editar')
    expect(wrapper.find('.rs-action-more').exists()).toBe(false)
  })

  it('clique emite o evento action com { key, row } — e NÃO executa nada', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    await wrapper.findAll('.rs-action-btn')[1]!.trigger('click')

    const emitidos = wrapper.emitted('action')
    expect(emitidos).toHaveLength(1)
    const payload = emitidos![0]![0] as RsActionEvent
    expect(payload.key).toBe('editar')
    expect(payload.row.id!.raw).toBe(2)
    expect(payload.row.nome!.raw).toBe('Guarana')
  })

  it('useRsTable propaga o evento via contexto.on("action")', async () => {
    const table = new RsTable({ columns: criarColunas(), pageSize: 10 })
    table.useAdapter(new LocalAdapter(DADOS))
    const ctx = useRsTable(table)
    await ctx.load()

    const handler = vi.fn()
    ctx.on('action', handler)

    const wrapper = mount(RsTbody, { props: { contexto: ctx } })
    await wrapper.findAll('.rs-action-btn')[0]!.trigger('click')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'editar' }),
    )

    ctx.off('action', handler)
    await wrapper.findAll('.rs-action-btn')[0]!.trigger('click')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ação danger única ganha destaque visual', async () => {
    const { wrapper } = montarTabela({
      actions: [{ key: 'excluir', label: 'Excluir', danger: true }],
    })
    await flushPromises()

    expect(wrapper.findAll('.rs-action-btn')[0]!.classes()).toContain('rs-action-btn--danger')
  })
})

describe('Actions — múltiplas ações (menu ⋯)', () => {
  it('com 2+ actions renderiza o botão ⋯ em vez de botões diretos', async () => {
    const { wrapper } = montarTabela({ actions: TRES_ACOES, attach: true })
    await flushPromises()

    const mais = wrapper.findAll('.rs-action-more')
    expect(mais).toHaveLength(3)
    expect(mais[0]!.text()).toBe('⋯')
    wrapper.unmount()
  })

  it('clique no ⋯ abre o dropdown no body com todos os itens', async () => {
    const { wrapper } = montarTabela({ actions: TRES_ACOES, attach: true })
    await flushPromises()

    expect(document.body.querySelector('.rs-action-menu')).toBeNull()

    await wrapper.find('.rs-action-more').trigger('click')

    const menu = document.body.querySelector('.rs-action-menu')
    expect(menu).not.toBeNull()
    const itens = menu!.querySelectorAll('.rs-menu-action')
    expect(itens).toHaveLength(3)
    expect(itens[0]!.textContent).toBe('Ver detalhes')
    wrapper.unmount()
  })

  it('ação danger no dropdown ganha classe rs-menu-item--danger', async () => {
    const { wrapper } = montarTabela({ actions: TRES_ACOES, attach: true })
    await flushPromises()

    await wrapper.find('.rs-action-more').trigger('click')

    const itens = document.body.querySelectorAll('.rs-menu-action')
    expect(itens[2]!.classList.contains('rs-menu-item--danger')).toBe(true)
    expect(itens[0]!.classList.contains('rs-menu-item--danger')).toBe(false)
    wrapper.unmount()
  })

  it('clique em um item emite action e fecha o menu', async () => {
    const { wrapper } = montarTabela({ actions: TRES_ACOES, attach: true })
    await flushPromises()

    await wrapper.find('.rs-action-more').trigger('click')
    const item = document.body.querySelectorAll('.rs-menu-action')[2] as HTMLElement
    item.click()
    await wrapper.vm.$nextTick()

    const emitidos = wrapper.emitted('action')
    expect(emitidos).toHaveLength(1)
    const payload = emitidos![0]![0] as RsActionEvent
    expect(payload.key).toBe('excluir')
    expect(payload.row.id!.raw).toBe(1)
    expect(document.body.querySelector('.rs-action-menu')).toBeNull()
    wrapper.unmount()
  })

  it('clique fora fecha o dropdown', async () => {
    const { wrapper } = montarTabela({ actions: TRES_ACOES, attach: true })
    await flushPromises()

    await wrapper.find('.rs-action-more').trigger('click')
    expect(document.body.querySelector('.rs-action-menu')).not.toBeNull()

    document.body.click()
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('.rs-action-menu')).toBeNull()
    expect(wrapper.emitted('action')).toBeUndefined()
    wrapper.unmount()
  })

  it('tecla Escape fecha o dropdown', async () => {
    const { wrapper } = montarTabela({ actions: TRES_ACOES, attach: true })
    await flushPromises()

    await wrapper.find('.rs-action-more').trigger('click')
    expect(document.body.querySelector('.rs-action-menu')).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(document.body.querySelector('.rs-action-menu')).toBeNull()
    wrapper.unmount()
  })

  it('unmount remove o dropdown e os listeners', async () => {
    const { wrapper } = montarTabela({ actions: TRES_ACOES, attach: true })
    await flushPromises()

    await wrapper.find('.rs-action-more').trigger('click')
    wrapper.unmount()

    expect(document.body.querySelector('.rs-action-menu')).toBeNull()
  })

  it('RsActions sem nenhuma action não renderiza nada', () => {
    const wrapper = mount(RsActions, {
      props: { actions: [], row: {} },
    })
    expect(wrapper.find('button').exists()).toBe(false)
  })
})

describe('Falhe Alto — modo dev (debug: true)', () => {
  const DADOS_RUINS: Row[] = [
    { id: 1, nome: 123, preco: 5.99, status: 1 },
    { id: 2, nome: 'Guarana', preco: 4.5, status: 1 },
  ]

  it('célula com erro ganha .rs-cell--error e .rs-cell--error-debug', async () => {
    const { wrapper } = montarTabela({ dados: DADOS_RUINS, debug: true })
    await flushPromises()

    const celulasComErro = wrapper.findAll('.rs-cell--error')
    expect(celulasComErro).toHaveLength(1)
    expect(celulasComErro[0]!.classes()).toContain('rs-cell--error-debug')
  })

  it('célula com erro expõe a localização exata via data-rs-error (tooltip)', async () => {
    const { wrapper } = montarTabela({ dados: DADOS_RUINS, debug: true })
    await flushPromises()

    const celula = wrapper.find('.rs-cell--error')
    expect(celula.attributes('data-rs-error')).toBe(
      'Column `nome`, row 0, expected `text`, received `123`',
    )
  })

  it('banner de erros grita a localização exata abaixo da toolbar', async () => {
    const { wrapper } = montarTabela({ dados: DADOS_RUINS, debug: true })
    await flushPromises()

    const banner = wrapper.find('.rs-error-banner')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('Fail Loud: 1 invalid data')
    expect(banner.text()).toContain('Column `nome`, row 0, expected `text`, received `123`')
  })

  it('sem erros, não há banner nem células marcadas', async () => {
    const { wrapper } = montarTabela({ debug: true })
    await flushPromises()

    expect(wrapper.find('.rs-error-banner').exists()).toBe(false)
    expect(wrapper.find('.rs-cell--error').exists()).toBe(false)
  })

  it('errorMessage formata erro de célula e erro geral (sem coluna/linha)', () => {
    expect(
      errorMessage({ column: 'preco', rowIndex: 42, expected: 'number', received: null }),
    ).toBe('Column `preco`, row 42, expected `number`, received `null`')
    expect(
      errorMessage({ column: '', rowIndex: -1, expected: 'adapter configured', received: 'no adapter' }),
    ).toBe('Expected `adapter configured`, received `"no adapter"`')
  })
})

describe('Falhe Alto — modo produção (debug: false)', () => {
  const DADOS_RUINS: Row[] = [
    { id: 1, nome: 123, preco: 5.99, status: 1 },
    { id: 2, nome: 'Guarana', preco: 4.5, status: 1 },
  ]

  it('célula com erro tem indicador sutil (⚠), sem detalhes internos', async () => {
    const { wrapper } = montarTabela({ dados: DADOS_RUINS, debug: false })
    await flushPromises()

    const celula = wrapper.find('.rs-cell--error')
    expect(celula.exists()).toBe(true)
    expect(celula.classes()).not.toContain('rs-cell--error-debug')
    expect(celula.attributes('data-rs-error')).toBeUndefined()
    expect(celula.find('.rs-cell-error-icon').text()).toBe('⚠')
  })

  it('não exibe banner e o resto da tabela continua funcionando', async () => {
    const { wrapper } = montarTabela({ dados: DADOS_RUINS, debug: false })
    await flushPromises()

    expect(wrapper.find('.rs-error-banner').exists()).toBe(false)

    const linhas = wrapper.findAll('tbody tr')
    expect(linhas).toHaveLength(2)
    expect(linhas[1]!.text()).toContain('Guarana')
    expect(wrapper.find('.rs-pagination-info').text()).toContain('Total: 2 records')
  })
})

describe('Falhe Alto + Action na mesma linha', () => {
  it('erro e botão de action convivem na mesma linha sem quebrar o layout', async () => {
    const dados: Row[] = [{ id: 1, nome: 123, preco: 5.99, status: 1 }]
    const { wrapper } = montarTabela({ dados, debug: true })
    await flushPromises()

    const linha = wrapper.find('tbody tr')
    const celulas = linha.findAll('td')
    expect(celulas).toHaveLength(4)

    const celulaErro = linha.find('.rs-cell--error')
    const celulaAcao = linha.find('.rs-cell-action')
    expect(celulaErro.exists()).toBe(true)
    expect(celulaAcao.exists()).toBe(true)
    expect(celulaErro.element).not.toBe(celulaAcao.element)
    expect(celulaAcao.classes()).not.toContain('rs-cell--error')
    expect(celulaErro.find('.rs-action-btn').exists()).toBe(false)

    await celulaAcao.find('.rs-action-btn').trigger('click')
    const payload = wrapper.emitted('action')![0]![0] as RsActionEvent
    expect(payload.key).toBe('editar')
    expect(payload.row.id!.raw).toBe(1)
  })
})

describe('Preferências persistentes (localStorage)', () => {
  it('salva colunas visíveis, ordem e pageSize ao alterar o estado', async () => {
    const table = new RsTable({ columns: criarColunas(), pageSize: 10 })
    table.useAdapter(new LocalAdapter(DADOS))
    const ctx = useRsTable(table, { persistence: 'produtos' })
    await ctx.load()

    ctx.hideColumn('id')

    const salvo = readPreferences('produtos')
    expect(salvo).not.toBeNull()
    expect(salvo!.visibleColumns).toEqual(['nome', 'preco', 'actions'])
    expect(salvo!.pageSize).toBe(10)
  })

  it('restaura colunas visíveis, ordem e pageSize ao montar', async () => {
    localStorage.setItem(
      'rosiumdata:produtos',
      JSON.stringify({ visibleColumns: ['preco', 'nome'], pageSize: 2 }),
    )

    const ctx = useRsTable(
      { columns: criarColunas(), adapter: new LocalAdapter(DADOS), pageSize: 10 },
      { persistence: 'produtos' },
    )
    await ctx.load()

    expect(ctx.columns.value.map((c) => c.key)).toEqual(['preco', 'nome'])
    expect(ctx.table.getState().pageSize).toBe(2)
    expect(ctx.rows.value).toHaveLength(2)
  })

  it('sem chave de persistência, nada é salvo (comportamento explícito)', async () => {
    const ctx = useRsTable({
      columns: criarColunas(),
      adapter: new LocalAdapter(DADOS),
      pageSize: 10,
    })
    await ctx.load()
    ctx.hideColumn('id')

    expect(localStorage.length).toBe(0)
  })

  it('preferências corrompidas ou de colunas inexistentes são ignoradas', async () => {
    localStorage.setItem('rosiumdata:quebrado', '{{{nao é json')
    expect(readPreferences('quebrado')).toBeNull()

    localStorage.setItem(
      'rosiumdata:fantasma',
      JSON.stringify({ visibleColumns: ['coluna_que_nao_existe'], pageSize: 5 }),
    )
    const ctx = useRsTable(
      { columns: criarColunas(), adapter: new LocalAdapter(DADOS), pageSize: 10 },
      { persistence: 'fantasma' },
    )
    await ctx.load()

    expect(ctx.columns.value.map((c) => c.key)).toEqual(['id', 'nome', 'preco', 'actions'])
  })

  it('<RsTable> com prop persistence: menu Colunas salva e outra montagem restaura', async () => {
    const wrapperA = mount(rosiumdataTable, {
      props: {
        columns: criarColunas(),
        adapter: new LocalAdapter(DADOS),
        pageSize: 10,
        persistence: 'tela-produtos',
      },
    })
    await flushPromises()

    const botao = wrapperA.findAll('.rs-btn').find((b) => b.text().includes('Columns'))!
    await botao.trigger('click')
    await wrapperA.findAll('.rs-menu-item')[0]!.find('input').trigger('change')

    expect(wrapperA.findAll('th').map((th) => th.text())).not.toContain('id')
    expect(readPreferences('tela-produtos')!.visibleColumns).not.toContain('id')
    wrapperA.unmount()

    const wrapperB = mount(rosiumdataTable, {
      props: {
        columns: criarColunas(),
        adapter: new LocalAdapter(DADOS),
        pageSize: 10,
        persistence: 'tela-produtos',
      },
    })
    await flushPromises()

    expect(wrapperB.findAll('th').map((th) => th.text())).not.toContain('id')
    wrapperB.unmount()
  })

  it('menu Colunas continua mostrando/escondendo colunas (checkboxes)', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    const botao = wrapper.findAll('.rs-btn').find((b) => b.text().includes('Columns'))!
    await botao.trigger('click')

    const itens = wrapper.findAll('.rs-menu-item')
    expect(itens).toHaveLength(4)

    await itens[1]!.find('input').trigger('change')
    expect(wrapper.findAll('th').map((th) => th.text())).not.toContain('Nome')

    await itens[1]!.find('input').trigger('change')
    expect(wrapper.findAll('th').map((th) => th.text())).toContain('Nome')
  })
})
