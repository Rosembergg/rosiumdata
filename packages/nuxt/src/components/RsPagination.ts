import { defineComponent, h } from 'vue'
import type { PropType, VNode } from 'vue'
import type { UseRsTableContext } from '../composables/useRsTable'

/**
 * Calculates which pages to display: first, last, and a window around
 * the current one. Gaps are represented by '...'.
 */
export function visiblePages(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('...')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push('...')
  pages.push(total)

  return pages
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
      const { currentPage, totalPages, total, goToPage } = props.contexto
      const current = currentPage.value
      const totalPgs = Math.max(totalPages.value, 1)

      const buttons: VNode[] = [
        h(
          'button',
          {
            type: 'button',
            class: 'rs-page-btn rs-page-prev',
            disabled: current <= 1,
            onClick: () => void goToPage(current - 1),
          },
          'Previous',
        ),
      ]

      for (const p of visiblePages(current, totalPgs)) {
        if (p === '...') {
          buttons.push(h('span', { class: 'rs-page-ellipsis' }, '\u2026'))
        } else {
          buttons.push(
            h(
              'button',
              {
                type: 'button',
                class: ['rs-page-btn', 'rs-page-number', { 'rs-page-current': p === current }],
                disabled: p === current,
                onClick: () => void goToPage(p),
              },
              String(p),
            ),
          )
        }
      }

      buttons.push(
        h(
          'button',
          {
            type: 'button',
            class: 'rs-page-btn rs-page-next',
            disabled: current >= totalPgs,
            onClick: () => void goToPage(current + 1),
          },
          'Next',
        ),
      )

      return h('nav', { class: 'rs-pagination', 'aria-label': 'Pagination' }, [
        h('div', { class: 'rs-pagination-buttons' }, buttons),
        h(
          'span',
          { class: 'rs-pagination-info' },
          `Page ${current} of ${totalPgs} — Total: ${total.value} records`,
        ),
      ])
    }
  },
})

export default RsPagination
