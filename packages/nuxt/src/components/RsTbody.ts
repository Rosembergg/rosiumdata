import { defineComponent, h } from 'vue'
import type { PropType, VNode } from 'vue'
import type {
  ColumnDefinition,
  TransformedRow,
  UseRsTableContext,
} from '../composables/useRsTable'

/**
 * Key de linha para o Vue rastrear elementos DOM.
 *
 * Hoje o Core não fornece um identificador único de linha, então o fallback
 * é o índice do array — adequado enquanto não há animações/transições na
 * tabela. Quando o Core fornecer um row identifier oficial (`__rowIndex`),
 * ele será usado automaticamente como key estável.
 */
export function chaveLinha(linha: TransformedRow, index: number): string | number {
  const id = linha['__rowIndex']?.raw
  if (typeof id === 'string' || typeof id === 'number') return id
  return index
}

const LINHAS_SKELETON_MIN = 3
const LINHAS_SKELETON_MAX = 8

export const RsTbody = defineComponent({
  name: 'RsTbody',
  props: {
    contexto: {
      type: Object as PropType<UseRsTableContext>,
      required: true,
    },
  },
  setup(props) {
    /**
     * Célula de exibição. O valor vem SEMPRE pronto do Core (display).
     * Colunas de seleção ganham um badge visual — só apresentação: o texto
     * exibido é exatamente o display do Core, estilizado via CSS por
     * data-attribute.
     */
    function celula(col: ColumnDefinition, linha: TransformedRow): VNode | string {
      const display = linha[col.key]?.display ?? ''
      if (col.type === 'selecao' && display !== '') {
        return h('span', { class: 'rs-badge', 'data-rs-badge': display }, display)
      }
      return display
    }

    return () => {
      const { colunas, linhas, loading } = props.contexto
      const numColunas = Math.max(colunas.value.length, 1)

      if (loading.value) {
        const numLinhas = Math.min(
          Math.max(linhas.value.length, LINHAS_SKELETON_MIN),
          LINHAS_SKELETON_MAX,
        )
        return h(
          'tbody',
          { class: 'rs-tbody', 'aria-busy': 'true' },
          Array.from({ length: numLinhas }, (_, i) =>
            h(
              'tr',
              { key: `skeleton-${i}`, class: 'rs-row rs-loading' },
              colunas.value.length > 0
                ? colunas.value.map((col, c) =>
                    h('td', { key: col.key, class: 'rs-cell' }, [
                      h('span', { class: 'rs-skeleton' }),
                      i === 0 && c === 0
                        ? h('span', { class: 'rs-sr-only' }, 'Carregando...')
                        : null,
                    ]),
                  )
                : [
                    h('td', { class: 'rs-cell', colspan: numColunas }, [
                      h('span', { class: 'rs-skeleton' }),
                      i === 0 ? h('span', { class: 'rs-sr-only' }, 'Carregando...') : null,
                    ]),
                  ],
            ),
          ),
        )
      }

      if (linhas.value.length === 0) {
        return h('tbody', { class: 'rs-tbody' }, [
          h('tr', { class: 'rs-row rs-empty' }, [
            h('td', { class: 'rs-cell', colspan: numColunas }, [
              h('div', { class: 'rs-empty-icon', 'aria-hidden': 'true' }),
              h('div', { class: 'rs-empty-title' }, 'Nenhum registro encontrado'),
              h(
                'div',
                { class: 'rs-empty-desc' },
                'Tente ajustar os filtros ou limpar a busca.',
              ),
            ]),
          ]),
        ])
      }

      return h(
        'tbody',
        { class: 'rs-tbody' },
        linhas.value.map((linha, index) =>
          h(
            'tr',
            { key: chaveLinha(linha, index), class: 'rs-row' },
            colunas.value.map((col) =>
              h(
                'td',
                {
                  key: col.key,
                  class: ['rs-cell', `rs-align-${props.contexto.alinhamento(col)}`],
                },
                [celula(col, linha)],
              ),
            ),
          ),
        ),
      )
    }
  },
})

export default RsTbody
