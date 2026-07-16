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
    function ordenavel(col: ColumnDefinition): boolean {
      return col.sortable !== false && col.type !== 'acao'
    }

    function aoClicar(col: ColumnDefinition): void {
      if (!ordenavel(col)) return
      const atual = props.contexto.ordenacao.value
      const direcao =
        atual && atual.column === col.key && atual.direction === 'asc' ? 'desc' : 'asc'
      void props.contexto.ordenar(col.key, direcao)
    }

    function indicador(col: ColumnDefinition): VNode | null {
      const atual = props.contexto.ordenacao.value
      if (!atual || atual.column !== col.key) return null
      return h(
        'span',
        { class: 'rs-sort-indicator', 'aria-hidden': 'true' },
        atual.direction === 'asc' ? ' \u25B4' : ' \u25BE',
      )
    }

    return () =>
      h('thead', { class: 'rs-thead' }, [
        h(
          'tr',
          { class: 'rs-row rs-row-header' },
          props.contexto.colunas.value.map((col) => {
            const atual = props.contexto.ordenacao.value
            return h(
              'th',
              {
                key: col.key,
                class: [
                  'rs-cell',
                  'rs-cell-header',
                  `rs-align-${props.contexto.alinhamento(col)}`,
                  {
                    'rs-sortable': ordenavel(col),
                    'rs-sorted-asc':
                      atual?.column === col.key && atual?.direction === 'asc',
                    'rs-sorted-desc':
                      atual?.column === col.key && atual?.direction === 'desc',
                  },
                ],
                scope: 'col',
                onClick: () => aoClicar(col),
              },
              [col.label ?? col.key, indicador(col)],
            )
          }),
        ),
      ])
  },
})

export default RsThead
