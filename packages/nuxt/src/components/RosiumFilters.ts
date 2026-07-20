import { defineComponent, h, onUnmounted, reactive } from 'vue'
import type { PropType, VNode } from 'vue'
import type { ColumnDefinition, UseRosiumTableContext } from '../composables/useRosiumTable'

interface LocalRange {
  min: string
  max: string
}

/**
 * Delay (ms) between typing and calling filter(). Avoids burst of
 * requests with server-side adapters. Selects don't use debounce (discrete
 * change). Responsibility of the UI component, not the Core.
 */
export const FILTER_DEBOUNCE_MS = 300

/**
 * HTML inputs always deliver strings. Converts user intent
 * to the value the Core expects, without transforming the data itself.
 */
export function convertOptionKey(key: string): string | number {
  if (key !== '' && !isNaN(Number(key))) return Number(key)
  return key
}

export const RosiumFilters = defineComponent({
  name: 'RosiumFilters',
  props: {
    contexto: {
      type: Object as PropType<UseRosiumTableContext>,
      required: true,
    },
  },
  setup(props) {
    const ranges = reactive<Record<string, LocalRange>>({})
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    function withDebounce(key: string, fn: () => void): void {
      const pending = timers.get(key)
      if (pending) clearTimeout(pending)
      timers.set(key, setTimeout(fn, FILTER_DEBOUNCE_MS))
    }

    onUnmounted(() => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    })

    function rangeValue(key: string): LocalRange {
      if (!ranges[key]) {
        ranges[key] = { min: '', max: '' }
      }
      return ranges[key]!
    }

    function isFilterable(col: ColumnDefinition): boolean {
      return col.filterable !== false && col.type !== 'action'
    }

    function filterText(col: ColumnDefinition, value: string): void {
      void props.contexto.filter({
        column: col.key,
        operator: props.contexto.defaultOperator(col),
        value: value,
      })
    }

    function filterNumber(col: ColumnDefinition): void {
      const { min, max } = rangeValue(col.key)
      if (min !== '' && max !== '') {
        void props.contexto.filter({
          column: col.key,
          operator: 'between',
          value: [Number(min), Number(max)],
        })
      } else if (min !== '') {
        void props.contexto.filter({ column: col.key, operator: '>=', value: Number(min) })
      } else if (max !== '') {
        void props.contexto.filter({ column: col.key, operator: '<=', value: Number(max) })
      } else {
        void props.contexto.filter({ column: col.key, operator: '=', value: '' })
      }
    }

    function filterDate(col: ColumnDefinition): void {
      const { min, max } = rangeValue(col.key)
      if (min !== '' && max !== '') {
        void props.contexto.filter({ column: col.key, operator: 'between', value: [min, max] })
      } else if (min !== '') {
        void props.contexto.filter({ column: col.key, operator: 'after', value: min })
      } else if (max !== '') {
        void props.contexto.filter({ column: col.key, operator: 'before', value: max })
      } else {
        void props.contexto.filter({ column: col.key, operator: 'between', value: '' })
      }
    }

    function filterSelect(col: ColumnDefinition, value: string): void {
      void props.contexto.filter({
        column: col.key,
        operator: 'equals',
        value: value === '' ? '' : convertOptionKey(value),
      })
    }

    function filterBoolean(col: ColumnDefinition, value: string): void {
      void props.contexto.filter({
        column: col.key,
        operator: 'equals',
        value: value === '' ? '' : value === 'true',
      })
    }

    function textInput(col: ColumnDefinition): VNode {
      return h('input', {
        type: 'text',
        class: 'rosium-filter-input',
        placeholder: 'Filter...',
        onInput: (e: Event) => {
          const value = (e.target as HTMLInputElement).value
          withDebounce(col.key, () => filterText(col, value))
        },
      })
    }

    function numberInputs(col: ColumnDefinition): VNode[] {
      return [
        h('input', {
          type: 'number',
          class: 'rosium-filter-input rs-filter-min',
          placeholder: 'Min',
          value: rangeValue(col.key).min,
          onInput: (e: Event) => {
            rangeValue(col.key).min = (e.target as HTMLInputElement).value
            withDebounce(col.key, () => filterNumber(col))
          },
        }),
        h('input', {
          type: 'number',
          class: 'rosium-filter-input rs-filter-max',
          placeholder: 'Max',
          value: rangeValue(col.key).max,
          onInput: (e: Event) => {
            rangeValue(col.key).max = (e.target as HTMLInputElement).value
            withDebounce(col.key, () => filterNumber(col))
          },
        }),
      ]
    }

    function dateInputs(col: ColumnDefinition): VNode[] {
      return [
        h('input', {
          type: 'date',
          class: 'rosium-filter-input rs-filter-min',
          'aria-label': 'Start',
          value: rangeValue(col.key).min,
          onInput: (e: Event) => {
            rangeValue(col.key).min = (e.target as HTMLInputElement).value
            withDebounce(col.key, () => filterDate(col))
          },
        }),
        h('input', {
          type: 'date',
          class: 'rosium-filter-input rs-filter-max',
          'aria-label': 'End',
          value: rangeValue(col.key).max,
          onInput: (e: Event) => {
            rangeValue(col.key).max = (e.target as HTMLInputElement).value
            withDebounce(col.key, () => filterDate(col))
          },
        }),
      ]
    }

    function selectSelect(col: ColumnDefinition): VNode {
      const options = Object.entries(col.options ?? {}).map(([value, label]) =>
        h('option', { value }, label),
      )
      return h(
        'select',
        {
          class: 'rosium-filter-input rs-filter-select',
          onChange: (e: Event) => filterSelect(col, (e.target as HTMLSelectElement).value),
        },
        [h('option', { value: '' }, 'All'), ...options],
      )
    }

    function selectBoolean(col: ColumnDefinition): VNode {
      return h(
        'select',
        {
          class: 'rosium-filter-input rs-filter-select',
          onChange: (e: Event) => filterBoolean(col, (e.target as HTMLSelectElement).value),
        },
        [
          h('option', { value: '' }, 'All'),
          h('option', { value: 'true' }, 'Yes'),
          h('option', { value: 'false' }, 'No'),
        ],
      )
    }

    function fieldsByType(col: ColumnDefinition): VNode[] {
      switch (col.type) {
        case 'number':
          return numberInputs(col)
        case 'date':
        case 'datetime':
          return dateInputs(col)
        case 'select':
          return [selectSelect(col)]
        case 'boolean':
          return [selectBoolean(col)]
        default:
          return [textInput(col)]
      }
    }

    return () =>
      h(
        'div',
        { class: 'rosium-filters' },
        props.contexto.columns.value.filter(isFilterable).map((col) =>
          h('div', { key: col.key, class: ['rosium-filter', `rs-filter-${col.type}`] }, [
            h('label', { class: 'rosium-filter-label' }, col.label ?? col.key),
            h('div', { class: 'rosium-filter-fields' }, fieldsByType(col)),
          ]),
        ),
      )
  },
})

export default RosiumFilters
