import { defineComponent, h, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { PropType, VNode } from 'vue'
import { useRosiumTable } from '../composables/useRosiumTable'
import type {
  ColumnDefinition,
  DataAdapter,
  RosiumActionEvent,
  RosiumTable as RosiumTableCore,
  UseRosiumTableContext,
} from '../composables/useRosiumTable'
import { RosiumThead } from './RosiumThead'
import { RosiumTbody, errorMessage } from './RosiumTbody'
import { RosiumPagination } from './RosiumPagination'
import { RosiumFilters } from './RosiumFilters'

function icone(d: string): VNode {
  return h(
    'svg',
    {
      class: 'rosium-icon',
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
 * Componente principal da tabela. Chama-se RosiumDataTable para não colidir com a
 * classe RosiumTable do Core em imports. No template, o nome público registrado
 * pelo plugin continua sendo <RosiumTable>.
 */
export const RosiumDataTable = defineComponent({
  name: 'RosiumDataTable',
  props: {
    /** RosiumTable Core instance (full control mode) */
    table: {
      type: Object as PropType<RosiumTableCore>,
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
    action: (payload: RosiumActionEvent) => payload !== undefined,
  },
  setup(props, { emit }) {
    let contexto: UseRosiumTableContext

    if (props.table) {
      contexto = useRosiumTable(props.table, { persistence: props.persistence })
    } else if (props.columns && props.adapter) {
      contexto = useRosiumTable(
        {
          columns: props.columns,
          adapter: props.adapter,
          pageSize: props.pageSize,
        },
        { persistence: props.persistence },
      )
    } else {
      throw new Error(
        '[rosiumdata] <RosiumTable> needs prop "table" (RosiumTable instance) OR props "columns" + "adapter".',
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
      /* Debug real: only after SSR hydration — avoids mismatch in data-rosium-error */
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
          class: ['rosium-btn', { 'rosium-btn-active': filtrosAbertos.value }],
          'aria-expanded': String(filtrosAbertos.value),
          onClick: () => {
            filtrosAbertos.value = !filtrosAbertos.value
          },
        },
        [
          icone(ICONE_FILTRO),
          h('span', { class: 'rosium-btn-label' }, 'Filters'),
          active > 0 ? h('span', { class: 'rosium-badge-count' }, String(active)) : null,
        ],
      )
    }

    function columnsMenu(): VNode {
      return h(
        'div',
        { class: 'rosium-toolbar-menu', ref: menuColunasEl },
        [
          h(
            'button',
            {
              type: 'button',
              class: ['rosium-btn', { 'rosium-btn-active': menuColunasAberto.value }],
              'aria-expanded': String(menuColunasAberto.value),
              'aria-haspopup': 'true',
              onClick: () => {
                menuColunasAberto.value = !menuColunasAberto.value
              },
            },
            [icone(ICONE_COLUNAS), h('span', { class: 'rosium-btn-label' }, 'Columns')],
          ),
          menuColunasAberto.value
            ? h(
                'div',
                { class: 'rosium-menu', role: 'menu' },
                contexto.allColumns.value.map((col) =>
                  h('label', { key: col.key, class: 'rosium-menu-item' }, [
                    h('input', {
                      type: 'checkbox',
                      class: 'rosium-menu-check',
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
          class: ['rosium-btn', { 'rosium-btn-active': densidadeCompacta.value }],
          'aria-pressed': String(densidadeCompacta.value),
          title: densidadeCompacta.value ? 'Density: compact' : 'Density: comfortable',
          onClick: () => {
            densidadeCompacta.value = !densidadeCompacta.value
          },
        },
        [icone(ICONE_DENSIDADE), h('span', { class: 'rosium-btn-label' }, 'Density')],
      )
    }

    /**
     * Fail Loud banner — ONLY in debug mode. Screams the exact location of
     * each invalid data. In production, the warning is limited to a subtle
     * cell indicator (no internals) and the table continues working.
     */
    function errorBanner(): VNode | null {
      if (!debugEfetivo.value || contexto.errors.value.length === 0) return null
      return h('div', { class: 'rosium-error-banner', role: 'alert' }, [
        h('strong', { class: 'rosium-error-banner-title' }, [
          `Fail Loud: ${contexto.errors.value.length} invalid data`,
        ]),
        ...contexto.errors.value.map((err, i) =>
          h('div', { key: i, class: 'rosium-error-banner-item' }, errorMessage(err)),
        ),
      ])
    }

    return () =>
      h(
        'div',
        {
          class: ['rosium-table-container', { 'rosium-density-compact': densidadeCompacta.value }],
        },
        [
          h('div', { class: 'rosium-card' }, [
            h('div', { class: 'rosium-toolbar' }, [
              h('div', { class: 'rosium-toolbar-left' }, [filterButton()]),
              h('div', { class: 'rosium-toolbar-right' }, [columnsMenu(), densityButton()]),
            ]),
            errorBanner(),
            h(
              'div',
              { class: ['rosium-filters-panel', { 'rosium-filters-open': filtrosAbertos.value }] },
              [h(RosiumFilters, { contexto })],
            ),
            h('div', { class: 'rosium-table-wrap' }, [
              h('table', { class: 'rosium-table' }, [
                h(RosiumThead, { contexto }),
                h(RosiumTbody, { contexto, debug: debugEfetivo.value }),
              ]),
            ]),
            h(RosiumPagination, { contexto }),
          ]),
        ],
      )
  },
})

export default RosiumDataTable
