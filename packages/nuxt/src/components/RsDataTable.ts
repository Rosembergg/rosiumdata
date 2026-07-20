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
import { RsTbody, errorMessage } from './RsTbody'
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
export function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env
    return env?.DEV === true
  } catch {
    return false
  }
}

/**
 * Componente principal da tabela. Chama-se rosiumdataTable para não colidir com a
 * classe RsTable do Core em imports. No template, o nome público registrado
 * pelo plugin continua sendo <RsTable>.
 */
export const rosiumdataTable = defineComponent({
  name: 'rosiumdataTable',
  props: {
    /** RsTable Core instance (full control mode) */
    table: {
      type: Object as PropType<RsTableCore>,
      default: undefined,
    },
    /** Column definition (quick mode, together with adapter) */
    columns: {
      type: Array as PropType<ColumnDefinition[]>,
      default: undefined,
    },
    /** Data adapter (quick mode, together with columns) */
    adapter: {
      type: Object as PropType<DataAdapter>,
      default: undefined,
    },
    /** Page size (quick mode) */
    pageSize: {
      type: Number,
      default: undefined,
    },
    /**
     * Fail Loud: true = dev mode (banner + tooltip with exact error location);
     * false = production mode (subtle indicator, no internals exposed).
     * Without the prop, detects import.meta.env.DEV.
     */
    debug: {
      type: Boolean,
      default: undefined,
    },
    /**
     * Persistence key for preferences (visible columns, order,
     * pageSize) in localStorage. Without the key, nothing is saved or restored.
     */
    persistence: {
      type: String,
      default: undefined,
    },
  },
  emits: {
    /** Action trigger: { key, row }. rosiumdata never executes anything. */
    action: (payload: RsActionEvent) => payload !== undefined,
  },
  setup(props, { emit }) {
    let contexto: UseRsTableContext

    if (props.table) {
      contexto = useRsTable(props.table, { persistence: props.persistence })
    } else if (props.columns && props.adapter) {
      contexto = useRsTable(
        {
          columns: props.columns,
          adapter: props.adapter,
          pageSize: props.pageSize,
        },
        { persistence: props.persistence },
      )
    } else {
      throw new Error(
        '[rosiumdata] <RsTable> needs prop "table" (RsTable instance) OR props "columns" + "adapter".',
      )
    }

    /* Propagates action trigger from Render to Vue consumer */
    contexto.on('action', (payload) => emit('action', payload))

    /**
     * Fail Loud debug: always false during SSR and initial hydration to
     * guarantee identical HTML between server and client. The real value
     * is set AFTER full mount (onMounted + nextTick).
     */
    const debugEfetivo = ref(false)

    /* UI state (session only — no persistence, no data logic) */
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
      void contexto.load()
      /* Debug real: only after SSR hydration — avoids mismatch in data-rs-error */
      void nextTick(() => {
        debugEfetivo.value = props.debug ?? isDevEnvironment()
      })
    })

    onUnmounted(() => {
      document.removeEventListener('click', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    })

    function columnIsVisible(key: string): boolean {
      return contexto.columns.value.some((c) => c.key === key)
    }

    function toggleColumn(key: string): void {
      if (columnIsVisible(key)) {
        contexto.hideColumn(key)
      } else {
        contexto.showColumn(key)
      }
    }

    function filterButton(): VNode {
      const active = contexto.filters.value.length
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
          h('span', { class: 'rs-btn-label' }, 'Filters'),
          active > 0 ? h('span', { class: 'rs-badge-count' }, String(active)) : null,
        ],
      )
    }

    function columnsMenu(): VNode {
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
            [icone(ICONE_COLUNAS), h('span', { class: 'rs-btn-label' }, 'Columns')],
          ),
          menuColunasAberto.value
            ? h(
                'div',
                { class: 'rs-menu', role: 'menu' },
                contexto.allColumns.value.map((col) =>
                  h('label', { key: col.key, class: 'rs-menu-item' }, [
                    h('input', {
                      type: 'checkbox',
                      class: 'rs-menu-check',
                      checked: columnIsVisible(col.key),
                      onChange: () => toggleColumn(col.key),
                    }),
                    h('span', null, col.label ?? col.key),
                  ]),
                ),
              )
            : null,
        ],
      )
    }

    function densityButton(): VNode {
      return h(
        'button',
        {
          type: 'button',
          class: ['rs-btn', { 'rs-btn-active': densidadeCompacta.value }],
          'aria-pressed': String(densidadeCompacta.value),
          title: densidadeCompacta.value ? 'Density: compact' : 'Density: comfortable',
          onClick: () => {
            densidadeCompacta.value = !densidadeCompacta.value
          },
        },
        [icone(ICONE_DENSIDADE), h('span', { class: 'rs-btn-label' }, 'Density')],
      )
    }

    /**
     * Fail Loud banner — ONLY in debug mode. Screams the exact location of
     * each invalid data. In production, the warning is limited to a subtle
     * cell indicator (no internals) and the table continues working.
     */
    function errorBanner(): VNode | null {
      if (!debugEfetivo.value || contexto.errors.value.length === 0) return null
      return h('div', { class: 'rs-error-banner', role: 'alert' }, [
        h('strong', { class: 'rs-error-banner-title' }, [
          `Fail Loud: ${contexto.errors.value.length} invalid data`,
        ]),
        ...contexto.errors.value.map((err, i) =>
          h('div', { key: i, class: 'rs-error-banner-item' }, errorMessage(err)),
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
              h('div', { class: 'rs-toolbar-left' }, [filterButton()]),
              h('div', { class: 'rs-toolbar-right' }, [columnsMenu(), densityButton()]),
            ]),
            errorBanner(),
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

export default rosiumdataTable
