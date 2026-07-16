import { defineComponent, h } from 'vue'
import type { PropType, VNode } from 'vue'
import type {
  ColumnDefinition,
  RsActionEvent,
  TransformedRow,
  UseRsTableContext,
  ValidationError,
} from '../composables/useRsTable'
import { RsActions, acoesDaColuna } from './RsActions'

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

/**
 * Mensagem de erro do Falhe Alto para tooltip/banner (apenas modo debug).
 * Localização exata: coluna + linha + esperado vs. recebido.
 */
export function mensagemErro(erro: ValidationError): string {
  const recebido = typeof erro.received === 'string' ? `"${erro.received}"` : String(erro.received)
  if (erro.column === '' || erro.rowIndex < 0) {
    return `Esperava \`${erro.expected}\`, recebeu \`${recebido}\``
  }
  return `Coluna \`${erro.column}\`, linha ${erro.rowIndex}, esperava \`${erro.expected}\`, recebeu \`${recebido}\``
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
     * internos). O RsDataTable resolve o padrão via import.meta.env.DEV.
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

    /**
     * Célula de action: renderiza os gatilhos e propaga o evento 'action'
     * ({ key, row }) para o contexto e para o pai. Nunca executa lógica.
     */
    function celulaAcao(col: ColumnDefinition, linha: TransformedRow): VNode {
      return h(RsActions, {
        acoes: acoesDaColuna(col),
        linha,
        onAction: (payload: RsActionEvent) => {
          props.contexto.emitirAcao(payload)
          emit('action', payload)
        },
      })
    }

    /** Erro do Falhe Alto para a célula (rowIndex do Core = índice na página) */
    function erroDaCelula(index: number, col: ColumnDefinition): ValidationError | undefined {
      return props.contexto.erros.value.find(
        (e) => e.rowIndex === index && e.column === col.key,
      )
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
            colunas.value.map((col) => {
              if (col.type === 'acao') {
                return h(
                  'td',
                  {
                    key: col.key,
                    class: ['rs-cell', 'rs-cell-action', `rs-align-${props.contexto.alinhamento(col)}`],
                  },
                  [celulaAcao(col, linha)],
                )
              }

              const erro = erroDaCelula(index, col)
              return h(
                'td',
                {
                  key: col.key,
                  class: [
                    'rs-cell',
                    `rs-align-${props.contexto.alinhamento(col)}`,
                    {
                      'rs-cell--error': erro !== undefined,
                      'rs-cell--error-debug': erro !== undefined && props.debug,
                    },
                  ],
                  /* Detalhes do erro só no modo debug — produção não expõe internals */
                  'data-rs-error': erro && props.debug ? mensagemErro(erro) : undefined,
                },
                [
                  erro
                    ? h(
                        'span',
                        {
                          class: 'rs-cell-error-icon',
                          role: 'img',
                          'aria-label': 'Dado inválido',
                        },
                        '\u26A0',
                      )
                    : null,
                  celula(col, linha),
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
