# CURRENT_PHASE.md — RSdata

> **Status atual do desenvolvimento.** Onde estamos, o que está feito e qual o próximo passo.  
> **Atualizado em:** 2026-07-16 — após conclusão da Fase 3.

---

## FASE ATUAL: Fase 4 — Actions + Falhe Alto (integrado)

**Status:** ⏳ Iniciando

---

### Checklist da Fase 0 ✅ (CONCLUÍDA)

#### Estrutura do repositório
- [x] Inicializar repositório Git (`git init`)
- [x] Criar `package.json` raiz com npm workspaces
- [x] Criar `packages/core/package.json` (`@rsdata/core`, zero dependências)
- [x] Criar `packages/nuxt/package.json` (`@rsdata/nuxt`, depende de `@rsdata/core`)

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
- [x] Tipo `ColumnType`: texto, numero, data, data-hora, booleano, selecao, acao
- [x] Cada tipo = pacote de comportamento (operadores padrão, alinhamento, validação)
- [x] Função `coluna(key, config)` para definição declarativa
- [x] `formatarValorPadrao()` — formatação de valor por tipo
- [x] `ALINHAMENTO_PADRAO` por tipo
- [x] `OPERADORES_PADRAO` por tipo
- [x] TUDO SOBRESCREVÍVEL (Princípio #5) — transform, filterOperators, alignment

#### Data Engine — Classe RsTable
- [x] Instância viva com estado mutável + eventos (Princípio #4)
- [x] API explícita (Princípio #6):
  - [x] `new RsTable({ columns, pageSize? })`
  - [x] `.usarAdapter(adapter)`
  - [x] `.filtrar({ column, operator, value })` — múltiplos AND
  - [x] `.ordenar(column, 'asc'|'desc')`
  - [x] `.irParaPagina(n)` — com validação de limites
  - [x] `.getLinhas()` — dados transformados (raw + display)
  - [x] `.getTotal()` — total de linhas
  - [x] `.getEstado()` — snapshot completo (imutável)
  - [x] `.esconderColuna(key)` / `.mostrarColuna(key)`
  - [x] `.reordenarColunas([...keys])`

#### Linha Sagrada
- [x] Cada célula retorna `{ raw, display }` — valor calculável + receita de exibição
- [x] `raw` = valor puro do adapter (para filtro, ordenação, exportação)
- [x] `display` = valor formatado (máscara, opções de seleção, formatação padrão)
- [x] `exportAsFormatted` para override por coluna (CPF, zero à esquerda)

#### Sistema de Eventos
- [x] EventEmitter puro (observer pattern)
- [x] `.on(event, callback)` / `.off(event, callback)`
- [x] Eventos: `dados:carregados`, `erro`, `estado:alterado`

#### Falhe Alto (Validação)
- [x] Validar dado recebido contra tipo da coluna
- [x] Se inválido: emitir evento `erro` com `{ column, rowIndex, expected, received }`
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
- [x] Função `aplicarFiltros()` — múltiplos filtros com lógica AND
- [x] Operadores texto: `contem`, `igual`, `comeca_com`, `termina_com`
- [x] Operadores numero: `=`, `>`, `<`, `>=`, `<=`, `entre`
- [x] Operadores data/data-hora: `entre`, `antes`, `depois`, `igual`
- [x] Operadores booleano: `igual`
- [x] Operadores selecao: `igual`
- [x] Valores null/undefined na linha → filtro não dá match

#### Ordenação
- [x] Função `ordenarArray()` — ordena por coluna e direção (asc/desc)
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
- [x] `LocalAdapter` exportado de `@rsdata/core`
- [x] `aplicarFiltros` exportado de `@rsdata/core`
- [x] `ordenarArray` exportado de `@rsdata/core`
- [x] `paginarArray` exportado de `@rsdata/core`
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
- [x] Importável via `import '@rsdata/nuxt/theme/default.css'` (export no package.json)

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

---

## DECISÕES TÉCNICAS DA FASE 1

| ID | Decisão | Detalhe |
|---|---|---|
| DT-001 | `FormatarValorPadrao` usa `Intl` nativo | Zero dependências externas. locale pt-BR padrão |
| DT-002 | `validarTexto` aceita apenas string | Números não são automaticamente válidos em coluna texto |
| DT-003 | `getLinhas()` retorna `{ raw, display }` | Valor real + valor de exibição separados por célula |
| DT-004 | `.filtrar()` com valor vazio remove o filtro | Sem API separada para remover filtro |
| DT-005 | `.getEstado()` retorna snapshot imutável | Cópias (`[...]`, `{...}`) para segurança |
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
| DT-029 | `@vue/test-utils` + `happy-dom` como devDependencies do `@rsdata/nuxt` | Só para testes de componente. Ambiente DOM por arquivo via `// @vitest-environment happy-dom` (`vitest.config.ts` intocado) |
| DT-030 | Cleanup automático de listeners via `onScopeDispose` + `desconectar()` explícito | Dentro de componente desconecta sozinho no unmount; fora de componente o dev chama `desconectar()` |
| DT-031 | Plugin `RsData` como export nomeado (sem default export) | Explícito (Princípio #6) e evita warning de bundle misto named/default no unbuild |
| DT-032 | Componente principal exportado como `RsDataTable` (revisão) | Evita colisão de nome com a classe `RsTable` do Core em imports. O nome público no template permanece `<RsTable>` (registrado pelo plugin) |
| DT-033 | Debounce de 300ms nos inputs de digitação do RsFilters (revisão) | `DEBOUNCE_FILTRO_MS` — setTimeout/clearTimeout puro, zero deps. Evita rajada de requisições com adapter server-side (Fase 5). Selects não usam debounce (mudança discreta). Timers cancelados no unmount |
| DT-034 | Key de linha do `<RsTbody>` via `chaveLinha()` (revisão) | Índice do array como fallback — adequado hoje (sem animações/transições). Quando o Core fornecer um row identifier oficial (`__rowIndex`), ele será usado automaticamente como key estável |

### ⚠️ Buraco de contrato encontrado (reportar — não corrigido com gambiarra)

O contrato `DataAdapter` define `fetchFilterOptions?(column)`, mas a classe `RsTable` (Core) **não expõe** nenhum método para o Render consumi-lo (o adapter é privado). Como o Render não pode falar com o Adapter diretamente (regra de camadas), o dropdown de seleção da Fase 3 usa `col.options` da definição da coluna. **Sugestão para Fase 4/5:** adicionar ao Core um método oficial (ex.: `RsTable.getOpcoesFiltro(column)`) que delega ao adapter. O Core NÃO foi alterado nesta fase.

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

## PRÓXIMOS PASSOS IMEDIATOS

1. **Iniciar a Fase 4:** Actions + Falhe Alto integrado
2. Coluna tipo `acao` renderizando botão configurável + evento com o dado da linha
3. Falhe Alto no Render: dev (mensagem com localização exata) vs. produção (estado de erro na célula)
4. Avaliar gancho oficial no Core para `fetchFilterOptions` (buraco de contrato da Fase 3)

---

## BLOQUEIOS

Nenhum no momento.

---

## PRÓXIMA FASE

**Fase 4 — Actions + Falhe Alto (integrado)**

Quando a Fase 4 estiver concluída, a Fase 5 começa com:
- Adapter Server-side (Laravel)
- v1.0 MVP: RSdata no projeto real

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `docs/ROADMAP.md` (fases completas), `docs/DECISIONS.md` (decisões relevantes à fase atual).
