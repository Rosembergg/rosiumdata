// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { RsTable, LocalAdapter, column } from '@rosiumdata/core'
import type { DataAdapter, Row } from '@rosiumdata/core'
import {
  rosiumdataTable,
  RsThead,
  RsTbody,
  RsPagination,
  RsFilters,
  useRsTable,
  rosiumdata,
} from '@rosiumdata/nuxt'
import { visiblePages } from '../src/components/RsPagination'
import { convertOptionKey, FILTER_DEBOUNCE_MS } from '../src/components/RsFilters'
import { createApp, defineComponent, h } from 'vue'

const DADOS: Row[] = [
  { id: 1, nome: 'Coca-Cola', preco: 5.99, ativo: true, status: 1 },
  { id: 2, nome: 'Guarana', preco: 4.5, ativo: true, status: 1 },
  { id: 3, nome: 'Agua', preco: 2.0, ativo: false, status: 2 },
  { id: 4, nome: 'Suco', preco: 7.25, ativo: true, status: 1 },
  { id: 5, nome: 'Cerveja', preco: 8.9, ativo: false, status: 2 },
]

function criarColunas() {
  return [
    column('id', { type: 'number' }),
    column('nome', { type: 'text', label: 'Nome' }),
    column('preco', { type: 'number', label: 'Preço', mask: 'R$ #.##0,00' }),
    column('ativo', { type: 'boolean', label: 'Ativo' }),
    column('status', { type: 'select', label: 'Status', options: { 1: 'Ativo', 2: 'Inativo' } }),
  ]
}

function montarTabela(dados: Row[] = DADOS, pageSize = 2) {
  const table = new RsTable({ columns: criarColunas(), pageSize })
  table.useAdapter(new LocalAdapter(dados))
  const wrapper = mount(rosiumdataTable, { props: { table } })
  return { table, wrapper }
}

function aguardarDebounce(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FILTER_DEBOUNCE_MS + 20))
}

describe('<RsTable> — renderização', () => {
  it('renderiza estrutura semântica: table, thead, tbody', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    expect(wrapper.find('table.rs-table').exists()).toBe(true)
    expect(wrapper.find('thead.rs-thead').exists()).toBe(true)
    expect(wrapper.find('tbody.rs-tbody').exists()).toBe(true)
    expect(wrapper.find('.rs-pagination').exists()).toBe(true)
    expect(wrapper.find('.rs-filters').exists()).toBe(true)
  })

  it('renderiza os dados da primeira página após o mount', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    const linhas = wrapper.findAll('tbody tr')
    expect(linhas).toHaveLength(2)
    expect(linhas[0]!.text()).toContain('Coca-Cola')
    expect(linhas[1]!.text()).toContain('Guarana')
  })

  it('exibe o valor de display do Core, não o raw', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    const primeira = wrapper.findAll('tbody tr')[0]!
    expect(primeira.text()).toContain('R$')
    expect(primeira.text()).toContain('5,99')
    expect(primeira.text()).toContain('Yes')
    expect(primeira.text()).toContain('Ativo')
  })

  it('funciona no modo rápido (columns + adapter)', async () => {
    const wrapper = mount(rosiumdataTable, {
      props: {
        columns: criarColunas(),
        adapter: new LocalAdapter(DADOS),
        pageSize: 3,
      },
    })
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('lança erro explícito sem tabela nem columns+adapter', () => {
    expect(() => mount(rosiumdataTable)).toThrow(/table/)
  })

  it('respeita colunas escondidas', async () => {
    const table = new RsTable({ columns: criarColunas(), pageSize: 2 })
    table.useAdapter(new LocalAdapter(DADOS))
    table.hideColumn('id')
    const wrapper = mount(rosiumdataTable, { props: { table } })
    await flushPromises()

    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).not.toContain('id')
    expect(wrapper.findAll('tbody tr')[0]!.findAll('td')).toHaveLength(4)
  })
})

describe('<RsThead> — cabeçalho clicável', () => {
  it('clique ordena asc e o Core reordena os dados', async () => {
    const { wrapper } = montarTabela(DADOS, 10)
    await flushPromises()

    const thPreco = wrapper.findAll('th').find((th) => th.text().includes('Preço'))!
    await thPreco.trigger('click')
    await flushPromises()

    const primeiraLinha = wrapper.findAll('tbody tr')[0]!
    expect(primeiraLinha.text()).toContain('Agua')
    expect(thPreco.classes()).toContain('rs-sorted-asc')
    expect(thPreco.find('.rs-sort-indicator').text()).toContain('▴')
  })

  it('segundo clique inverte para desc', async () => {
    const { wrapper } = montarTabela(DADOS, 10)
    await flushPromises()

    const thPreco = wrapper.findAll('th').find((th) => th.text().includes('Preço'))!
    await thPreco.trigger('click')
    await flushPromises()
    await thPreco.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('tbody tr')[0]!.text()).toContain('Cerveja')
    expect(thPreco.classes()).toContain('rs-sorted-desc')
    expect(thPreco.find('.rs-sort-indicator').text()).toContain('▾')
  })

  it('coluna com sortable: false não ordena', async () => {
    const colunas = [
      column('id', { type: 'number' }),
      column('nome', { type: 'text', sortable: false }),
    ]
    const table = new RsTable({ columns: colunas, pageSize: 10 })
    table.useAdapter(new LocalAdapter(DADOS))
    const ctx = useRsTable(table)
    const wrapper = mount(RsThead, { props: { contexto: ctx } })

    const thNome = wrapper.findAll('th')[1]!
    expect(thNome.classes()).not.toContain('rs-sortable')
    await thNome.trigger('click')
    expect(ctx.sortState.value).toBeUndefined()
  })
})

describe('<RsTbody> — estados', () => {
  it('mostra "Nenhum registro" quando não há linhas', async () => {
    const { wrapper } = montarTabela([])
    await flushPromises()

    const vazio = wrapper.find('tr.rs-empty')
    expect(vazio.exists()).toBe(true)
    expect(vazio.text()).toContain('No records')
  })

  it('mostra "Carregando..." enquanto o fetch está pendente', async () => {
    let resolver!: (value: { rows: Row[]; total: number }) => void
    const adapterLento: DataAdapter = {
      fetch: () => new Promise((resolve) => { resolver = resolve }),
      fetchAll: async () => [],
    }
    const table = new RsTable({ columns: criarColunas(), pageSize: 2 })
    table.useAdapter(adapterLento)
    const wrapper = mount(rosiumdataTable, { props: { table } })
    await wrapper.vm.$nextTick()

    const loading = wrapper.find('tr.rs-loading')
    expect(loading.exists()).toBe(true)
    expect(loading.text()).toContain('Loading...')

    resolver({ rows: DADOS.slice(0, 2), total: 5 })
    await flushPromises()

    expect(wrapper.find('tr.rs-loading').exists()).toBe(false)
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })
})

describe('<RsPagination> — navegação', () => {
  it('mostra resumo "Página X de Y — Total: N registros"', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    expect(wrapper.find('.rs-pagination-info').text()).toBe(
      'Page 1 of 3 — Total: 5 records',
    )
  })

  it('Anterior desabilitado na página 1, Próximo desabilitado na última', async () => {
    const { wrapper, table } = montarTabela()
    await flushPromises()

    expect(wrapper.find('.rs-page-prev').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.rs-page-next').attributes('disabled')).toBeUndefined()

    await table.goToPage(3)
    await flushPromises()

    expect(wrapper.find('.rs-page-prev').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.rs-page-next').attributes('disabled')).toBeDefined()
  })

  it('clique em Próximo navega para a página seguinte', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    await wrapper.find('.rs-page-next').trigger('click')
    await flushPromises()

    expect(wrapper.find('.rs-pagination-info').text()).toContain('Page 2 of 3')
    expect(wrapper.findAll('tbody tr')[0]!.text()).toContain('Agua')
  })

  it('clique em número de página navega direto', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    const botao3 = wrapper
      .findAll('.rs-page-number')
      .find((b) => b.text() === '3')!
    await botao3.trigger('click')
    await flushPromises()

    expect(wrapper.find('.rs-pagination-info').text()).toContain('Page 3 of 3')
    expect(wrapper.findAll('tbody tr')[0]!.text()).toContain('Cerveja')
  })

  it('paginasVisiveis renderiza todas com poucas páginas e resume com muitas', () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3])
    expect(visiblePages(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(visiblePages(5, 20)).toEqual([1, '...', 4, 5, 6, '...', 20])
    expect(visiblePages(1, 20)).toEqual([1, 2, '...', 20])
    expect(visiblePages(20, 20)).toEqual([1, '...', 19, 20])
  })
})

describe('<RsFilters> — filtros por tipo', () => {
  it('renderiza o campo certo para cada tipo de coluna', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    const filtros = wrapper.find('.rs-filters')
    expect(filtros.find('.rs-filter-text input[type="text"]').exists()).toBe(true)
    expect(filtros.findAll('.rs-filter-number input[type="number"]').length).toBe(4)
    expect(filtros.find('.rs-filter-select select').exists()).toBe(true)
    expect(filtros.find('.rs-filter-boolean select').exists()).toBe(true)
  })

  it('não renderiza filtro para coluna filterable: false', async () => {
    const colunas = [
      column('id', { type: 'number', filterable: false }),
      column('nome', { type: 'text' }),
    ]
    const table = new RsTable({ columns: colunas, pageSize: 10 })
    table.useAdapter(new LocalAdapter(DADOS))
    const ctx = useRsTable(table)
    const wrapper = mount(RsFilters, { props: { contexto: ctx } })

    expect(wrapper.findAll('.rs-filter')).toHaveLength(1)
    expect(wrapper.find('.rs-filter-label').text()).toBe('nome')
  })

  it('input de texto dispara filtrar() com operador padrão (após debounce)', async () => {
    const { wrapper, table } = montarTabela(DADOS, 10)
    await flushPromises()

    const input = wrapper.find('.rs-filter-text input')
    await input.setValue('co')

    expect(table.getState().filters).toEqual([])

    await aguardarDebounce()
    await flushPromises()

    const linhas = wrapper.findAll('tbody tr')
    expect(linhas).toHaveLength(2)
    expect(wrapper.find('.rs-pagination-info').text()).toContain('Total: 2 records')
  })

  it('limpar o input de texto remove o filtro', async () => {
    const { wrapper } = montarTabela(DADOS, 10)
    await flushPromises()

    const input = wrapper.find('.rs-filter-text input')
    await input.setValue('co')
    await aguardarDebounce()
    await flushPromises()
    await input.setValue('')
    await aguardarDebounce()
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
  })

  it('inputs de número filtram por intervalo (entre)', async () => {
    const { wrapper, table } = montarTabela(DADOS, 10)
    await flushPromises()

    const campos = wrapper.findAll('.rs-filter-number')
    const filtroPreco = campos.find((c) => c.text().includes('Preço'))!
    await filtroPreco.find('.rs-filter-min').setValue('4')
    await filtroPreco.find('.rs-filter-max').setValue('6')
    await aguardarDebounce()
    await flushPromises()

    expect(table.getState().filters).toEqual([
      { column: 'preco', operator: 'between', value: [4, 6] },
    ])
    const nomes = wrapper.findAll('tbody tr').map((tr) => tr.text())
    expect(nomes.some((n) => n.includes('Coca-Cola'))).toBe(true)
    expect(nomes.some((n) => n.includes('Guarana'))).toBe(true)
    expect(nomes).toHaveLength(2)
  })

  it('apenas mínimo usa operador >=', async () => {
    const { wrapper, table } = montarTabela(DADOS, 10)
    await flushPromises()

    const filtroPreco = wrapper
      .findAll('.rs-filter-number')
      .find((c) => c.text().includes('Preço'))!
    await filtroPreco.find('.rs-filter-min').setValue('7')
    await aguardarDebounce()
    await flushPromises()

    expect(table.getState().filters).toEqual([
      { column: 'preco', operator: '>=', value: 7 },
    ])
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })

  it('select de seleção filtra pelo valor da opção', async () => {
    const { wrapper } = montarTabela(DADOS, 10)
    await flushPromises()

    const select = wrapper.find('.rs-filter-select select')
    await select.setValue('2')
    await flushPromises()

    const linhas = wrapper.findAll('tbody tr')
    expect(linhas).toHaveLength(2)
    expect(linhas[0]!.text()).toContain('Agua')
    expect(linhas[1]!.text()).toContain('Cerveja')
  })

  it('select booleano filtra Sim/Não', async () => {
    const { wrapper } = montarTabela(DADOS, 10)
    await flushPromises()

    const select = wrapper.find('.rs-filter-boolean select')
    await select.setValue('false')
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(2)

    await select.setValue('')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
  })

  it('converterChaveOpcao converte chave numérica e preserva texto', () => {
    expect(convertOptionKey('1')).toBe(1)
    expect(convertOptionKey('2.5')).toBe(2.5)
    expect(convertOptionKey('ativo')).toBe('ativo')
  })

  it('debounce agrupa digitação rápida em uma única chamada de fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ rows: [], total: 0 })
    const table = new RsTable({ columns: criarColunas(), pageSize: 10 })
    table.useAdapter({ fetch: fetchMock, fetchAll: async () => [] })
    const ctx = useRsTable(table)
    const wrapper = mount(RsFilters, { props: { contexto: ctx } })

    const input = wrapper.find('.rs-filter-text input')
    await input.setValue('c')
    await input.setValue('co')
    await input.setValue('coc')

    expect(fetchMock).not.toHaveBeenCalled()

    await aguardarDebounce()
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ column: 'nome', operator: 'contains', value: 'coc' }],
      }),
    )
  })

  it('unmount cancela debounce pendente', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ rows: [], total: 0 })
    const table = new RsTable({ columns: criarColunas(), pageSize: 10 })
    table.useAdapter({ fetch: fetchMock, fetchAll: async () => [] })
    const ctx = useRsTable(table)
    const wrapper = mount(RsFilters, { props: { contexto: ctx } })

    await wrapper.find('.rs-filter-text input').setValue('co')
    wrapper.unmount()

    await aguardarDebounce()
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('Integração — fluxo completo (filtro + ordenação + paginação)', () => {
  it('opera o fluxo inteiro via interface', async () => {
    const { wrapper } = montarTabela(DADOS, 2)
    await flushPromises()

    const inputNome = wrapper.find('.rs-filter-text input')
    await inputNome.setValue('a')
    await aguardarDebounce()
    await flushPromises()
    expect(wrapper.find('.rs-pagination-info').text()).toContain('Total: 4 records')

    const thPreco = wrapper.findAll('th').find((th) => th.text().includes('Preço'))!
    await thPreco.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('tbody tr')[0]!.text()).toContain('Agua')

    await wrapper.find('.rs-page-next').trigger('click')
    await flushPromises()
    expect(wrapper.find('.rs-pagination-info').text()).toContain('Page 2 of 2')
    const linhas = wrapper.findAll('tbody tr')
    expect(linhas[0]!.text()).toContain('Coca-Cola')
    expect(linhas[1]!.text()).toContain('Cerveja')
  })

  it('unmount desconecta os listeners do Core', async () => {
    const { wrapper, table } = montarTabela()
    await flushPromises()

    const handler = vi.fn()
    table.on('data:loaded', handler)
    wrapper.unmount()

    await table.goToPage(2)
    expect(handler).toHaveBeenCalled()
  })
})

describe('Plugin rosiumdata', () => {
  it('registra os componentes globalmente via app.use()', () => {
    const app = createApp(defineComponent({ render: () => h('div') }))
    app.use(rosiumdata)

    expect(app.component('RsTable')).toBeTruthy()
    expect(app.component('RsThead')).toBeTruthy()
    expect(app.component('RsTbody')).toBeTruthy()
    expect(app.component('RsPagination')).toBeTruthy()
    expect(app.component('RsFilters')).toBeTruthy()
  })
})

describe('Toolbar — filtros expansíveis', () => {
  it('painel de filtros começa fechado e abre ao clicar em Filtros', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    const painel = wrapper.find('.rs-filters-panel')
    expect(painel.exists()).toBe(true)
    expect(painel.classes()).not.toContain('rs-filters-open')

    const botao = wrapper.findAll('.rs-btn').find((b) => b.text().includes('Filters'))!
    await botao.trigger('click')
    expect(painel.classes()).toContain('rs-filters-open')

    await botao.trigger('click')
    expect(painel.classes()).not.toContain('rs-filters-open')
  })

  it('badge de contagem mostra o número de filtros ativos', async () => {
    const { wrapper, table } = montarTabela(DADOS, 10)
    await flushPromises()

    expect(wrapper.find('.rs-badge-count').exists()).toBe(false)

    await table.filter({ column: 'nome', operator: 'contains', value: 'co' })
    await flushPromises()

    expect(wrapper.find('.rs-badge-count').text()).toBe('1')
  })
})

describe('Toolbar — menu de colunas', () => {
  it('abre o menu e esconde/mostra coluna via checkbox', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    const botao = wrapper.findAll('.rs-btn').find((b) => b.text().includes('Columns'))!
    await botao.trigger('click')

    const itens = wrapper.findAll('.rs-menu-item')
    expect(itens).toHaveLength(5)

    const checkId = itens[0]!.find('input')
    await checkId.trigger('change')

    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).not.toContain('id')

    await checkId.trigger('change')
    expect(wrapper.findAll('th').map((th) => th.text())).toContain('id')
  })

  it('clique fora fecha o menu de colunas', async () => {
    const table = new RsTable({ columns: criarColunas(), pageSize: 2 })
    table.useAdapter(new LocalAdapter(DADOS))
    const wrapper = mount(rosiumdataTable, { props: { table }, attachTo: document.body })
    await flushPromises()

    const botao = wrapper.findAll('.rs-btn').find((b) => b.text().includes('Columns'))!
    await botao.trigger('click')
    expect(wrapper.find('.rs-menu').exists()).toBe(true)

    document.body.click()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.rs-menu').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('Toolbar — densidade', () => {
  it('alterna entre confortável e compacta', async () => {
    const { wrapper } = montarTabela()
    await flushPromises()

    expect(wrapper.find('.rs-table-container').classes()).not.toContain('rs-density-compact')

    const botao = wrapper.findAll('.rs-btn').find((b) => b.text().includes('Density'))!
    await botao.trigger('click')
    expect(wrapper.find('.rs-table-container').classes()).toContain('rs-density-compact')

    await botao.trigger('click')
    expect(wrapper.find('.rs-table-container').classes()).not.toContain('rs-density-compact')
  })
})

describe('Badges — colunas de seleção', () => {
  it('renderiza badge com o display do Core (sem transformar o valor)', async () => {
    const { wrapper } = montarTabela(DADOS, 10)
    await flushPromises()

    const badges = wrapper.findAll('.rs-badge')
    expect(badges.length).toBeGreaterThan(0)
    expect(badges[0]!.text()).toBe('Ativo')
    expect(badges[0]!.attributes('data-rs-badge')).toBe('Ativo')
  })

  it('colunas não-seleção continuam texto puro', async () => {
    const { wrapper } = montarTabela(DADOS, 10)
    await flushPromises()

    const primeira = wrapper.findAll('tbody tr')[0]!
    const celulaNome = primeira.findAll('td')[1]!
    expect(celulaNome.find('.rs-badge').exists()).toBe(false)
    expect(celulaNome.text()).toBe('Coca-Cola')
  })
})

describe('Skeleton loading', () => {
  it('renderiza linhas skeleton durante o fetch', async () => {
    let resolver!: (value: { rows: Row[]; total: number }) => void
    const adapterLento: DataAdapter = {
      fetch: () => new Promise((resolve) => { resolver = resolve }),
      fetchAll: async () => [],
    }
    const table = new RsTable({ columns: criarColunas(), pageSize: 2 })
    table.useAdapter(adapterLento)
    const wrapper = mount(rosiumdataTable, { props: { table } })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.rs-skeleton').length).toBeGreaterThan(0)
    expect(wrapper.findAll('tr.rs-loading').length).toBeGreaterThanOrEqual(3)

    resolver({ rows: DADOS.slice(0, 2), total: 5 })
    await flushPromises()

    expect(wrapper.findAll('.rs-skeleton')).toHaveLength(0)
  })
})

describe('Empty state', () => {
  it('mostra título e descrição', async () => {
    const { wrapper } = montarTabela([])
    await flushPromises()

    const vazio = wrapper.find('tr.rs-empty')
    expect(vazio.find('.rs-empty-title').text()).toBe('No records found')
    expect(vazio.find('.rs-empty-desc').text()).toBe(
      'Try adjusting filters or clearing search.',
    )
    expect(vazio.find('.rs-empty-icon').exists()).toBe(true)
  })
})
