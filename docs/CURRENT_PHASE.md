# CURRENT_PHASE.md — RSdata

> **Status atual do desenvolvimento.** Onde estamos, o que está feito e qual o próximo passo.  
> **Atualizado em:** 2026-07-13 — após conclusão da Fase 1.

---

## FASE ATUAL: Fase 2 — Adapter Local

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

## O QUE JÁ EXISTE

| Item | Status |
|---|---|
| Conhecimento do projeto | ✅ 5 etapas de discovery concluídas |
| Documentação | ✅ Completa (14 documentos) |
| Repositório Git | ✅ Inicializado |
| npm workspaces | ✅ `packages/core` + `packages/nuxt` |
| TypeScript | ✅ Configurado (strict, base + específicos) |
| Build (unbuild) | ✅ Ambos pacotes compilam |
| Testes (Vitest) | ✅ 100 testes passando |
| Estrutura de pastas | ✅ Conforme ARCHITECTURE.md |
| DataAdapter (interface) | ✅ Contrato TypeScript definido |
| RsTable (Data Engine) | ✅ Classe completa com API pública |
| Tipos de coluna | ✅ 7 tipos com comportamentos padrão |
| Sistema de eventos | ✅ Observer pattern puro |
| Falhe Alto | ✅ Validação por tipo, evento de erro |
| Linha Sagrada | ✅ raw/display separados |
| Colunas gerenciáveis | ✅ esconder/mostrar/reordenar |

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

---

## PRÓXIMOS PASSOS IMEDIATOS

1. **Iniciar a Fase 2:** implementar `LocalAdapter` seguindo a interface `DataAdapter`
2. Lógica de filtro local (todos os operadores dos tipos)
3. Lógica de ordenação local
4. Lógica de paginação local
5. Testes de integração: RsTable + LocalAdapter com dados reais

---

## BLOQUEIOS

Nenhum no momento.

---

## PRÓXIMA FASE

**Fase 2 — Adapter Local**

Quando a Fase 2 estiver concluída, a Fase 3 começa com:
- Composable `useRsTable()` — conecta Core ao Vue
- Componente `<RsTable>` — primeira tabela visível
- Theme default em CSS puro

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `docs/ROADMAP.md` (fases completas), `docs/DECISIONS.md` (decisões relevantes à fase atual).
