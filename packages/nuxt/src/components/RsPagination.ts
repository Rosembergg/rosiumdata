import { defineComponent, h } from 'vue'
import type { PropType, VNode } from 'vue'
import type { UseRsTableContext } from '../composables/useRsTable'

/**
 * Calcula quais páginas exibir: primeira, última e uma janela ao redor
 * da atual. Lacunas são representadas por '...'.
 */
export function paginasVisiveis(atual: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const paginas: (number | '...')[] = [1]
  const inicio = Math.max(2, atual - 1)
  const fim = Math.min(total - 1, atual + 1)

  if (inicio > 2) paginas.push('...')
  for (let p = inicio; p <= fim; p++) paginas.push(p)
  if (fim < total - 1) paginas.push('...')
  paginas.push(total)

  return paginas
}

export const RsPagination = defineComponent({
  name: 'RsPagination',
  props: {
    contexto: {
      type: Object as PropType<UseRsTableContext>,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const { paginaAtual, totalPaginas, total, irParaPagina } = props.contexto
      const atual = paginaAtual.value
      const totalPags = Math.max(totalPaginas.value, 1)

      const botoes: VNode[] = [
        h(
          'button',
          {
            type: 'button',
            class: 'rs-page-btn rs-page-prev',
            disabled: atual <= 1,
            onClick: () => void irParaPagina(atual - 1),
          },
          'Anterior',
        ),
      ]

      for (const p of paginasVisiveis(atual, totalPags)) {
        if (p === '...') {
          botoes.push(h('span', { class: 'rs-page-ellipsis' }, '\u2026'))
        } else {
          botoes.push(
            h(
              'button',
              {
                type: 'button',
                class: ['rs-page-btn', 'rs-page-number', { 'rs-page-current': p === atual }],
                disabled: p === atual,
                onClick: () => void irParaPagina(p),
              },
              String(p),
            ),
          )
        }
      }

      botoes.push(
        h(
          'button',
          {
            type: 'button',
            class: 'rs-page-btn rs-page-next',
            disabled: atual >= totalPags,
            onClick: () => void irParaPagina(atual + 1),
          },
          'Próximo',
        ),
      )

      return h('nav', { class: 'rs-pagination', 'aria-label': 'Paginação' }, [
        h('div', { class: 'rs-pagination-buttons' }, botoes),
        h(
          'span',
          { class: 'rs-pagination-info' },
          `Página ${atual} de ${totalPags} — Total: ${total.value} registros`,
        ),
      ])
    }
  },
})

export default RsPagination
