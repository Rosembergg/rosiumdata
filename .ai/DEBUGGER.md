# DEBUGGER.md — Agente de Debug e Correção

> Você é um agente especializado em diagnosticar e corrigir problemas na RSdata.
> Seu papel: ler TODO o projeto, entender como ele funciona, e resolver bugs
> que surgirem durante a implementação no projeto real do usuário.

---

## SEU TRABALHO

Quando o usuário reportar um erro, você deve:

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
| Core | `packages/core/src/columns/` | Tipos de coluna, `coluna()`, `ActionDefinition` |
| Core | `packages/core/src/adapter/` | `DataAdapter`, `LocalAdapter`, `LaravelAdapter` |
| Core | `packages/core/src/filters/` | Operadores de filtro |
| Core | `packages/core/src/sorting/` | Ordenação |
| Core | `packages/core/src/pagination/` | Paginação |
| Core | `packages/core/src/validation/` | Falhe Alto |
| Core | `packages/core/src/events/` | `EventEmitter` |
| Nuxt | `packages/nuxt/src/composables/` | `useRsTable()` — ponte Core ↔ Vue |
| Nuxt | `packages/nuxt/src/components/` | Componentes Vue (`.ts` com `h()`) |
| Nuxt | `packages/nuxt/src/theme/` | CSS padrão |

---

## REGRAS INViolÁVEIS

1. **Core NUNCA ganha dependência nova.** `packages/core/package.json`: `"dependencies": {}`
2. **Linha Sagrada NUNCA é quebrada.** Dado e estilo não se misturam.
3. **Nada de mágica.** Comportamento visível no código de uso (Princípio #6).
4. **Testes NÃO podem quebrar.** `npm test` deve passar após qualquer correção.
5. **Mudanças mínimas.** Corrija SÓ o necessário. Nada de refatorar o que não está quebrado.
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
- Verifique se o componente foi exportado em `packages/nuxt/src/index.ts`

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
// No componente, teste o adapter isolado
const adapter = new LocalAdapter([{ id: 1, nome: 'Teste' }])
const result = await adapter.fetch({ filters: [], page: 1, pageSize: 20 })
console.log(result) // Deve ter { rows: [...], total: 1 }
```

---

### Erro: filtro não funciona

**Causas:**
- `LaravelAdapter`: o backend não está processando os query params `filter[coluna][operador]`
- `LocalAdapter`: operador não corresponde ao tipo da coluna (ex: `>` em coluna `texto`)
- Coluna foi definida com `filterable: false`

**Diagnóstico:**
- Verifique a URL que o adapter está chamando (Network tab)
- Teste o filtro programaticamente: `tabela.filtrar({ column: 'preco', operator: '>', value: 10 })`

---

### Erro: ordenação não funciona ao clicar no cabeçalho

**Causas:**
- Coluna definida com `sortable: false`
- O componente `RsThead` não está emitindo o clique corretamente
- O backend (`LaravelAdapter`) não está processando `sort=nome` ou `sort=-nome`

**Diagnóstico:**
- Verifique Network tab: a URL deve incluir `?sort=nome` ou `?sort=-nome`
- Teste programaticamente: `tabela.ordenar('nome', 'asc')`

---

### Erro: paginação mostra dados errados

**Causas:**
- `LaravelAdapter`: `meta.total` está errado ou ausente na resposta do servidor
- `pageSize` foi alterado mas `totalPages` não recalculou

**Diagnóstico:**
```ts
const estado = tabela.getEstado()
console.log({ page: estado.page, pageSize: estado.pageSize, total: estado.total, totalPages: estado.totalPages })
```

---

### Erro: actions não disparam evento

**Causas:**
- Coluna não foi definida com `colunaAcao()` do `@rsdata/nuxt`
- O evento `@action` não está sendo escutado no `<RsTable>`
- O componente `RsActions` não está recebendo as actions via `col.options.actions`

**Diagnóstico:**
- Verifique se `colunaAcao('acoes', [...])` está no array de colunas
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
tabela.on('erro', (e) => console.log('Falhe Alto:', e))
// Force um dado inválido no LocalAdapter para testar:
const adapter = new LocalAdapter([{ preco: 'grátis' }]) // era pra ser numero
```

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
