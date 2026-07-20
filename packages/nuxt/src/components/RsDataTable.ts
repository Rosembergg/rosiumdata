import { defineComponent, h, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { PropType, VNode } from 'vue'
import { useRsTable } from '../composables/useRsTable'
import type {
  ColumnDefinition,
  DataAdapter,
  RsActionEvent,
  RsTable as RsTableCore,
  UseRsTableContext,
} from '../composables/useRsTable'
import { RsThead } from './RsThead'
import { RsTbody, mensagemErro } from './RsTbody'
import { RsPagination } from './RsPagination'
import { RsFilters } from './RsFilters'

function icone(d: string): VNode {
  return h(
    'svg',
    {
      class: 'rs-icon',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    },
    [h('path', { d })],
  )
}

const ICONE_FILTRO = 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z'
const ICONE_COLUNAS = 'M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18'
const ICONE_DENSIDADE = 'M3 6h18M3 12h18M3 18h18'

/**
 * Detecta ambiente de desenvolvimento (Vite define import.meta.env.DEV).
 * Durante SSR, sempre retorna false para garantir HTML consistente entre
 * servidor e cliente (evita mismatch de hidratação).
 * Fora do Vite (Node puro, bundlers sem env), assume produção.
 */
export function ambienteDev(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env
    return env?.DEV === true
  } catch {
    return false
  }
}

/**
 * Componente principal da tabela. Chama-se RsDataTable para não colidir com a
 * classe RsTable do Core em imports. No template, o nome público registrado
 * pelo plugin continua sendo <RsTable>.
 */
export const RsDataTable = defineComponent({
  name: 'RsDataTable',
  props: {
    /** Instância RsTable do Core (modo controle total) */
    tabela: {
      type: Object as PropType<RsTableCore>,
      default: undefined,
    },
    /** Definição de colunas (modo rápido, junto com adapter) */
    columns: {
      type: Array as PropType<ColumnDefinition[]>,
      default: undefined,
    },
    /** Adapter de dados (modo rápido, junto com columns) */
    adapter: {
      type: Object as PropType<DataAdapter>,
      default: undefined,
    },
    /** Tamanho da página (modo rápido) */
    pageSize: {
      type: Number,
      default: undefined,
    },
    /**
     * Falhe Alto: true = modo dev (banner + tooltip com localização exata do
     * erro); false = modo produção (indicador sutil, sem expor internals).
     * Sem a prop, detecta import.meta.env.DEV.
     */
    debug: {
      type: Boolean,
      default: undefined,
    },
    /**
     * Chave de persistência de preferências (colunas visíveis, ordem,
     * pageSize) em localStorage. Sem a chave, nada é salvo nem restaurado.
     */
    persistencia: {
      type: String,
      default: undefined,
    },
  },
  emits: {
    /** Gatilho de action: { key, row }. A RSdata não executa nada. */
    action: (payload: RsActionEvent) => payload !== undefined,
  },
  setup(props, { emit }) {
    let contexto: UseRsTableContext

    if (props.tabela) {
      contexto = useRsTable(props.tabela, { persistencia: props.persistencia })
    } else if (props.columns && props.adapter) {
      contexto = useRsTable(
        {
          columns: props.columns,
          adapter: props.adapter,
          pageSize: props.pageSize,
        },
        { persistencia: props.persistencia },
      )
    } else {
      throw new Error(
        '[RSdata] <RsTable> precisa da prop "tabela" (instância RsTable) OU das props "columns" + "adapter".',
      )
    }

    /* Propaga o gatilho de action do Render para o consumidor Vue */
    contexto.on('action', (payload) => emit('action', payload))

    /**
     * Falhe Alto debug: sempre false durante SSR e hidratação inicial para
     * garantir HTML idêntico entre servidor e cliente. O valor real é
     * definido APÓS a montagem completa (onMounted + nextTick).
     */
    const debugEfetivo = ref(false)

    /* Estado de UI (sessão apenas — sem persistência, sem lógica de dado) */
    const filtrosAbertos = ref(false)
    const menuColunasAberto = ref(false)
    const densidadeCompacta = ref(false)
    const menuColunasEl = ref<HTMLElement | null>(null)

    function aoClicarFora(e: MouseEvent): void {
      if (menuColunasEl.value && !menuColunasEl.value.contains(e.target as Node)) {
        menuColunasAberto.value = false
      }
    }

    function aoTeclar(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        menuColunasAberto.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', aoClicarFora)
      document.addEventListener('keydown', aoTeclar)
      void contexto.carregar()
      /* Debug real: só após hidratação SSR — evita mismatch em data-rs-error */
      void nextTick(() => {
        debugEfetivo.value = props.debug ?? ambienteDev()
      })
    })

    onUnmounted(() => {
      document.removeEventListener('click', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    })

    function colunaVisivel(key: string): boolean {
      return contexto.colunas.value.some((c) => c.key === key)
    }

    function alternarColuna(key: string): void {
      if (colunaVisivel(key)) {
        contexto.esconderColuna(key)
      } else {
        contexto.mostrarColuna(key)
      }
    }

    function botaoFiltros(): VNode {
      const ativos = contexto.filtros.value.length
      return h(
        'button',
        {
          type: 'button',
          class: ['rs-btn', { 'rs-btn-active': filtrosAbertos.value }],
          'aria-expanded': String(filtrosAbertos.value),
          onClick: () => {
            filtrosAbertos.value = !filtrosAbertos.value
          },
        },
        [
          icone(ICONE_FILTRO),
          h('span', { class: 'rs-btn-label' }, 'Filtros'),
          ativos > 0 ? h('span', { class: 'rs-badge-count' }, String(ativos)) : null,
        ],
      )
    }

    function menuColunas(): VNode {
      return h(
        'div',
        { class: 'rs-toolbar-menu', ref: menuColunasEl },
        [
          h(
            'button',
            {
              type: 'button',
              class: ['rs-btn', { 'rs-btn-active': menuColunasAberto.value }],
              'aria-expanded': String(menuColunasAberto.value),
              'aria-haspopup': 'true',
              onClick: () => {
                menuColunasAberto.value = !menuColunasAberto.value
              },
            },
            [icone(ICONE_COLUNAS), h('span', { class: 'rs-btn-label' }, 'Colunas')],
          ),
          menuColunasAberto.value
            ? h(
                'div',
                { class: 'rs-menu', role: 'menu' },
                contexto.todasColunas.value.map((col) =>
                  h('label', { key: col.key, class: 'rs-menu-item' }, [
                    h('input', {
                      type: 'checkbox',
                      class: 'rs-menu-check',
                      checked: colunaVisivel(col.key),
                      onChange: () => alternarColuna(col.key),
                    }),
                    h('span', null, col.label ?? col.key),
                  ]),
                ),
              )
            : null,
        ],
      )
    }

    function botaoDensidade(): VNode {
      return h(
        'button',
        {
          type: 'button',
          class: ['rs-btn', { 'rs-btn-active': densidadeCompacta.value }],
          'aria-pressed': String(densidadeCompacta.value),
          title: densidadeCompacta.value ? 'Densidade: compacta' : 'Densidade: confortável',
          onClick: () => {
            densidadeCompacta.value = !densidadeCompacta.value
          },
        },
        [icone(ICONE_DENSIDADE), h('span', { class: 'rs-btn-label' }, 'Densidade')],
      )
    }

    /**
     * Banner do Falhe Alto — SÓ no modo debug. Grita a localização exata de
     * cada dado inválido. Em produção, a denúncia fica restrita ao indicador
     * sutil na célula (sem internals) e a tabela continua funcionando.
     */
    function bannerErros(): VNode | null {
      if (!debugEfetivo.value || contexto.erros.value.length === 0) return null
      return h('div', { class: 'rs-error-banner', role: 'alert' }, [
        h('strong', { class: 'rs-error-banner-title' }, [
          `Falhe Alto: ${contexto.erros.value.length} dado(s) inválido(s)`,
        ]),
        ...contexto.erros.value.map((erro, i) =>
          h('div', { key: i, class: 'rs-error-banner-item' }, mensagemErro(erro)),
        ),
      ])
    }

    return () =>
      h(
        'div',
        {
          class: ['rs-table-container', { 'rs-density-compact': densidadeCompacta.value }],
        },
        [
          h('div', { class: 'rs-card' }, [
            h('div', { class: 'rs-toolbar' }, [
              h('div', { class: 'rs-toolbar-left' }, [botaoFiltros()]),
              h('div', { class: 'rs-toolbar-right' }, [menuColunas(), botaoDensidade()]),
            ]),
            bannerErros(),
            h(
              'div',
              { class: ['rs-filters-panel', { 'rs-filters-open': filtrosAbertos.value }] },
              [h(RsFilters, { contexto })],
            ),
            h('div', { class: 'rs-table-wrap' }, [
              h('table', { class: 'rs-table' }, [
                h(RsThead, { contexto }),
                h(RsTbody, { contexto, debug: debugEfetivo.value }),
              ]),
            ]),
            h(RsPagination, { contexto }),
          ]),
        ],
      )
  },
})

export default RsDataTable
