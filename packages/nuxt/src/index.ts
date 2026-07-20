import type { App, Plugin } from 'vue'
import { rosiumdataTable } from './components/rosiumdataTable'
import { RsThead } from './components/RsThead'
import { RsTbody } from './components/RsTbody'
import { RsActions } from './components/RsActions'
import { RsPagination } from './components/RsPagination'
import { RsFilters } from './components/RsFilters'

export { VERSION, NAME } from './meta'

export { useRsTable, actionColumn, readPreferences, savePreferences } from './composables/useRsTable'
export type {
  UseRsTableContext,
  UseRsTableOptions,
  UseRsTableExtras,
  RsActionDefinition,
  ActionDefinition,
  RsActionEvent,
  RsPreferences,
  ColumnAlignment,
  ColumnDefinition,
  DataAdapter,
  Filter,
  RsTableState,
  SortDirection,
  TransformedRow,
  ValidationError,
} from './composables/useRsTable'

export { rosiumdataTable, RsThead, RsTbody, RsActions, RsPagination, RsFilters }
export { columnActions } from './components/RsActions'
export { errorMessage } from './components/RsTbody'
export { isDevEnvironment } from './components/rosiumdataTable'

export { THEME_DEFAULT_CSS } from './theme'

/**
 * Plugin Vue/Nuxt: registra os componentes globalmente.
 *
 * Vue:  app.use(rosiumdata)
 * Nuxt: defineNuxtPlugin((nuxtApp) => { nuxtApp.vueApp.use(rosiumdata) })
 *
 * O componente principal exporta-se como rosiumdataTable (evita colisão com a
 * classe RsTable do Core em imports), mas o nome público no template
 * permanece <RsTable>.
 *
 * O theme é opcional e importado separadamente:
 * import '@rosiumdata/nuxt/theme/default.css'
 */
export const rosiumdata: Plugin = {
  install(app: App) {
    app.component('RsTable', rosiumdataTable)
    app.component('RsThead', RsThead)
    app.component('RsTbody', RsTbody)
    app.component('RsActions', RsActions)
    app.component('RsPagination', RsPagination)
    app.component('RsFilters', RsFilters)
  },
}
