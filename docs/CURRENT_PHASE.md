# CURRENT_PHASE.md — RSdata

> **Status atual do desenvolvimento.** Onde estamos, o que está feito e qual o próximo passo.  
> **Atualizado em:** 2026-07-14 — após conclusão da Fase 2.

---

## FASE ATUAL: Fase 3 — Render Engine Nuxt + Theme Default

**Status:** ⏳ Em progresso

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

---

## PRÓXIMOS PASSOS IMEDIATOS

1. **Iniciar a Fase 3:** Render Engine Nuxt + Theme Default
2. Composable `useRsTable()` — conecta Core ao Vue
3. Componente `<RsTable>` — primeira tabela visível
4. Theme default em CSS puro

---

## BLOQUEIOS

Nenhum no momento.

---

## PRÓXIMA FASE

**Fase 3 — Render Engine Nuxt + Theme Default**

Quando a Fase 3 estiver concluída, a Fase 4 começa com:
- Actions (botão gatilho)
- Falhe Alto integrado ao Render (dev vs produção)

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `docs/ROADMAP.md` (fases completas), `docs/DECISIONS.md` (decisões relevantes à fase atual).
