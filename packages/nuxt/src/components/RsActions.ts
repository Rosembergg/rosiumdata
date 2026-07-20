import { defineComponent, h, onUnmounted, ref, Teleport } from 'vue'
import type { PropType, VNode } from 'vue'
import type { ColumnDefinition, ActionDefinition, TransformedRow } from '../composables/useRsTable'

/**
 * Extrai as actions declaradas em uma coluna do tipo 'acao'.
 *
 * O contrato guarda as actions em col.options.actions (ver colunaAcao() no
 * composable). Duck-typing em runtime: se não houver array, não há actions.
 */
export function columnActions(col: ColumnDefinition): ActionDefinition[] {
  const options = col.options as Record<string, unknown> | undefined
  const actions = options?.['actions']
  return Array.isArray(actions) ? (actions as ActionDefinition[]) : []
}

/** Distância (px) entre o botão ⋯ e o dropdown */
const DESLOCAMENTO_MENU = 6

/**
 * Actions of a row (triggers, never executors).
 *
 * - 1 action: direct button.
 * - 2+ actions: ... button that opens a dropdown rendered in <body> (Teleport).
 *   Click outside or Escape closes; click on an item emits and closes.
 *
 * On click, emits ONLY the 'action' event with { key, row }. No fetch,
 * no deletion, no navigation — logic is 100% the consumer's.
 */
export const RsActions = defineComponent({
  name: 'RsActions',
  props: {
    actions: {
      type: Array as PropType<ActionDefinition[]>,
      required: true,
    },
    row: {
      type: Object as PropType<TransformedRow>,
      required: true,
    },
  },
  emits: {
    action: (payload: { key: string; row: TransformedRow }) =>
      typeof payload.key === 'string' && payload.row !== undefined,
  },
  setup(props, { emit }) {
    const open = ref(false)
    const buttonEl = ref<HTMLElement | null>(null)
    const menuEl = ref<HTMLElement | null>(null)
    const position = ref({ top: 0, left: 0 })

    function trigger(action: ActionDefinition): void {
      emit('action', { key: action.key, row: props.row })
      close()
    }

    function onClickOutside(e: MouseEvent): void {
      const target = e.target as Node
      if (menuEl.value?.contains(target)) return
      if (buttonEl.value?.contains(target)) return
      close()
    }

    function onKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape') close()
    }

    function openMenu(): void {
      const rect = buttonEl.value?.getBoundingClientRect()
      if (rect) {
        position.value = {
          top: rect.bottom + window.scrollY + DESLOCAMENTO_MENU,
          left: rect.right + window.scrollX,
        }
      }
      open.value = true
      document.addEventListener('click', onClickOutside)
      document.addEventListener('keydown', onKeydown)
    }

    function close(): void {
      if (!open.value) return
      open.value = false
      document.removeEventListener('click', onClickOutside)
      document.removeEventListener('keydown', onKeydown)
    }

    onUnmounted(close)

    function singleButton(action: ActionDefinition): VNode {
      return h(
        'button',
        {
          type: 'button',
          class: ['rs-action-btn', { 'rs-action-btn--danger': action.danger === true }],
          onClick: () => trigger(action),
        },
        action.label,
      )
    }

    function menuButton(): VNode {
      return h(
        'button',
        {
          ref: buttonEl,
          type: 'button',
          class: ['rs-action-btn', 'rs-action-more', { 'rs-btn-active': open.value }],
          'aria-haspopup': 'menu',
          'aria-expanded': String(open.value),
          'aria-label': 'Actions',
          onClick: () => (open.value ? close() : openMenu()),
        },
        '\u22EF',
      )
    }

    function dropdown(): VNode {
      return h(Teleport, { to: 'body' }, [
        h(
          'div',
          {
            ref: menuEl,
            class: 'rs-menu rs-action-menu',
            role: 'menu',
            style: {
              top: `${position.value.top}px`,
              left: `${position.value.left}px`,
            },
          },
          props.actions.map((action) =>
            h(
              'button',
              {
                key: action.key,
                type: 'button',
                class: ['rs-menu-item', 'rs-menu-action', { 'rs-menu-item--danger': action.danger === true }],
                role: 'menuitem',
                onClick: () => trigger(action),
              },
              action.label,
            ),
          ),
        ),
      ])
    }

    return () => {
      if (props.actions.length === 0) return null
      if (props.actions.length === 1) return singleButton(props.actions[0]!)
      return h('span', { class: 'rs-actions' }, [menuButton(), open.value ? dropdown() : null])
    }
  },
})

export default RsActions
