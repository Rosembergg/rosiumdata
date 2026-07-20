import type { App, Plugin } from 'vue'
import { RosiumDataTable } from './components/RosiumDataTable'
import { RosiumThead } from './components/RosiumThead'
import { RosiumTbody } from './components/RosiumTbody'
import { RosiumActions } from './components/RosiumActions'
import { RosiumPagination } from './components/RosiumPagination'
import { RosiumFilters } from './components/RosiumFilters'

export { VERSION, NAME } from './meta'

export { useRosiumTable, actionColumn, readPreferences, savePreferences } from './composables/useRosiumTable'
export type {
  UseRosiumTableContext,
  UseRosiumTableOptions,
  UseRosiumTableExtras,
  RosiumActionDefinition,
  ActionDefinition,
  RosiumActionEvent,
  RosiumPreferences,
  ColumnAlignment,
  ColumnDefinition,
  DataAdapter,
  Filter,
  RosiumTableState,
  SortDirection,
  TransformedRow,
  ValidationError,
} from './composables/useRosiumTable'

export { RosiumDataTable, RosiumThead, RosiumTbody, RosiumActions, RosiumPagination, RosiumFilters }
export { columnActions } from './components/RosiumActions'
export { errorMessage } from './components/RosiumTbody'
export { isDevEnvironment } from './components/RosiumDataTable'

export { THEME_DEFAULT_CSS } from './theme'

/**
 * Plugin Vue/Nuxt: registra os componentes globalmente.
 *
 * Vue:  app.use(RosiumData)
 * Nuxt: defineNuxtPlugin((nuxtApp) => { nuxtApp.vueApp.use(rosiumdata) })
 *
 * O componente principal exporta-se como RosiumDataTable (evita colisão com a
 * classe RosiumTable do Core em imports), mas o nome público no template
 * permanece <RosiumTable>.
 *
 * O theme é opcional e importado separadamente:
 * import '@rosiumdata/nuxt/theme/default.css'
 */
export const RosiumData: Plugin = {
  install(app: App) {
    app.component('RosiumTable', RosiumDataTable)
    app.component('RosiumThead', RosiumThead)
    app.component('RosiumTbody', RosiumTbody)
    app.component('RosiumActions', RosiumActions)
    app.component('RosiumPagination', RosiumPagination)
    app.component('RosiumFilters', RosiumFilters)
  },
}
