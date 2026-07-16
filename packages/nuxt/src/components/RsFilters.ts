import { defineComponent, h, onUnmounted, reactive } from 'vue'
import type { PropType, VNode } from 'vue'
import type { ColumnDefinition, UseRsTableContext } from '../composables/useRsTable'

interface IntervaloLocal {
  min: string
  max: string
}

/**
 * Atraso (ms) entre a digitação e a chamada de filtrar(). Evita rajada de
 * requisições com adapters server-side. Selects não usam debounce (mudança
 * discreta). Responsabilidade do componente de UI, não do Core.
 */
export const DEBOUNCE_FILTRO_MS = 300

/**
 * Inputs HTML entregam sempre strings. Converte a intenção do usuário
 * para o valor que o Core espera, sem transformar o dado em si.
 */
export function converterChaveOpcao(chave: string): string | number {
  if (chave !== '' && !isNaN(Number(chave))) return Number(chave)
  return chave
}

export const RsFilters = defineComponent({
  name: 'RsFilters',
  props: {
    contexto: {
      type: Object as PropType<UseRsTableContext>,
      required: true,
    },
  },
  setup(props) {
    const intervalos = reactive<Record<string, IntervaloLocal>>({})
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    function comDebounce(key: string, fn: () => void): void {
      const pendente = timers.get(key)
      if (pendente) clearTimeout(pendente)
      timers.set(key, setTimeout(fn, DEBOUNCE_FILTRO_MS))
    }

    onUnmounted(() => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    })

    function intervalo(key: string): IntervaloLocal {
      if (!intervalos[key]) {
        intervalos[key] = { min: '', max: '' }
      }
      return intervalos[key]!
    }

    function filtravel(col: ColumnDefinition): boolean {
      return col.filterable !== false && col.type !== 'acao'
    }

    function filtrarTexto(col: ColumnDefinition, valor: string): void {
      void props.contexto.filtrar({
        column: col.key,
        operator: props.contexto.operadorPadrao(col),
        value: valor,
      })
    }

    function filtrarNumero(col: ColumnDefinition): void {
      const { min, max } = intervalo(col.key)
      if (min !== '' && max !== '') {
        void props.contexto.filtrar({
          column: col.key,
          operator: 'entre',
          value: [Number(min), Number(max)],
        })
      } else if (min !== '') {
        void props.contexto.filtrar({ column: col.key, operator: '>=', value: Number(min) })
      } else if (max !== '') {
        void props.contexto.filtrar({ column: col.key, operator: '<=', value: Number(max) })
      } else {
        void props.contexto.filtrar({ column: col.key, operator: '=', value: '' })
      }
    }

    function filtrarData(col: ColumnDefinition): void {
      const { min, max } = intervalo(col.key)
      if (min !== '' && max !== '') {
        void props.contexto.filtrar({ column: col.key, operator: 'entre', value: [min, max] })
      } else if (min !== '') {
        void props.contexto.filtrar({ column: col.key, operator: 'depois', value: min })
      } else if (max !== '') {
        void props.contexto.filtrar({ column: col.key, operator: 'antes', value: max })
      } else {
        void props.contexto.filtrar({ column: col.key, operator: 'entre', value: '' })
      }
    }

    function filtrarSelecao(col: ColumnDefinition, valor: string): void {
      void props.contexto.filtrar({
        column: col.key,
        operator: 'igual',
        value: valor === '' ? '' : converterChaveOpcao(valor),
      })
    }

    function filtrarBooleano(col: ColumnDefinition, valor: string): void {
      void props.contexto.filtrar({
        column: col.key,
        operator: 'igual',
        value: valor === '' ? '' : valor === 'true',
      })
    }

    function inputTexto(col: ColumnDefinition): VNode {
      return h('input', {
        type: 'text',
        class: 'rs-filter-input',
        placeholder: 'Filtrar...',
        onInput: (e: Event) => {
          const valor = (e.target as HTMLInputElement).value
          comDebounce(col.key, () => filtrarTexto(col, valor))
        },
      })
    }

    function inputsNumero(col: ColumnDefinition): VNode[] {
      return [
        h('input', {
          type: 'number',
          class: 'rs-filter-input rs-filter-min',
          placeholder: 'Mínimo',
          value: intervalo(col.key).min,
          onInput: (e: Event) => {
            intervalo(col.key).min = (e.target as HTMLInputElement).value
            comDebounce(col.key, () => filtrarNumero(col))
          },
        }),
        h('input', {
          type: 'number',
          class: 'rs-filter-input rs-filter-max',
          placeholder: 'Máximo',
          value: intervalo(col.key).max,
          onInput: (e: Event) => {
            intervalo(col.key).max = (e.target as HTMLInputElement).value
            comDebounce(col.key, () => filtrarNumero(col))
          },
        }),
      ]
    }

    function inputsData(col: ColumnDefinition): VNode[] {
      return [
        h('input', {
          type: 'date',
          class: 'rs-filter-input rs-filter-min',
          'aria-label': 'Início',
          value: intervalo(col.key).min,
          onInput: (e: Event) => {
            intervalo(col.key).min = (e.target as HTMLInputElement).value
            comDebounce(col.key, () => filtrarData(col))
          },
        }),
        h('input', {
          type: 'date',
          class: 'rs-filter-input rs-filter-max',
          'aria-label': 'Fim',
          value: intervalo(col.key).max,
          onInput: (e: Event) => {
            intervalo(col.key).max = (e.target as HTMLInputElement).value
            comDebounce(col.key, () => filtrarData(col))
          },
        }),
      ]
    }

    function selectSelecao(col: ColumnDefinition): VNode {
      const opcoes = Object.entries(col.options ?? {}).map(([valor, label]) =>
        h('option', { value: valor }, label),
      )
      return h(
        'select',
        {
          class: 'rs-filter-input rs-filter-select',
          onChange: (e: Event) => filtrarSelecao(col, (e.target as HTMLSelectElement).value),
        },
        [h('option', { value: '' }, 'Todos'), ...opcoes],
      )
    }

    function selectBooleano(col: ColumnDefinition): VNode {
      return h(
        'select',
        {
          class: 'rs-filter-input rs-filter-select',
          onChange: (e: Event) => filtrarBooleano(col, (e.target as HTMLSelectElement).value),
        },
        [
          h('option', { value: '' }, 'Todos'),
          h('option', { value: 'true' }, 'Sim'),
          h('option', { value: 'false' }, 'Não'),
        ],
      )
    }

    function camposPorTipo(col: ColumnDefinition): VNode[] {
      switch (col.type) {
        case 'numero':
          return inputsNumero(col)
        case 'data':
        case 'data-hora':
          return inputsData(col)
        case 'selecao':
          return [selectSelecao(col)]
        case 'booleano':
          return [selectBooleano(col)]
        default:
          return [inputTexto(col)]
      }
    }

    return () =>
      h(
        'div',
        { class: 'rs-filters' },
        props.contexto.colunas.value.filter(filtravel).map((col) =>
          h('div', { key: col.key, class: ['rs-filter', `rs-filter-${col.type}`] }, [
            h('label', { class: 'rs-filter-label' }, col.label ?? col.key),
            h('div', { class: 'rs-filter-fields' }, camposPorTipo(col)),
          ]),
        ),
      )
  },
})

export default RsFilters
