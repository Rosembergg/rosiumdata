import { defineComponent, h, onUnmounted, ref, Teleport } from 'vue'
import type { PropType, VNode } from 'vue'
import type { ColumnDefinition, ActionDefinition, TransformedRow } from '../composables/useRsTable'

/**
 * Extrai as actions declaradas em uma coluna do tipo 'acao'.
 *
 * O contrato guarda as actions em col.options.actions (ver colunaAcao() no
 * composable). Duck-typing em runtime: se não houver array, não há actions.
 */
export function acoesDaColuna(col: ColumnDefinition): ActionDefinition[] {
  const options = col.options as Record<string, unknown> | undefined
  const actions = options?.['actions']
  return Array.isArray(actions) ? (actions as ActionDefinition[]) : []
}

/** Distância (px) entre o botão ⋯ e o dropdown */
const DESLOCAMENTO_MENU = 6

/**
 * Actions de uma linha (gatilhos, nunca executores).
 *
 * - 1 action: botão direto.
 * - 2+ actions: botão ⋯ que abre um dropdown renderizado no <body> (Teleport).
 *   Clique fora ou Escape fecha; clique em um item emite e fecha.
 *
 * Ao clicar, emite APENAS o evento 'action' com { key, row }. Nenhum fetch,
 * nenhuma exclusão, nenhuma navegação — a lógica é 100% do consumidor.
 */
export const RsActions = defineComponent({
  name: 'RsActions',
  props: {
    acoes: {
      type: Array as PropType<ActionDefinition[]>,
      required: true,
    },
    linha: {
      type: Object as PropType<TransformedRow>,
      required: true,
    },
  },
  emits: {
    action: (payload: { key: string; row: TransformedRow }) =>
      typeof payload.key === 'string' && payload.row !== undefined,
  },
  setup(props, { emit }) {
    const aberto = ref(false)
    const botaoEl = ref<HTMLElement | null>(null)
    const menuEl = ref<HTMLElement | null>(null)
    const posicao = ref({ top: 0, left: 0 })

    function disparar(acao: ActionDefinition): void {
      emit('action', { key: acao.key, row: props.linha })
      fechar()
    }

    function aoClicarFora(e: MouseEvent): void {
      const alvo = e.target as Node
      if (menuEl.value?.contains(alvo)) return
      if (botaoEl.value?.contains(alvo)) return
      fechar()
    }

    function aoTeclar(e: KeyboardEvent): void {
      if (e.key === 'Escape') fechar()
    }

    function abrir(): void {
      const rect = botaoEl.value?.getBoundingClientRect()
      if (rect) {
        posicao.value = {
          top: rect.bottom + window.scrollY + DESLOCAMENTO_MENU,
          left: rect.right + window.scrollX,
        }
      }
      aberto.value = true
      document.addEventListener('click', aoClicarFora)
      document.addEventListener('keydown', aoTeclar)
    }

    function fechar(): void {
      if (!aberto.value) return
      aberto.value = false
      document.removeEventListener('click', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }

    onUnmounted(fechar)

    function botaoUnico(acao: ActionDefinition): VNode {
      return h(
        'button',
        {
          type: 'button',
          class: ['rs-action-btn', { 'rs-action-btn--danger': acao.danger === true }],
          onClick: () => disparar(acao),
        },
        acao.label,
      )
    }

    function botaoMenu(): VNode {
      return h(
        'button',
        {
          ref: botaoEl,
          type: 'button',
          class: ['rs-action-btn', 'rs-action-more', { 'rs-btn-active': aberto.value }],
          'aria-haspopup': 'menu',
          'aria-expanded': String(aberto.value),
          'aria-label': 'Ações',
          onClick: () => (aberto.value ? fechar() : abrir()),
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
              top: `${posicao.value.top}px`,
              left: `${posicao.value.left}px`,
            },
          },
          props.acoes.map((acao) =>
            h(
              'button',
              {
                key: acao.key,
                type: 'button',
                class: ['rs-menu-item', 'rs-menu-action', { 'rs-menu-item--danger': acao.danger === true }],
                role: 'menuitem',
                onClick: () => disparar(acao),
              },
              acao.label,
            ),
          ),
        ),
      ])
    }

    return () => {
      if (props.acoes.length === 0) return null
      if (props.acoes.length === 1) return botaoUnico(props.acoes[0]!)
      return h('span', { class: 'rs-actions' }, [botaoMenu(), aberto.value ? dropdown() : null])
    }
  },
})

export default RsActions
