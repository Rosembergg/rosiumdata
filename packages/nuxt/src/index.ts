import type { App, Plugin } from 'vue'
import { RsDataTable } from './components/RsDataTable'
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

export { RsDataTable, RsThead, RsTbody, RsActions, RsPagination, RsFilters }
export { columnActions } from './components/RsActions'
export { errorMessage } from './components/RsTbody'
export { isDevEnvironment } from './components/RsDataTable'

export { THEME_DEFAULT_CSS } from './theme'

/**
 * Plugin Vue/Nuxt: registra os componentes globalmente.
 *
 * Vue:  app.use(RsData)
 * Nuxt: defineNuxtPlugin((nuxtApp) => { nuxtApp.vueApp.use(RsData) })
 *
 * O componente principal exporta-se como RsDataTable (evita colisão com a
 * classe RsTable do Core em imports), mas o nome público no template
 * permanece <RsTable>.
 *
 * O theme é opcional e importado separadamente:
 * import '@rosiumdata/nuxt/theme/default.css'
 */
export const RsData: Plugin = {
  install(app: App) {
    app.component('RsTable', RsDataTable)
    app.component('RsThead', RsThead)
    app.component('RsTbody', RsTbody)
    app.component('RsActions', RsActions)
    app.component('RsPagination', RsPagination)
    app.component('RsFilters', RsFilters)
  },
}
