import { defineComponent, h } from 'vue'
import type { PropType, VNode } from 'vue'
import type {
  ColumnDefinition,
  RsActionEvent,
  TransformedRow,
  UseRsTableContext,
  ValidationError,
} from '../composables/useRsTable'
import { RsActions, columnActions } from './RsActions'

/**
 * Row key for Vue DOM element tracking.
 *
 * Currently the Core does not provide a unique row identifier, so the fallback
 * is the array index — adequate while there are no animations/transitions in
 * the table. When the Core provides an official row identifier (`__rowIndex`),
 * it will be used automatically as a stable key.
 */
export function rowKey(row: TransformedRow, index: number): string | number {
  const id = row['__rowIndex']?.raw
  if (typeof id === 'string' || typeof id === 'number') return id
  return index
}

const LINHAS_SKELETON_MIN = 3
const LINHAS_SKELETON_MAX = 8

/**
 * Fail Loud error message for tooltip/banner (debug mode only).
 * Exact location: column + row + expected vs. received.
 */
export function errorMessage(err: ValidationError): string {
  const received = typeof err.received === 'string' ? `"${err.received}"` : String(err.received)
  if (err.column === '' || err.rowIndex < 0) {
    return `Expected \`${err.expected}\`, received \`${received}\``
  }
  return `Column \`${err.column}\`, row ${err.rowIndex}, expected \`${err.expected}\`, received \`${received}\``
}

export const RsTbody = defineComponent({
  name: 'RsTbody',
  props: {
    contexto: {
      type: Object as PropType<UseRsTableContext>,
      required: true,
    },
    /**
     * Falhe Alto: true = modo dev (grita: fundo vermelho, borda, tooltip com
     * localização exata); false = modo produção (ícone ⚠ sutil, sem detalhes
     * internos). O rosiumdataTable resolve o padrão via import.meta.env.DEV.
     */
    debug: {
      type: Boolean,
      default: false,
    },
  },
  emits: {
    action: (payload: RsActionEvent) => payload !== undefined,
  },
  setup(props, { emit }) {
    /**
     * Display cell. The value ALWAYS comes ready from Core (display).
     * Select columns get a visual badge — presentation only: the displayed
     * text is exactly the Core's display value, styled via CSS by
     * data-attribute.
     */
    function cell(col: ColumnDefinition, row: TransformedRow): VNode | string {
      const display = row[col.key]?.display ?? ''
      if (col.type === 'select' && display !== '') {
        return h('span', { class: 'rs-badge', 'data-rs-badge': display }, display)
      }
      return display
    }

    /**
     * Action cell: renders triggers and propagates the 'action' event
     * ({ key, row }) to the context and parent. Never executes logic.
     */
    function actionCell(col: ColumnDefinition, row: TransformedRow): VNode {
      return h(RsActions, {
        actions: columnActions(col),
        row,
        onAction: (payload: RsActionEvent) => {
          props.contexto.emitAction(payload)
          emit('action', payload)
        },
      })
    }

    /** Fail Loud error for the cell (Core's rowIndex = index on the page) */
    function cellError(index: number, col: ColumnDefinition): ValidationError | undefined {
      return props.contexto.errors.value.find(
        (e) => e.rowIndex === index && e.column === col.key,
      )
    }

    return () => {
      const { columns, rows, loading } = props.contexto
      const numCols = Math.max(columns.value.length, 1)

      if (loading.value) {
        const numRows = Math.min(
          Math.max(rows.value.length, LINHAS_SKELETON_MIN),
          LINHAS_SKELETON_MAX,
        )
        return h(
          'tbody',
          { class: 'rs-tbody', 'aria-busy': 'true' },
          Array.from({ length: numRows }, (_, i) =>
            h(
              'tr',
              { key: `skeleton-${i}`, class: 'rs-row rs-loading' },
              columns.value.length > 0
                ? columns.value.map((col, c) =>
                    h('td', { key: col.key, class: 'rs-cell' }, [
                      h('span', { class: 'rs-skeleton' }),
                      i === 0 && c === 0
                        ? h('span', { class: 'rs-sr-only' }, 'Loading...')
                        : null,
                    ]),
                  )
                : [
                    h('td', { class: 'rs-cell', colspan: numCols }, [
                      h('span', { class: 'rs-skeleton' }),
                      i === 0 ? h('span', { class: 'rs-sr-only' }, 'Loading...') : null,
                    ]),
                  ],
            ),
          ),
        )
      }

      if (rows.value.length === 0) {
        return h('tbody', { class: 'rs-tbody' }, [
          h('tr', { class: 'rs-row rs-empty' }, [
            h('td', { class: 'rs-cell', colspan: numCols }, [
              h('div', { class: 'rs-empty-icon', 'aria-hidden': 'true' }),
              h('div', { class: 'rs-empty-title' }, 'No records found'),
              h(
                'div',
                { class: 'rs-empty-desc' },
                'Try adjusting filters or clearing search.',
              ),
            ]),
          ]),
        ])
      }

      return h(
        'tbody',
        { class: 'rs-tbody' },
        rows.value.map((row, index) =>
          h(
            'tr',
            { key: rowKey(row, index), class: 'rs-row' },
            columns.value.map((col) => {
              if (col.type === 'action') {
                return h(
                  'td',
                  {
                    key: col.key,
                    class: ['rs-cell', 'rs-cell-action', `rs-align-${props.contexto.alignment(col)}`],
                  },
                  [actionCell(col, row)],
                )
              }

              const err = cellError(index, col)
              return h(
                'td',
                {
                  key: col.key,
                  class: [
                    'rs-cell',
                    `rs-align-${props.contexto.alignment(col)}`,
                    {
                      'rs-cell--error': err !== undefined,
                      'rs-cell--error-debug': err !== undefined && props.debug,
                    },
                  ],
                  /* Error details only in debug mode — production does not expose internals */
                  'data-rs-error': err && props.debug ? errorMessage(err) : undefined,
                },
                [
                  err
                    ? h(
                        'span',
                        {
                          class: 'rs-cell-error-icon',
                          role: 'img',
                          'aria-label': 'Invalid data',
                        },
                        '\u26A0',
                      )
                    : null,
                  cell(col, row),
                ],
              )
            }),
          ),
        ),
      )
    }
  },
})

export default RsTbody
