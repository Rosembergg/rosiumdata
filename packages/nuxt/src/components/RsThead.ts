import { defineComponent, h } from 'vue'
import type { PropType, VNode } from 'vue'
import type { ColumnDefinition, UseRsTableContext } from '../composables/useRsTable'

export const RsThead = defineComponent({
  name: 'RsThead',
  props: {
    contexto: {
      type: Object as PropType<UseRsTableContext>,
      required: true,
    },
  },
  setup(props) {
    function sortable(col: ColumnDefinition): boolean {
      return col.sortable !== false && col.type !== 'action'
    }

    function onClick(col: ColumnDefinition): void {
      if (!sortable(col)) return
      const current = props.contexto.sortState.value
      const direction =
        current && current.column === col.key && current.direction === 'asc' ? 'desc' : 'asc'
      void props.contexto.sort(col.key, direction)
    }

    function indicator(col: ColumnDefinition): VNode | null {
      const current = props.contexto.sortState.value
      if (!current || current.column !== col.key) return null
      return h(
        'span',
        { class: 'rs-sort-indicator', 'aria-hidden': 'true' },
        current.direction === 'asc' ? ' \u25B4' : ' \u25BE',
      )
    }

    return () =>
      h('thead', { class: 'rs-thead' }, [
        h(
          'tr',
          { class: 'rs-row rs-row-header' },
          props.contexto.columns.value.map((col) => {
            const current = props.contexto.sortState.value
            return h(
              'th',
              {
                key: col.key,
                class: [
                  'rs-cell',
                  'rs-cell-header',
                  `rs-align-${props.contexto.alignment(col)}`,
                  {
                    'rs-sortable': sortable(col),
                    'rs-sorted-asc':
                      current?.column === col.key && current?.direction === 'asc',
                    'rs-sorted-desc':
                      current?.column === col.key && current?.direction === 'desc',
                  },
                ],
                scope: 'col',
                onClick: () => onClick(col),
              },
              [col.label ?? col.key, indicator(col)],
            )
          }),
        ),
      ])
  },
})

export default RsThead
