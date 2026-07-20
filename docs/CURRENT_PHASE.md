# CURRENT_PHASE.md — RSdata

> **Status atual do desenvolvimento.** Onde estamos, o que está feito e qual o próximo passo.  
> **Atualizado em:** 2026-07-16 — após conclusão da Fase 5.

---

## FASE ATUAL: Fase 5 — Adapter Server-side (Laravel) ✅ CONCLUÍDA

**Status:** ✅ Concluída — **v1.0 MVP alcançado.** Próximo passo: usar a RSdata no projeto real (substituir o PowerGrid) e/ou fases pós-1.0 opcionais (exportação, seleção, cache).

---

### Checklist da Fase 0 ✅ (CONCLUÍDA)

#### Estrutura do repositório
- [x] Inicializar repositório Git (`git init`)
- [x] Criar `package.json` raiz com npm workspaces
- [x] Criar `packages/core/package.json` (`@rosiumdata/core`, zero dependências)
- [x] Criar `packages/nuxt/package.json` (`@rosiumdata/nuxt`, depende de `@rosiumdata/core`)

#### TypeScript
- [x] Criar `tsconfig.json` base na raiz
- [x] Criar `tsconfig.json` para `packages/core`
- [x] Criar `tsconfig.json` para `packages/nuxt`

#### Build
- [x] Instalar e configurar unbuild para `packages/core`
- [x] Instalar e configurar unbuild para `packages/nuxt`
- [x] Script `build` na raiz (compila core → nuxt)

#### Testes
- [x] Instalar e configurar Vitest
- [x] Script `test` na raiz
- [x] Criar arquivo de teste inicial (smoke test)

#### Estrutura de pastas
- [x] Criar estrutura de `packages/core/src/` (engine, columns, adapter, filters, sorting, pagination, validation, events)
- [x] Criar estrutura de `packages/nuxt/src/` (components, composables, theme)

#### CI mínimo
- [ ] Configurar GitHub Actions (ou similar) para rodar testes no push
- **Nota:** CI foi adiado. O foco agora é código. Será configurado antes do primeiro release público.

#### Documentação
- [x] BRAIN.md ✅
- [x] VISION.md ✅
- [x] PRINCIPLES.md ✅
- [x] ARCHITECTURE.md ✅
- [x] ROADMAP.md ✅
- [x] CURRENT_PHASE.md ✅
- [x] PROJECT_RULES.md ✅
- [x] AI_GUIDE.md ✅
- [x] DECISIONS.md ✅
- [x] GLOSSARY.md ✅
- [x] FEATURES.md ✅
- [x] FUTURE.md ✅
- [x] RISKS.md ✅
- [x] CONTRIBUTING.md ✅
- [x] README.md ✅

---

### Checklist da Fase 1 ✅ (CONCLUÍDA)

#### Interface do Adapter
- [x] Definir `DataAdapter` com `fetch()`, `fetchAll()`, `fetchFilterOptions?()`
- [x] Tipos: `Query`, `FetchResult`, `Row`, `FilterOption`, `Filter`

#### Tipos de Coluna
- [x] Type `ColumnType`: text, number, date, datetime, boolean, select, action
- [x] Each type = behavior package (default operators, alignment, validation)
- [x] Function `column(key, config)` for declarative definition
- [x] `formatDefaultValue()` — value formatting by type
- [x] `DEFAULT_ALIGNMENT` by type
- [x] `DEFAULT_OPERATORS` by type
- [x] EVERYTHING OVERRIDABLE (Principle #5) — transform, filterOperators, alignment

#### Data Engine — Classe RsTable
- [x] Instância viva com estado mutável + eventos (Princípio #4)
- [x] API explícita (Princípio #6):
  - [x] `new RsTable({ columns, pageSize? })`
  - [x] `.useAdapter(adapter)`
  - [x] `.filter({ column, operator, value })` — multiple AND
  - [x] `.sort(column, 'asc'|'desc')`
  - [x] `.goToPage(n)` — with boundary validation
  - [x] `.getRows()` — transformed data (raw + display)
  - [x] `.getTotal()` — total rows
  - [x] `.getState()` — full snapshot (immutable)
  - [x] `.hideColumn(key)` / `.showColumn(key)`
  - [x] `.reorderColumns([...keys])`

#### Linha Sagrada
- [x] Cada célula retorna `{ raw, display }` — valor calculável + receita de exibição
- [x] `raw` = valor puro do adapter (para filtro, ordenação, exportação)
- [x] `display` = valor formatado (máscara, opções de seleção, formatação padrão)
- [x] `exportAsFormatted` para override por coluna (CPF, zero à esquerda)

#### Sistema de Eventos
- [x] EventEmitter puro (observer pattern)
- [x] `.on(event, callback)` / `.off(event, callback)`
- [x] Events: `data:loaded`, `error`, `state:changed`

#### Falhe Alto (Validação)
- [x] Validar dado recebido contra tipo da coluna
- [x] If invalid: emit `error` event with `{ column, rowIndex, expected, received }`
- [x] Validação testável no terminal (sem HTML/DOM)
- [x] Null/undefined aceito em qualquer tipo (não é erro)

#### Testes (Vitest)
- [x] EventEmitter (8 testes)
- [x] Colunas e tipos — comportamento, formatação, alinhamento, operadores (26 testes)
- [x] Validação / Falhe Alto (11 testes)
- [x] Paginação (11 testes)
- [x] Engine / RsTable — filtros, ordenação, paginação, eventos, bordas (36 testes)
- [x] Smoke test (4 testes)
- **Total: 100 testes passando**

---

### Checklist da Fase 2 ✅ (CONCLUÍDA)

#### LocalAdapter
- [x] Classe `LocalAdapter` implementando `DataAdapter`
- [x] Construtor recebe array de dados (`Row[]`)
- [x] `fetch(query)`: aplica filtros → ordena → pagina → retorna `{ rows, total }`
- [x] `fetchAll(query)`: aplica filtros → ordena → retorna TODAS as linhas (sem paginação)
- [x] `fetchFilterOptions(column)`: retorna valores únicos da coluna

#### Operadores de Filtro
- [x] Function `applyFilters()` — multiple filters with AND logic
- [x] Text operators: `contains`, `equals`, `startsWith`, `endsWith`
- [x] Number operators: `=`, `>`, `<`, `>=`, `<=`, `between`
- [x] Date/datetime operators: `between`, `before`, `after`, `equals`
- [x] Boolean operators: `equals`
- [x] Select operators: `equals`
- [x] Valores null/undefined na linha → filtro não dá match

#### Ordenação
- [x] Function `sortArray()` — sort by column and direction (asc/desc)
- [x] Auto-detecção de tipo no valor: string → alfabética, number → numérica, Date → cronológica, boolean → false antes de true
- [x] Valores null/undefined sempre vão para o final (independente da direção)

#### Paginação
- [x] Função `paginarArray()` — fatia o array por offset = (page - 1) * pageSize
- [x] Page < 1 é clamped para 1

#### Testes (Vitest)
- [x] Filtros — 31 testes (todos operadores, combinação AND, casos de borda)
- [x] Ordenação — 15 testes (texto, numero, data, booleano, nulls, repetidos)
- [x] LocalAdapter isolado — 24 testes (fetch, fetchAll, fetchFilterOptions, paginação, filtro+ordenação)
- [x] Integração RsTable + LocalAdapter — 21 testes (fluxo completo, Falhe Alto, getEstado, troca de adapter)
- **Total: 194 testes passando (91 novos)**

#### Exports
- [x] `LocalAdapter` exportado de `@rosiumdata/core`
- [x] `aplicarFiltros` exportado de `@rosiumdata/core`
- [x] `ordenarArray` exportado de `@rosiumdata/core`
- [x] `paginarArray` exportado de `@rosiumdata/core`
- [x] `npm run build` compila sem erros
- [x] `packages/core/package.json` continua com zero dependências

---

### Checklist da Fase 3 ✅ (CONCLUÍDA)

#### Composable useRsTable() — a ponte Core ↔ Vue
- [x] Único ponto de contato entre o Core e o Vue (nenhum componente importa o Core em runtime)
- [x] Aceita instância `RsTable` OU `{ columns, adapter, pageSize }` (modo rápido)
- [x] Escuta eventos do Core: `dados:carregados`, `erro`, `estado:alterado`
- [x] Estado reativo: `linhas`, `total`, `paginaAtual`, `totalPaginas`, `ordenacao`, `filtros`, `colunas`, `loading`, `erro`, `erros`
- [x] Métodos que delegam ao Core: `filtrar()`, `ordenar()`, `irParaPagina()`, `esconderColuna()`, `mostrarColuna()`, `reordenarColunas()`
- [x] `carregar()` — dispara o primeiro fetch (delega para `irParaPagina` da página atual)
- [x] `desconectar()` explícito + cleanup automático via `onScopeDispose`
- [x] Helpers de apresentação: `alinhamento(col)`, `operadorPadrao(col)`

#### Componentes (Render burro — pergunta ao Core, desenha a resposta)
- [x] `<RsTable>` (export JS: `RsDataTable`) — tabela completa (filtros + table + paginação), HTML semântico
- [x] `<RsThead>` — cabeçalho clicável com toggle asc/desc e indicador ↑↓, respeita colunas escondidas
- [x] `<RsTbody>` — células exibem `display` do Core; estados `rs-loading` ("Carregando...") e `rs-empty` ("Nenhum registro")
- [x] `<RsPagination>` — Anterior/números/Próximo, resumo "Página X de Y — Total: N registros", disabled nos limites
- [x] `<RsFilters>` — inputs por tipo: texto (input), numero (min/max), data (date início/fim), selecao (select via `col.options`), booleano (select Sim/Não); debounce de 300ms nos inputs de digitação

#### Theme Default
- [x] `theme/default.css` — CSS puro próprio, zero framework, zero `@import` externo, zero `!important`
- [x] Classes previsíveis: `.rs-table`, `.rs-thead`, `.rs-tbody`, `.rs-row`, `.rs-cell`, `.rs-pagination`, `.rs-filters`, `.rs-loading`, `.rs-empty`, `.rs-sortable`, `.rs-sorted-asc/desc`, `.rs-align-*`, `.rs-filter-*`, `.rs-page-*`
- [x] Importável via `import '@rosiumdata/nuxt/theme/default.css'` (export no package.json)

#### Plugin
- [x] Plugin `RsData` — `app.use(RsData)` registra os 5 componentes globalmente (Vue e Nuxt via `nuxtApp.vueApp.use`)
- [x] Exports: `useRsTable`, `RsDataTable`, `RsThead`, `RsTbody`, `RsPagination`, `RsFilters`, `RsData`, `THEME_DEFAULT_CSS` + tipos

#### Testes (Vitest + @vue/test-utils + happy-dom)
- [x] useRsTable — 18 testes (conexão, eventos, delegação, loading, erro/Falhe Alto, desconexão, mock de adapter)
- [x] Componentes — 30 testes (renderização, ordenação por clique, paginação, filtros por tipo, debounce, loading/empty, integração completa, plugin)
- [x] `packages/core/` sem NENHUMA alteração (`git diff packages/core/` vazio)
- **Total: 242 testes passando (48 novos)**

#### Playground
- [x] `playground/` — prova visual no navegador (`npx vite playground`), usa vite já presente como dependência transitiva

---

## O QUE JÁ EXISTE

| Item | Status |
|---|---|
| Conhecimento do projeto | ✅ 5 etapas de discovery concluídas |
| Documentação | ✅ Completa (14 documentos) |
| Repositório Git | ✅ Inicializado |
| npm workspaces | ✅ `packages/core` + `packages/nuxt` |
| TypeScript | ✅ Configurado (strict, base + específicos) |
| Build (unbuild) | ✅ Ambos pacotes compilam |
| Testes (Vitest) | ✅ 194 testes passando |
| Estrutura de pastas | ✅ Conforme ARCHITECTURE.md |
| DataAdapter (interface) | ✅ Contrato TypeScript definido |
| RsTable (Data Engine) | ✅ Classe completa com API pública |
| Tipos de coluna | ✅ 7 tipos com comportamentos padrão |
| Sistema de eventos | ✅ Observer pattern puro |
| Falhe Alto | ✅ Validação por tipo, evento de erro |
| Linha Sagrada | ✅ raw/display separados |
| Colunas gerenciáveis | ✅ esconder/mostrar/reordenar |
| LocalAdapter | ✅ Filtro/ordenação/paginação local |
| Operadores de filtro | ✅ Todos os 15 operadores implementados |
| Ordenação local | ✅ Sensível ao tipo do valor |
| Paginação local | ✅ Fatiamento de array |
| useRsTable() | ✅ Ponte Core ↔ Vue (eventos → reatividade) |
| Componentes Render | ✅ RsTable, RsThead, RsTbody, RsPagination, RsFilters |
| Theme default | ✅ CSS puro próprio, classes .rs-* |
| Plugin Vue/Nuxt | ✅ app.use(RsData) registra componentes |
| Playground | ✅ Prova visual (npx vite playground) |
| Actions (gatilho) | ✅ Botão único, menu ⋯, evento `{ key, row }` — nunca executa |
| Falhe Alto visual | ✅ Dev grita (banner + tooltip), produção segura (⚠ sutil) |
| Preferências persistentes | ✅ localStorage opt-in via chave `persistencia` |
| LaravelAdapter | ✅ Server-side: Query → params Laravel, parse response, erros de rede viram evento |

---

## DECISÕES TÉCNICAS DA FASE 1

| ID | Decisão | Detalhe |
|---|---|---|
| DT-001 | `FormatarValorPadrao` usa `Intl` nativo | Zero dependências externas. locale pt-BR padrão |
| DT-002 | `validarTexto` aceita apenas string | Números não são automaticamente válidos em coluna texto |
| DT-003 | `getLinhas()` retorna `{ raw, display }` | Valor real + valor de exibição separados por célula |
| DT-004 | `.filter()` with empty value removes the filter | No separate API to remove filter |
| DT-005 | `.getState()` returns immutable snapshot | Copies (`[...]`, `{...}`) for safety |
| DT-006 | `esconderColuna()`/`reordenarColunas()` não fetcham | São operações visuais, não afetam os dados |
| DT-007 | Operadores em português | `contem`, `igual`, `comeca_com`, `entre`, `antes`, `depois` |
| DT-008 | `validarPagina` sempre retorna 1 para total 0 | Tabela sem dados = primeira página "vazia" |
| DT-009 | `filterable: false` automático para tipo `acao` | Colunas de ação não têm dados para filtrar |

## DECISÕES TÉCNICAS DA FASE 2

| ID | Decisão | Detalhe |
|---|---|---|
| DT-010 | Adapter não conhece tipos de coluna | Filtro e ordenação operam sobre os valores crus, auto-detectando tipo no runtime (typeof, instanceof Date) |
| DT-011 | `entre` com auto-detecção | Tenta Date primeiro (inclusivo), fallback para Number. Cobre numero e data/data-hora com mesmo operador |
| DT-012 | `igual` com auto-detecção | Tenta Date (getTime), fallback para strict equality (`===`). Cobre texto, data, booleano, selecao |
| DT-013 | Null sempre no final da ordenação | Independente da direção (asc/desc), null/undefined sempre são empurrados para o final |
| DT-014 | `paginarArray` com clamp de page | Page < 1 é tratado como page = 1, evitando slices negativos |
| DT-015 | `fetchAll` ignora paginação | Retorna todas as linhas que batem com os filtros + ordenação, independente de page/pageSize no Query |
| DT-016 | `fetchFilterOptions` deduplica por JSON.stringify | Para objetos (ex: Date), usa representação string como chave de deduplicação |
| DT-017 | Interface `DataAdapter` não precisou de ajuste | O contrato definido na Fase 1 cobriu todos os cenários da Fase 2 sem buracos |

## DECISÕES TÉCNICAS DA FASE 3

| ID | Decisão | Detalhe |
|---|---|---|
| DT-018 | Componentes em `.ts` com `defineComponent` + `h()` (sem SFC `.vue`) | Compila com o setup atual sem alterar `build.config.ts`/`vitest.config.ts`/`tsconfig.json`. API pública idêntica (`<RsTable>` etc.) |
| DT-019 | `useRsTable()` aceita instância `RsTable` OU `{ columns, adapter, pageSize }` | Permite o modo rápido do `<RsTable>` sem que o componente importe o Core (só o composable importa) |
| DT-020 | Subcomponentes recebem o contexto via prop explícita `contexto` | Sem provide/inject mágico (Princípio #6). Tipos do Core reexportados pelo composable (`import type`, apagado na compilação) |
| DT-021 | `loading` é estado de UI mantido pelo composable | O Core não emite evento de loading; o composable seta `true` antes de delegar e `false` ao resolver |
| DT-022 | `carregar()` delega para `irParaPagina(paginaAtual)` | O Core não tem método dedicado de load inicial; usa o caminho oficial existente sem gambiarra |
| DT-023 | Toggle de ordenação (asc↔desc) vive no `RsThead` | É captura de intenção de clique (UX), não lógica de dado. O Core decide o resto |
| DT-024 | Helpers `alinhamento()`/`operadorPadrao()` expostos pelo composable | Componentes não importam `ALINHAMENTO_PADRAO`/`OPERADOR_PADRAO` do Core diretamente |
| DT-025 | Filtro de intervalo parcial: só mínimo → `>=`/`depois`, só máximo → `<=`/`antes`, ambos → `entre` | Usa apenas operadores oficiais do Core por tipo. Nota: `depois`/`antes` são exclusivos (não incluem o próprio dia) |
| DT-026 | `converterChaveOpcao()` no RsFilters: chave numérica de `options` vira `Number` | Inputs HTML entregam sempre string; o operador `igual` do Core usa igualdade estrita. Conversão de intenção do usuário, não transformação de dado |
| DT-027 | Filtro de seleção usa `col.options` da definição da coluna | `fetchFilterOptions()` do adapter NÃO é alcançável: o Core não o expõe (ver "buraco de contrato" abaixo) |
| DT-028 | CSS distribuído cru: export `./theme/default.css` → `src/theme/default.css` | CSS não precisa de build; `files` do package.json inclui o arquivo. `build.config.ts` intocado |
| DT-029 | `@vue/test-utils` + `happy-dom` como devDependencies do `@rosiumdata/nuxt` | Só para testes de componente. Ambiente DOM por arquivo via `// @vitest-environment happy-dom` (`vitest.config.ts` intocado) |
| DT-030 | Cleanup automático de listeners via `onScopeDispose` + `desconectar()` explícito | Dentro de componente desconecta sozinho no unmount; fora de componente o dev chama `desconectar()` |
| DT-031 | Plugin `RsData` como export nomeado (sem default export) | Explícito (Princípio #6) e evita warning de bundle misto named/default no unbuild |
| DT-032 | Componente principal exportado como `RsDataTable` (revisão) | Evita colisão de nome com a classe `RsTable` do Core em imports. O nome público no template permanece `<RsTable>` (registrado pelo plugin) |
| DT-033 | Debounce de 300ms nos inputs de digitação do RsFilters (revisão) | `DEBOUNCE_FILTRO_MS` — setTimeout/clearTimeout puro, zero deps. Evita rajada de requisições com adapter server-side (Fase 5). Selects não usam debounce (mudança discreta). Timers cancelados no unmount |
| DT-034 | Key de linha do `<RsTbody>` via `chaveLinha()` (revisão) | Índice do array como fallback — adequado hoje (sem animações/transições). Quando o Core fornecer um row identifier oficial (`__rowIndex`), ele será usado automaticamente como key estável |

### ⚠️ Buraco de contrato encontrado (reportar — não corrigido com gambiarra)

O contrato `DataAdapter` define `fetchFilterOptions?(column)`, mas a classe `RsTable` (Core) **não expõe** nenhum método para o Render consumi-lo (o adapter é privado). Como o Render não pode falar com o Adapter diretamente (regra de camadas), o dropdown de seleção da Fase 3 usa `col.options` da definição da coluna. **Sugestão para Fase 4/5:** adicionar ao Core um método oficial (ex.: `RsTable.getFilterOptions(column)`) que delega ao adapter. O Core NÃO foi alterado nesta fase.

## DECISÕES TÉCNICAS DA FASE 4

| ID | Decisão | Detalhe |
|---|---|---|
| DT-045 | Actions declaradas em `col.options.actions` (API definida pelo autor no kickoff da fase) | O Core trata `options` como opaco para o tipo `acao` (não filtra, não valida, `display` = ''). O Render lê por duck-typing (`acoesDaColuna()`). Core intocado |
| DT-046 | Helper `actionColumn(key, actions)` in Render | Core `ColumnDefinition.options` is typed as `Record<string, string>` — declaring actions inline requires user cast. The helper produces a valid definition (via Core `column()`) keeping usage explicit and typed |
| DT-047 | Evento de action viaja por canal próprio do composable (`contexto.on/off/emitirAcao`) | A `RsTable` do Core não expõe `emit` público — o Render não pode (nem deve) emitir eventos na instância do Core. O composable é o hub: RsTbody → `emitirAcao` → listeners + re-emit Vue no `<RsTable @action>`. Payload: `{ key, row }` com a linha transformada (raw + display) |
| DT-048 | Dropdown ⋯ via `Teleport` nativo do Vue para o `<body>` | Zero dependências. Posição calculada do `getBoundingClientRect()` do botão; alinhado à direita via CSS (`translateX(-100%)`). Clique fora, Escape, clique em item e unmount fecham |
| DT-049 | Falhe Alto visual com modos dev/produção via prop `:debug` | Default: `import.meta.env.DEV` (helper `ambienteDev()` com guard para ambientes sem Vite → assume produção, o modo seguro). Dev: `.rs-cell--error-debug` + `data-rs-error` (tooltip CSS) + banner `role="alert"`. Produção: só `.rs-cell--error` + ⚠ com `aria-label`, sem internals |
| DT-050 | `mensagemErro()` formata a denúncia | "Coluna \`X\`, linha N, esperava \`Y\`, recebeu \`Z\`". `rowIndex` é o índice na página atual (contrato do Core desde a Fase 1). Erros gerais (adapter ausente, `rowIndex: -1`) omitem coluna/linha |
| DT-051 | Persistência opt-in por chave explícita (`persistencia`) | Resolve a reserva do DT-039 (restauração automática seria mágica): sem chave visível no código de uso, nada é salvo. Storage: `rsdata:<chave>` com `{ colunasVisiveis, pageSize }`. Restauração usa somente API oficial do Core |
| DT-052 | pageSize restaurado apenas no modo rápido | O Core não tem setter público de pageSize (só no construtor) — **gancho a avaliar no Core** se a Fase 5 precisar de seletor de tamanho de página. No modo instância, o pageSize salvo é ignorado (sem gambiarra) |
| DT-053 | Coluna `acao` nunca recebe estado de erro | O Core não valida tipo `acao` (Fase 1); no Render a célula de action (`.rs-cell-action`) e a célula com erro (`.rs-cell--error`) são células distintas e independentes — action + erro convivem na mesma linha sem sobreposição |
| DT-054 | Classes de erro renomeadas: `.rs-cell--error` / `.rs-cell--error-debug` | Substituem o CSS dormante `.rs-cell-error`/`.rs-row-error` da Fase 3 (nunca publicadas em release — sem quebra) |

## REFINAMENTO VISUAL PREMIUM (pós-aprovação da Fase 3)

Redesign do Theme default (card, toolbar, header claro, badges, skeleton, dark mode automático). Decisões:

| ID | Decisão | Detalhe |
|---|---|---|
| DT-035 | Toolbar com Filtros (toggle + badge de contagem), Colunas (checkboxes) e Densidade | Estado de UI da sessão, sem persistência. Colunas usa a API oficial do Core (`esconderColuna`/`mostrarColuna`) via composable. `todasColunas` adicionado ao `UseRsTableContext` |
| DT-036 | Botões "+ Novo" e "Exportar" OMITIDOS (decisão com o autor) | RSdata é read-only e exportação é plugin pós-1.0 — botões sem função violam Princípio #6. Classe `.rs-btn-primary` pronta no CSS para uso futuro |
| DT-037 | Busca global OMITIDA (decisão com o autor) | O contrato do Core não tem filtro OR entre colunas; o Render não pode filtrar dados. **Gancho a criar no Core** (ex.: busca global no Query) — reportado para o autor |
| DT-038 | Menu ⋯ de ações ADIADO para a Fase 4 (decisão com o autor) | Não existe API de actions na ColumnDefinition; inventá-la é decisão de arquitetura (R19). CSS do dropdown (`.rs-menu`, `.rs-menu-item--danger`) pronto e dormante |
| DT-039 | Preferências em localStorage NÃO implementadas (decisão com o autor) | Fora do roadmap; restauração automática é comportamento invisível (Princípio #6). Densidade/colunas são estado de sessão |
| DT-040 | Badges para colunas `selecao` via `data-rs-badge` + CSS attribute selector | O texto exibido é exatamente o `display` do Core (Linha Sagrada intacta); só estilização. Mapeamentos: Ativo/Inativo/Pendente + badge genérico |
| DT-041 | Skeleton shimmer no loading (substitui spinner) | 3–8 linhas conforme página anterior; `Carregando...` mantido em `.rs-sr-only` (a11y) |
| DT-042 | Modo escuro automático via `prefers-color-scheme` no `:root` | Sem toggle manual; todas as cores em custom properties sobrescrevíveis |
| DT-043 | Indicador de ordenação ▴/▾ + affordance ▾ no hover | Glifos atualizados nos testes |
| DT-044 | CSS dormante para Fase 4/pós-1.0 | `.rs-row-error`/`.rs-cell-error[data-rs-error]` (Falhe Alto visual), `.rs-row-selected` (seleção), `.rs-menu-item--danger` (ação de perigo) |

---

### Checklist da Fase 4 ✅ (CONCLUÍDA)

#### Actions — coluna tipo `acao` no Render (gatilhos, nunca executores)
- [x] `RsActions` (components/RsActions.ts) — renderiza as actions de uma célula
- [x] Actions declaradas em `col.options.actions: [{ key, label, danger? }]`
- [x] Helper `actionColumn(key, actions)` in Render
- [x] 1 action → botão direto (`.rs-action-btn`); `danger: true` → `.rs-action-btn--danger`
- [x] 2+ actions → botão ⋯ (`.rs-action-more`) que abre dropdown
- [x] Dropdown: card branco, borda sutil, sombra, animação 150ms ease-out; itens 8px 16px com hover; `danger` → texto vermelho + hover red (`.rs-menu-item--danger`)
- [x] Dropdown renderizado no `<body>` via `Teleport` (nativo do Vue, zero deps)
- [x] Clique fora OU Escape fecha; clique em uma ação emite e fecha
- [x] Clique emite APENAS `{ key, row }` — zero fetch/exclusão/navegação no componente (read-only: a RSdata é o transportador, o usuário traz a arma)
- [x] Cadeia do evento: RsActions → RsTbody → `contexto.emitirAcao()` → listeners de `contexto.on('action')` → `<RsTable @action>` (re-emit Vue)

#### Falhe Alto — visual (consumidor dos eventos do Core, nunca produtor)
- [x] `useRsTable()` já expunha `erros[]` (Fase 3) — nenhuma validação nova no Render
- [x] Modo DEV (`:debug="true"` ou `import.meta.env.DEV`): célula com `.rs-cell--error` + `.rs-cell--error-debug` (fundo red-50, borda esquerda 3px vermelha), tooltip via `data-rs-error` e banner `.rs-error-banner` abaixo da toolbar com "Coluna \`X\`, linha N, esperava \`Y\`, recebeu \`Z\`"
- [x] Modo PRODUÇÃO (`:debug="false"`): ícone ⚠ sutil (`.rs-cell-error-icon`) + fundo levemente alterado; sem banner, sem detalhes internos; resto da tabela funciona
- [x] Erro + action na mesma linha: células independentes, sem sobreposição (coluna `acao` nunca é validada pelo Core; célula com erro nunca contém botão)

#### Preferências persistentes (100% no composable, zero no Core)
- [x] `useRsTable(fonte, { persistencia: 'chave' })` — salva em `localStorage` (`rsdata:chave`): colunas visíveis + ordem + pageSize
- [x] Sem a chave, nada é salvo/restaurado (explícito, Princípio #6 — resolve a reserva do DT-039)
- [x] Restauração no mount via API oficial do Core (`mostrarColuna`/`esconderColuna`/`reordenarColunas`); pageSize restaurado no modo rápido (construtor)
- [x] Prop `persistencia` no `<RsTable>`; menu "Colunas" da toolbar (checkboxes) alimenta a persistência
- [x] Preferências corrompidas/colunas inexistentes são ignoradas com fallback para defaults

#### Testes (Vitest + happy-dom)
- [x] Ação única: botão renderiza, clique emite `{ key, row }`, `ctx.on/off('action')`
- [x] 3 ações: menu ⋯ renderiza, dropdown abre/fecha (item, clique fora, Escape, unmount)
- [x] Ação danger: classes CSS no botão direto e no dropdown
- [x] Falhe Alto dev: `.rs-cell--error`, `.rs-cell--error-debug`, `data-rs-error`, banner
- [x] Falhe Alto produção: sem banner, indicador sutil, tabela continua funcionando
- [x] Ação + erro na mesma linha: layout não quebra
- [x] Preferências: salvar/restaurar/ignorar corrompidas; fluxo completo via `<RsTable>`
- [x] Menu colunas: checkboxes mostram/escondem colunas
- [x] `packages/core/` sem NENHUMA alteração (`git diff packages/core/` vazio)
- **Total: 279 testes passando (28 novos)**

#### Exports
- [x] `RsActions`, `colunaAcao`, `acoesDaColuna`, `mensagemErro`, `ambienteDev`, `lerPreferencias`, `salvarPreferencias` + tipos `RsActionDefinition`, `RsActionEvent`, `RsPreferencias`, `UseRsTableExtras`
- [x] Plugin `RsData` registra também `RsActions`
- [x] `npm run build` compila sem erros; zero dependências novas

---

### Checklist da Fase 5 ✅ (CONCLUÍDA)

#### LaravelAdapter (packages/core/src/adapter/laravel.ts)
- [x] Classe `LaravelAdapter` implementando exatamente a interface `DataAdapter` (mesma do `LocalAdapter` — troca transparente para o Core)
- [x] Construtor: `new LaravelAdapter(baseUrl, { headers?, fetchOptions?, timeout?, fetchAllPageSize? })`
- [x] `fetch(query)`: Query → query params Laravel → fetch nativo → parse → `{ rows, total }`
- [x] `fetchAll(query)`: mesmo endpoint com `page=1` + `per_page` grande (default 1000000, configurável)
- [x] `fetchFilterOptions(column)`: `GET {baseUrl}/filter-options/{coluna}`
- [x] Zero dependências novas — `fetch()` nativo (Node 18+ e navegadores), sem axios/ky/got

#### Tradução Query → Laravel (contrato público, documentado via JSDoc no adapter)
- [x] Filtros → `filter[coluna][operador]=valor` (múltiplos = AND)
- [x] Mapa de operadores URL-safe: `=`→eq, `>`→gt, `<`→lt, `>=`→gte, `<=`→lte, `igual`→eq, `contem`→like, `comeca_com`→starts_with, `termina_com`→ends_with, `entre`→between, `antes`→before, `depois`→after (todos os operadores da Fase 1)
- [x] Ordenação → `sort=nome` (asc) / `sort=-nome` (desc)
- [x] Paginação → `page=3&per_page=20`
- [x] Serialização: array → `20,60` (vírgula), `Date` → ISO 8601, booleano → `1`/`0`
- [x] Operador desconhecido → erro claro com a lista de suportados (Falhe Alto)

#### Parsing Response Laravel → FetchResult
- [x] Formato paginator: `{ data: [...], meta: { current_page, total, per_page } }`
- [x] Formato simplificado: `{ data: [...], total }` (fallback do total na raiz)
- [x] Dado aninhado achatado pelo adapter: `{ categoria: { nome } }` → `categoria_nome` (recursivo; arrays preservados)
- [x] Defensivo: `data` deve ser array de objetos; `total` deve ser numérico — formato inesperado = erro com mensagem clara, nunca quebra silencioso
- [x] Adapter NUNCA transforma valor (1→"Ativo" é Data Engine) — entrega o raw do servidor

#### Tratamento de erros de rede (o adapter nunca quebra)
- [x] Timeout configurável (default 30s) via `AbortController` — mensagem clara com o limite
- [x] HTTP 4xx/5xx → erro com status code + body
- [x] Resposta não-JSON → erro com detalhes
- [x] Rede offline → erro amigável ("verifique a conexão e o servidor")
- [x] 1 tentativa apenas — sem retry automático (retry é política do usuário)
- [x] Toda falha vira rejeição com `Error` de mensagem clara → a `RsTable` captura no caminho oficial (Fase 1) e converte no evento `erro` — a tabela continua viva

#### Testes (Vitest, fetch mockado via `vi.stubGlobal`)
- [x] LaravelAdapter isolado — 58 testes (interface, tradução de todos os operadores, headers/fetchOptions + mescla, parsing, erros HTTP/timeout — inclusive na leitura do body —/offline/malformada, fetchAll, fetchFilterOptions — inclusive baseUrl com query string)
- [x] Integração RsTable + LaravelAdapter — 15 testes (fluxo completo, Query→URL, eventos, troca LocalAdapter→LaravelAdapter transparente, erros de rede E timeout viram evento `erro`, tabela sobrevive a erro e volta a funcionar)
- [x] Falhe Alto com dados sujos do servidor: `{ preco: "grátis" }` em coluna numero → evento `erro` com `{ column, rowIndex, expected, received }`; null aceito; dado aninhado chega plano
- [x] `packages/nuxt/` sem NENHUMA alteração (`git diff packages/nuxt/` vazio); engine/columns/events/validation do Core intocados
- **Total: 352 testes passando (73 novos)**

#### Exports
- [x] `LaravelAdapter`, `OPERADOR_LARAVEL` + tipo `LaravelAdapterOptions` exportados de `@rosiumdata/core`
- [x] `npm run build` compila sem erros; `@rosiumdata/core` continua com zero dependências

---

## DECISÕES TÉCNICAS DA FASE 5

| ID | Decisão | Detalhe |
|---|---|---|
| DT-055 | Erros do adapter viajam pela rejeição da Promise, não por eventos próprios | A interface `DataAdapter` não tem canal de eventos e o Render não fala com o Adapter (regra de camadas). O `LaravelAdapter` lança `Error` com mensagem clara; o catch oficial do `fetchData()` da `RsTable` (existente desde a Fase 1) converte em evento `erro`. Zero alteração no Core — a fronteira "falha HTTP → evento" funciona pelo contrato já existente |
| DT-056 | Operadores traduzidos para inglês URL-safe (aprovado pelo autor) | `=`→`eq`, `>`→`gt`, `<`→`lt`, `>=`→`gte`, `<=`→`lte`, `igual`→`eq`, `contem`→`like`, `comeca_com`→`starts_with`, `termina_com`→`ends_with`, `entre`→`between`, `antes`→`before`, `depois`→`after`. Mapa exportado como `OPERADOR_LARAVEL` (contrato público) |
| DT-057 | Serialização de valores na URL | Array → vírgula (`between=20,60`), `Date` → ISO 8601, booleano → `1`/`0` (convenção Laravel), demais → `String(valor)`. Documentado no JSDoc do adapter |
| DT-058 | `fetchAll` usa o mesmo endpoint com `per_page` grande (aprovado pelo autor) | `page=1&per_page=1000000` (configurável via `fetchAllPageSize`). Zero rota nova no Laravel; contrato mais simples que `all=1` ou endpoint separado |
| DT-059 | `fetchFilterOptions` → `GET {baseUrl}/filter-options/{coluna}` (aprovado pelo autor) | Aceita `{ data: [{ label, value }] }`, array na raiz, itens escalares (viram `{ label: String(v), value: v }`) e objetos sem `label` (usa `String(value)`) |
| DT-060 | Total obrigatório: `meta.total` com fallback para `total` na raiz; ausente/não-numérico = erro | Falhe Alto (Princípio #7): paginação silenciosamente errada é pior que erro claro. Formato inesperado nunca passa batido |
| DT-061 | Achatar aninhado com separador `_` recursivo | `{ categoria: { grupo: { id } } }` → `categoria_grupo_id`. Arrays são preservados como valor (não são objetos de navegação). O Core segue R5 (dado sempre plano) |
| DT-062 | Timeout via `AbortController` + flag própria (`estourouTimeout`) | Distingue timeout de falha de rede sem depender de `DOMException.name` (comportamento varia por ambiente). Default 30s, configurável via `timeout` |
| DT-063 | Sem retry automático | 1 tentativa. Retry é política do usuário (kickoff da fase) — o dev decide no seu código, escutando o evento `erro` |
| DT-064 | Busca global (`?search=`) NÃO implementada | O contrato `Query` do Core não tem campo de busca global (gancho já reportado no DT-037/Fase 3). Implementar só no adapter seria mágica sem porta oficial no Core. Fica documentada como extensão futura quando o gancho existir no Query |
| DT-065 | Headers mesclados com precedência explícita (revisão) | `Accept: application/json` (default) → `fetchOptions.headers` (mesclado, não descartado) → `headers` do adapter. Nomes normalizados em minúsculas via `Headers` nativo (HTTP é case-insensitive). `method: 'GET'` e `signal` do timeout não são sobrescrevíveis (o contrato do adapter é read-only e o timeout é garantido). Documentado no JSDoc de `LaravelAdapterOptions` |
| DT-066 | Timeout cobre a request inteira, incluindo a leitura do body (revisão) | `clearTimeout` só roda após o parse de `response.json()`/`response.text()` — body lento também estoura o timeout, com o guard `estourouTimeout` distinguindo a mensagem |
| DT-067 | `fetchFilterOptions` preserva query string da baseUrl (revisão) | `/api/produtos?tenant=1` → `/api/produtos/filter-options/status?tenant=1` (antes gerava URL inválida) |

### ⚠️ Notas sobre o contrato do Adapter (Fase 5)

- O contrato `DataAdapter` da Fase 1 cobriu a Fase 5 **sem nenhum ajuste** — a troca `LocalAdapter` → `LaravelAdapter` é transparente para Core e Render (testado). A arquitetura não furou.
- O buraco de contrato da Fase 3 permanece: `fetchFilterOptions()` está implementado no adapter, mas a `RsTable` ainda não expõe `getOpcoesFiltro(column)` para o Render consumir. Gancho oficial no Core continua pendente (decisão do autor).

---

## PRÓXIMOS PASSOS IMEDIATOS

1. **v1.0 MVP:** usar a RSdata no projeto real do autor (Laravel DDD), substituindo o PowerGrid — validação em produção
2. Configurar o backend Laravel conforme o contrato documentado no JSDoc do `LaravelAdapter` (request/response)
3. Avaliar ganchos oficiais no Core reportados nas Fases 3/4/5: `getOpcoesFiltro(column)` (opções de filtro via adapter), setter público de pageSize, `actions` tipadas na `ColumnDefinition` e busca global no `Query`
4. Fases pós-1.0 (opcionais): exportação CSV/Excel (plugin), seleção de linhas, cache, CI antes do primeiro release público

---

## BLOQUEIOS

Nenhum no momento.

---

## PRÓXIMA FASE

**Pós-1.0 (opcional)** — o roadmap do MVP está completo:

- Fases 0–5 concluídas → **v1.0 MVP**: RSdata pronta para o projeto real, substituindo o PowerGrid
- Backlog priorizável: exportação (plugin), seleção de linhas, cache, casca React

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `docs/ROADMAP.md` (fases completas), `docs/DECISIONS.md` (decisões relevantes à fase atual).
