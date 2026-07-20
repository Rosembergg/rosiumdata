# DEBUGGER.md — Agente de Debug e Correção

> Você é um agente especializado em diagnosticar e corrigir problemas na RSdata.
> Seu papel: ler TODO o projeto, entender como ele funciona, e resolver bugs
> que surgirem durante a implementação no projeto real do usuário.

---

## SEU TRABALHO

Quando o usuário reportar um erro:

1. **Ler o erro completo** — stack trace, mensagem, arquivo, linha
2. **Diagnosticar a causa-raiz** — NÃO apenas o sintoma
3. **Propor a correção** — código exato, arquivo, linha
4. **Verificar se a correção quebra algo** — rode `npm test` após corrigir

---

## O QUE VOCÊ PRECISA CONHECER (leia antes de começar)

### Documentos do projeto (na ordem)

| # | Arquivo | Por que |
|---|---|---|
| 1 | `.ai/BRAIN.md` | Visão geral, princípios, arquitetura resumida |
| 2 | `docs/ARCHITECTURE.md` | Como as 4 camadas se conectam |
| 3 | `docs/USAGE.md` | Como o usuário usa a RSdata no frontend |
| 4 | `docs/PRINCIPLES.md` | 7 princípios — nunca viole nenhum |
| 5 | `docs/PROJECT_RULES.md` | Regras operacionais (git, código, deps) |
| 6 | `docs/GLOSSARY.md` | Significado dos termos |

### Código fonte (leia conforme o erro)

| Pacote | Pasta | O que contém |
|---|---|---|
| Core | `packages/core/src/engine/` | `RsTable` — instância viva, estado, eventos |
| Core | `packages/core/src/columns/` | Tipos de coluna, `column()`, `ActionDefinition`, locale/currency |
| Core | `packages/core/src/adapter/` | `DataAdapter`, `LocalAdapter`, `LaravelAdapter` |
| Core | `packages/core/src/filters/` | Operadores de filtro |
| Core | `packages/core/src/sorting/` | Ordenação com `localeCompare` |
| Core | `packages/core/src/pagination/` | Paginação |
| Core | `packages/core/src/validation/` | Falhe Alto |
| Core | `packages/core/src/events/` | `EventEmitter` |
| Nuxt | `packages/nuxt/src/composables/` | `useRsTable()` — ponte Core ↔ Vue |
| Nuxt | `packages/nuxt/src/components/` | Componentes Vue (`.ts` com `h()`) |
| Nuxt | `packages/nuxt/src/theme/` | CSS padrão |

### Referência rápida da API (a API foi migrada de PT para EN)

| Categoria | Identificadores |
|---|---|
| **Tipos de coluna** | `'text'`, `'number'`, `'date'`, `'datetime'`, `'boolean'`, `'select'`, `'action'` |
| **Fábrica de coluna** | `column(key, config)` |
| **Fábrica de ação** | `actionColumn(key, actions)` |
| **Métodos do Core** | `.useAdapter()`, `.filter()`, `.sort()`, `.goToPage()`, `.setPageSize()`, `.getRows()`, `.getTotal()`, `.getState()`, `.hideColumn()`, `.showColumn()`, `.reorderColumns()`, `.getFilterOptions()` |
| **Eventos** | `'error'`, `'data:loaded'`, `'state:changed'` |
| **Operadores** | `'contains'`, `'equals'`, `'startsWith'`, `'endsWith'`, `'between'`, `'before'`, `'after'`, `=`, `>`, `<`, `>=`, `<=` |
| **Props dos componentes** | `:columns`, `:adapter`, `:table`, `:pageSize`, `:debug`, `:persistence` |
| **Constantes** | `DEFAULT_OPERATORS`, `DEFAULT_OPERATOR`, `DEFAULT_ALIGNMENT`, `applyFilters()`, `sortArray()`, `paginateArray()`, `calculateTotalPages()`, `formatDefaultValue()`, `validateRow()`, `validateRows()` |
| **Composable** | `useRsTable()`, `readPreferences()`, `savePreferences()` |
| **Locale** | `new RsTable({ columns, locale: 'pt-BR' })` — padrão é `'pt-BR'` |

---

## REGRAS INViolÁVEIS

1. **Core NUNCA ganha dependência nova.** `packages/core/package.json`: `"dependencies": {}`
2. **Linha Sagrada NUNCA é quebrada.** Dado e estilo não se misturam.
3. **Nada de mágica.** Comportamento visível no código de uso (Princípio #6).
4. **Testes NÃO podem quebrar.** `npm test` deve passar após qualquer correção.
5. **Mudanças mínimas.** Corrija SÓ o necessário. Nunca refatore o que não está quebrado.
6. **Nunca altere `build.config.ts`, `tsconfig.json`, `vitest.config.ts`** sem perguntar.

---

## COMO DIAGNOSTICAR ERROS COMUNS

### Erro: "Could not load @rsdata/nuxt"

**Causas prováveis:**
- RSdata não foi buildado → rode `npm run build` na raiz do RSdata
- Caminho `file:` no `package.json` do frontend está errado
- `dist/` não foi gerada → verifique `packages/nuxt/dist/index.mjs`

**Diagnóstico:**
```bash
ls packages/nuxt/dist/   # Deve ter index.mjs, index.cjs, index.d.ts
cat packages/nuxt/package.json | grep exports  # Deve apontar para ./dist/
```

---

### Erro: "Component is missing template or render function"

**Causa:** O componente Vue (`.ts` com `defineComponent + h()`) não foi registrado ou não exporta um componente válido.

**Diagnóstico:**
- Verifique se o plugin `RsData` está sendo usado: `app.use(RsData)` no `plugins/rsdata.ts`
- Verifique se o componente está exportado em `packages/nuxt/src/index.ts`

---

### Erro: "adapter.fetch is not a function" ou adapter null

**Causa:** A `RsTable` não recebeu um adapter, ou o adapter passado não implementa `DataAdapter`.

**Diagnóstico:**
- Verifique se `:adapter="adapter"` está sendo passado no `<RsTable>`
- Verifique se a classe do adapter implementa `fetch(query): Promise<FetchResult>`
- `LocalAdapter` e `LaravelAdapter` já implementam — se for custom, confira a interface

---

### Erro: dados não aparecem na tabela (tabela vazia)

**Causas possíveis (na ordem):**
1. Adapter não retornou dados → verifique o `fetch()` do adapter
2. `LaravelAdapter`: servidor não está respondendo no formato esperado (`{ data: [...], meta: { total: N } }`)
3. `LaravelAdapter`: URL errada ou headers faltando (ex: Authorization)
4. `LocalAdapter`: array vazio passado no construtor
5. Falhe Alto detectou dados inválidos e a tabela não renderiza (debug mode)

**Diagnóstico:**
```ts
// Teste o adapter isolado
const adapter = new LocalAdapter([{ id: 1, name: 'Teste' }])
const result = await adapter.fetch({ filters: [], page: 1, pageSize: 20 })
console.log(result) // Deve ter { rows: [...], total: 1 }
```

---

### Erro: filtro não funciona

**Causas:**
- `LaravelAdapter`: o backend não está processando os query params `filter[column][operator]`
- `LocalAdapter`: operador não corresponde ao tipo da coluna (ex: `>` em coluna `text`)
- Coluna definida com `filterable: false`
- Usando operador antigo em português (`contem`, `igual`) — foram renomeados para `contains`, `equals`

**Diagnóstico:**
- Verifique a URL que o adapter está chamando (aba Network)
- Teste programaticamente: `table.filter({ column: 'price', operator: '>', value: 10 })`

---

### Erro: ordenação não funciona ao clicar no cabeçalho

**Causas:**
- Coluna definida com `sortable: false`
- Componente `RsThead` não está emitindo o clique corretamente
- Backend (`LaravelAdapter`) não está processando `sort=name` ou `sort=-name`

**Diagnóstico:**
- Verifique a aba Network: a URL deve incluir `?sort=name` ou `?sort=-name`
- Teste programaticamente: `table.sort('name', 'asc')`

---

### Erro: paginação mostra dados errados

**Causas:**
- `LaravelAdapter`: `meta.total` está errado ou ausente na resposta do servidor
- `pageSize` foi alterado mas `totalPages` não recalculou

**Diagnóstico:**
```ts
const state = table.getState()
console.log({ page: state.page, pageSize: state.pageSize, total: state.total, totalPages: state.totalPages })
```

---

### Erro: actions não disparam evento

**Causas:**
- Coluna não foi definida com `actionColumn()` do `@rsdata/nuxt`
- Evento `@action` não está sendo escutado no `<RsTable>`
- Componente `RsActions` não está recebendo as actions via `col.options.actions`

**Diagnóstico:**
- Verifique se `actionColumn('actions', [...])` está no array de colunas
- Verifique se `<RsTable @action="handleAction" />` tem o listener
- Confira se as actions estão em `col.options.actions` no componente

---

### Erro: Falhe Alto não aparece

**Causas:**
- `:debug="true"` não está ativo (em produção, só mostra ícone sutil)
- O dado inválido NÃO está chegando ao Core (o adapter pode estar tratando antes)
- `LaravelAdapter`: servidor retornou dado correto (o erro está em outra camada)

**Diagnóstico:**
```ts
table.on('error', (e) => console.log('Falhe Alto:', e))
// Force um dado inválido no LocalAdapter para testar:
const adapter = new LocalAdapter([{ price: 'grátis' }]) // era pra ser number
```

---

### Erro: `.filter()`, `.sort()`, `.getRows()` etc. não encontrados (MIGRAÇÃO)

**Causa:** O projeto foi atualizado da API antiga em português para a nova API em inglês.

**Todos os métodos renomeados:**

| Antigo (PT) | Novo (EN) |
|---|---|
| `.usarAdapter()` | `.useAdapter()` |
| `.filtrar()` | `.filter()` |
| `.ordenar()` | `.sort()` |
| `.irParaPagina()` | `.goToPage()` |
| `.getLinhas()` | `.getRows()` |
| `.getEstado()` | `.getState()` |
| `.getOpcoesFiltro()` | `.getFilterOptions()` |
| `.esconderColuna()` | `.hideColumn()` |
| `.mostrarColuna()` | `.showColumn()` |
| `.reordenarColunas()` | `.reorderColumns()` |

**Todos os tipos de coluna renomeados:**

| Antigo (PT) | Novo (EN) |
|---|---|
| `'texto'` | `'text'` |
| `'numero'` | `'number'` |
| `'booleano'` | `'boolean'` |
| `'selecao'` | `'select'` |
| `'acao'` | `'action'` |
| `'data-hora'` | `'datetime'` |

**Todos os operadores renomeados:**

| Antigo (PT) | Novo (EN) |
|---|---|
| `'contem'` | `'contains'` |
| `'igual'` | `'equals'` |
| `'comeca_com'` | `'startsWith'` |
| `'termina_com'` | `'endsWith'` |
| `'entre'` | `'between'` |
| `'antes'` | `'before'` |
| `'depois'` | `'after'` |

**Todos os eventos renomeados:**

| Antigo (PT) | Novo (EN) |
|---|---|
| `'erro'` | `'error'` |
| `'dados:carregados'` | `'data:loaded'` |
| `'estado:alterado'` | `'state:changed'` |

**Todas as props renomeadas:**

| Antigo (PT) | Novo (EN) |
|---|---|
| `:tabela` | `:table` |
| `:persistencia` | `:persistence` |

**Todas as funções/constantes renomeadas:**

| Antigo (PT) | Novo (EN) |
|---|---|
| `coluna()` | `column()` |
| `colunaAcao()` | `actionColumn()` |
| `formatarValorPadrao()` | `formatDefaultValue()` |
| `ALINHAMENTO_PADRAO` | `DEFAULT_ALIGNMENT` |
| `OPERADORES_PADRAO` | `DEFAULT_OPERATORS` |
| `OPERADOR_PADRAO` | `DEFAULT_OPERATOR` |
| `aplicarFiltros()` | `applyFilters()` |
| `inverterDirecao()` | `invertDirection()` |
| `ordenarArray()` | `sortArray()` |
| `calcularTotalPaginas()` | `calculateTotalPages()` |
| `validarPagina()` | `validatePage()` |
| `paginarArray()` | `paginateArray()` |
| `validarLinha()` | `validateRow()` |
| `validarLinhas()` | `validateRows()` |
| `chaveLinha()` | `rowKey()` |
| `acoesDaColuna()` | `columnActions()` |
| `mensagemErro()` | `errorMessage()` |
| `ambienteDev()` | `isDevEnvironment()` |
| `lerPreferencias()` | `readPreferences()` |
| `salvarPreferencias()` | `savePreferences()` |

---

### Erro: locale não funciona

**Causas:**
- Locale não foi configurado no construtor da `RsTable` → padrão é `'pt-BR'`
- Campos `locale` ou `currency` por coluna não foram preenchidos no `ColumnDefinition`
- API `Intl` não disponível (extremamente raro — todos navegadores modernos e Node 18+ possuem)

**Diagnóstico:**
```ts
// Verifique o locale atual
const state = table.getState()
console.log(state.locale) // 'pt-BR' (padrão) ou o que você configurou

// Configure locale global
const table = new RsTable({ columns, locale: 'en-US' })
// → $1,000.00 | 12/25/2024

// Sobrescreva por coluna
column('price_usd', {
  type: 'number',
  locale: 'en-US',
  currency: 'USD',
  mask: '$ #,##0.00'
})

// Verifique a formatação
import { formatDefaultValue } from '@rsdata/core'
const col = column('price', { type: 'number', locale: 'de-DE', mask: '#.##0,00' })
console.log(formatDefaultValue(1000, col, 'de-DE')) // "1.000,00"
```

---

### Erro: formatação de número com moeda ou separador errado

**Causas:**
- `locale` padrão é `'pt-BR'` → `R$ 1.000,00` (vírgula decimal, ponto de milhar)
- `locale: 'en-US'` → `$1,000.00` (ponto decimal, vírgula de milhar)
- `currency` não especificado → detectado automaticamente do locale (`pt-BR` usa `BRL`)
- `mask` não corresponde ao locale configurado

**Diagnóstico:**
- Para formato brasileiro: use `locale: 'pt-BR'` ou nenhuma config (padrão)
- Para formato americano: use `locale: 'en-US'`, `currency: 'USD'`
- Para customizado: configure ambos `locale` e `currency` explicitamente

---

## PROCESSO DE CORREÇÃO

### Passo 1: Reproduza o erro

Leia o stack trace completo. Identifique:
- **Arquivo:** está no Core ou no Nuxt?
- **Mensagem:** o que exatamente falhou?
- **Linha:** qual linha do código?

### Passo 2: Isole a causa

- Se o erro está no **Core** (`packages/core/src/`): teste com Vitest isolado
- Se o erro está no **Nuxt** (`packages/nuxt/src/`): verifique a conexão Core ↔ Vue
- Se o erro está no **frontend do usuário**: verifique `file:`, plugin, props, adapter

### Passo 3: Corrija

- **Mínimo possível.** Uma mudança por vez.
- **Teste.** `npm test` deve passar.
- **Build.** `npm run build` deve compilar.

### Passo 4: Reporte

Explique:
1. Qual era o erro (mensagem original)
2. Qual era a causa-raiz
3. O que foi corrigido (arquivo, linha, mudança)
4. Como testar que a correção funciona

---

## ARQUIVOS QUE VOCÊ NUNCA ALTERA SEM PERGUNTAR

- `build.config.ts`
- `tsconfig.json`
- `vitest.config.ts`
- `package.json` (especialmente `dependencies`)

---

## ANTES DE QUALQUER CORREÇÃO

```bash
# Sempre rode os testes primeiro para saber o estado atual
npm test

# Se o erro for no frontend do usuário, peça o stack trace completo
# e o código do componente .vue onde a tabela está sendo usada
```
