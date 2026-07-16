# USAGE.md — Guia de Uso da RSdata

> Como instalar, configurar e usar a RSdata no seu projeto. Do caso mais simples
> ao mais complexo. Todos os exemplos são testados contra o código real.

---

## ÍNDICE

1. [Instalação](#1-instalação)
2. [Primeira tabela (3 linhas)](#2-primeira-tabela-3-linhas)
3. [Colunas e Tipos](#3-colunas-e-tipos)
4. [Filtros](#4-filtros)
5. [Ordenação](#5-ordenação)
6. [Paginação](#6-paginação)
7. [Actions (botões de ação)](#7-actions-botões-de-ação)
8. [Adapters (de onde vêm os dados)](#8-adapters-de-onde-vêm-os-dados)
9. [Falhe Alto (validação de dados)](#9-falhe-alto-validação-de-dados)
10. [Tema e Estilização](#10-tema-e-estilização)
11. [Preferências Persistentes](#11-preferências-persistentes)
12. [API Completa](#12-api-completa)

---

## 1. INSTALAÇÃO

```bash
npm install @rsdata/core @rsdata/nuxt
```

No seu projeto Nuxt 3, registre o plugin em `nuxt.config.ts`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@rsdata/nuxt']
})
```

Ou manualmente em um plugin:

```ts
// plugins/rsdata.ts
import { RsData } from '@rsdata/nuxt'
import '@rsdata/nuxt/theme/default.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RsData)
})
```

---

## 2. PRIMEIRA TABELA (3 LINHAS)

O caso mais simples: dados locais, sem servidor.

```vue
<template>
  <RsTable :columns="colunas" :adapter="adapter" />
</template>

<script setup>
import { coluna, LocalAdapter, RsTable } from '@rsdata/core'
import { useRsTable } from '@rsdata/nuxt'

const colunas = [
  coluna('id',     { type: 'numero', label: 'ID' }),
  coluna('nome',   { type: 'texto',  label: 'Nome' }),
  coluna('preco',  { type: 'numero', label: 'Preço', mask: 'R$ #.##0,00' }),
  coluna('status', { type: 'selecao', label: 'Status', options: {
    entries: { 1: 'Ativo', 2: 'Inativo' }
  }}),
]

const adapter = new LocalAdapter([
  { id: 1, nome: 'Coca-Cola',   preco: 5.99, status: 1 },
  { id: 2, nome: 'Pepsi',       preco: 4.99, status: 2 },
  { id: 3, nome: 'Guaraná',     preco: 3.50, status: 1 },
])
</script>
```

**Resultado:** uma tabela com 4 colunas, 3 linhas, filtro, ordenação e paginação funcionando. Zero configuração além disso.

---

## 3. COLUNAS E TIPOS

### Função `coluna(key, config)`

A função `coluna()` do Core cria a definição da coluna. Tudo que ela precisa:

```ts
import { coluna } from '@rsdata/core'

coluna('nome_do_campo', {
  type: 'texto',        // obrigatório — define o comportamento
  label: 'Nome',        // opcional — texto no cabeçalho (default: key)
  mask: 'R$ #.##0,00',  // opcional — máscara de exibição (numero, data)
  transform: fn,        // opcional — transformação customizada do valor
  options: {},          // opcional — depende do tipo
  sortable: true,       // opcional — permite ordenar (default: true, exceto 'acao')
  filterable: true,     // opcional — permite filtrar (default: true, exceto 'acao')
  visible: true,        // opcional — visível na tabela (default: true)
  alignment: 'right',   // opcional — alinhamento (default: por tipo)
})
```

### Tipos disponíveis

| Tipo | Filtro padrão | Ordenação | Alinhamento | `options` |
|---|---|---|---|---|
| `'texto'` | contém, igual | Alfabética | Esquerda | — |
| `'numero'` | =, >, <, >=, <=, entre | Numérica | Direita | — |
| `'data'` | entre (intervalo), igual | Cronológica | Centro | — |
| `'data-hora'` | entre (intervalo), igual | Cronológica | Centro | — |
| `'booleano'` | igual | — | Centro | `{ trueLabel?, falseLabel? }` |
| `'selecao'` | igual (dropdown) | Pelo valor de exibição | Esquerda | `{ entries: { valor: 'Rótulo' } }` |
| `'acao'` | — | — | Centro | `{ actions: ActionDefinition[] }` |

### Exemplos

```ts
// Texto
coluna('nome', { type: 'texto', label: 'Nome do Produto' })

// Número com máscara
coluna('preco', { type: 'numero', label: 'Preço', mask: 'R$ #.##0,00' })

// Data com máscara
coluna('criadoEm', { type: 'data', label: 'Criado em', mask: 'DD/MM/AAAA' })

// Seleção (enum)
coluna('status', {
  type: 'selecao',
  label: 'Status',
  options: { entries: { 1: 'Ativo', 2: 'Inativo', 3: 'Pendente' } }
})

// Booleano
coluna('ativo', {
  type: 'booleano',
  label: 'Ativo',
  options: { trueLabel: 'Sim', falseLabel: 'Não' }
})
```

---

## 4. FILTROS

Cada tipo de coluna tem operadores de filtro automáticos. O usuário da tabela usa os inputs renderizados pelo `<RsFilters>`.

### Operadores por tipo

| Tipo | Operadores |
|---|---|
| `texto` | `like` (contém), `eq` (igual), `startsWith`, `endsWith` |
| `numero` | `eq`, `gt`, `lt`, `gte`, `lte`, `between` |
| `data` / `data-hora` | `between`, `eq` |
| `booleano` | `eq` |
| `selecao` | `eq` |

### API programática

Se precisar aplicar filtro via código:

```ts
const { filtrar } = useRsTable(tabela)

filtrar({ column: 'nome', operator: 'like', value: 'coca' })
filtrar({ column: 'preco', operator: 'gt', value: 10 })
filtrar({ column: 'status', operator: 'eq', value: 'Ativo' })

// Remover filtro: value vazio
filtrar({ column: 'nome', operator: 'like', value: '' })
```

---

## 5. ORDENAÇÃO

O cabeçalho da tabela é clicável. Cada clique alterna entre `asc`, `desc` e nenhum.

### API programática

```ts
const { ordenar } = useRsTable(tabela)

ordenar('nome', 'asc')
ordenar('preco', 'desc')
```

---

## 6. PAGINAÇÃO

Controlada pelos botões Anterior/Próximo no rodapé da tabela. Tamanho padrão: 20 itens por página.

### API programática

```ts
const { irParaPagina, getEstado } = useRsTable(tabela)

irParaPagina(3)

// Mudar itens por página
const { setPageSize } = useRsTable(tabela)
setPageSize(50)

// Estado atual
const estado = getEstado()
// { page: 3, pageSize: 50, total: 200, totalPages: 4, rows: [...], ... }
```

---

## 7. ACTIONS (BOTÕES DE AÇÃO)

Colunas do tipo `'acao'` renderizam botões por linha. A RSdata emite um evento com `{ key, row }` — a lógica de execução é 100% sua.

### Definindo actions

```ts
import { coluna } from '@rsdata/core'
import { colunaAcao } from '@rsdata/nuxt'

const colunas = [
  coluna('id', { type: 'numero', label: 'ID' }),
  coluna('nome', { type: 'texto', label: 'Nome' }),
  colunaAcao('acoes', [
    { key: 'editar', label: 'Editar' },
    { key: 'excluir', label: 'Excluir', danger: true },
  ]),
]
```

### Capturando o clique

```vue
<template>
  <RsTable :columns="colunas" :adapter="adapter" @action="handleAction" />
</template>

<script setup>
function handleAction(event) {
  const { key, row } = event
  // row.raw contém o dado bruto da linha inteira

  if (key === 'editar') {
    router.push(`/produtos/${row.raw.id}/editar`)
  } else if (key === 'excluir') {
    confirmarExclusao(row.raw.id)
  }
}
</script>
```

**Regra:** a RSdata é o transportador — emite o evento. Você traz a arma — executa a lógica.

### Visual

- **1 ação:** botão direto na linha
- **2+ ações:** ícone ⋯ que abre um dropdown com as opções
- **Ação `danger: true`:** texto vermelho no dropdown

---

## 8. ADAPTERS (DE ONDE VÊM OS DADOS)

### 8.1 LocalAdapter (array em memória)

Ideal para protótipos, testes, ou dados que já estão no frontend.

```ts
import { LocalAdapter } from '@rsdata/core'

const adapter = new LocalAdapter([
  { id: 1, nome: 'Coca-Cola', preco: 5.99 },
  { id: 2, nome: 'Pepsi', preco: 4.99 },
])

// Passar para a tabela
<RsTable :columns="colunas" :adapter="adapter" />
```

O `LocalAdapter` filtra, ordena e pagina o array no navegador. Para poucos itens (até ~500), funciona perfeitamente.

### 8.2 LaravelAdapter (servidor)

Ideal para produção: o servidor faz o trabalho pesado, o navegador só exibe.

```ts
import { LaravelAdapter } from '@rsdata/core'

const adapter = new LaravelAdapter('https://api.seudominio.com/api/produtos', {
  headers: { Authorization: 'Bearer seu-token' },
})
```

#### O que o adapter envia (request)

```
GET /api/produtos?filter[preco][gt]=50&sort=nome&page=1&per_page=20
```

#### O que o backend Laravel precisa retornar

```json
{
  "data": [
    { "id": 1, "nome": "Coca-Cola", "preco": 5.99, "status": 1 }
  ],
  "meta": {
    "current_page": 1,
    "total": 100,
    "per_page": 20
  }
}
```

O campo `data` é obrigatório (array de linhas). O campo `meta.total` é obrigatório (total de registros). Se `meta.total` não existir, procura `total` na raiz da resposta.

#### Configurando o backend Laravel

```php
// app/Http/Controllers/ProdutoController.php
public function index(Request $request)
{
    $query = Produto::query();

    // Aplicar filtros
    foreach ($request->input('filter', []) as $coluna => $operadores) {
        foreach ($operadores as $operador => $valor) {
            match ($operador) {
                'gt'   => $query->where($coluna, '>', $valor),
                'gte'  => $query->where($coluna, '>=', $valor),
                'lt'   => $query->where($coluna, '<', $valor),
                'lte'  => $query->where($coluna, '<=', $valor),
                'eq'   => $query->where($coluna, $valor),
                'like' => $query->where($coluna, 'like', "%{$valor}%"),
                'between' => $query->whereBetween($coluna, $valor),
                default => null,
            };
        }
    }

    // Ordenação
    if ($sort = $request->input('sort')) {
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');
        $query->orderBy($column, $direction);
    }

    // Paginação
    $perPage = $request->input('per_page', 20);
    return $query->paginate($perPage);
}
```

### 8.3 Criando seu próprio adapter

Implemente a interface `DataAdapter`:

```ts
import type { DataAdapter, Query, FetchResult, Row, FilterOption } from '@rsdata/core'

class MeuAdapter implements DataAdapter {
  async fetch(query: Query): Promise<FetchResult> {
    // Sua lógica: recebe Query, retorna { rows, total }
  }

  async fetchAll(query: Query): Promise<Row[]> {
    // Sua lógica: mesmo que fetch, mas sem paginação
  }

  async fetchFilterOptions?(column: string): Promise<FilterOption[]> {
    // Opcional: retorna opções de dropdown para a coluna
  }
}
```

---

## 9. FALHE ALTO (VALIDAÇÃO DE DADOS)

A RSdata detecta dados inválidos automaticamente com base no tipo da coluna. Ex: `preco: "grátis"` onde o tipo é `numero`.

### Modo DEV (debug: true)

A tabela grita com localização exata do erro. Útil durante desenvolvimento.

```vue
<RsTable :columns="colunas" :adapter="adapter" :debug="true" />
```

Exibe banner com: "Coluna `preco`, linha 42, esperava `number`, recebeu `string`".

### Modo PRODUÇÃO (debug: false — padrão)

Apenas um ícone ⚠ sutil na célula. O usuário final não vê detalhes internos. A tabela continua funcionando.

### Capturando erros via código

```ts
const { errorListener } = useRsTable(tabela)

tabela.on('erro', (erro) => {
  // erro: { column, row, expected, received }
  console.error(`Erro na coluna ${erro.column}: esperava ${erro.expected}, recebeu ${erro.received}`)
})
```

---

## 10. TEMA E ESTILIZAÇÃO

### Theme default

O CSS padrão vem com a RSdata. Para usá-lo:

```ts
import '@rsdata/nuxt/theme/default.css'
```

Ou no seu `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ['@rsdata/nuxt/theme/default.css']
})
```

### Customizando o visual

O tema usa CSS custom properties. Sobrescreva no seu CSS:

```css
:root {
  --rs-primary: #1c203f;   /* Azul escuro — cabeçalho, página ativa */
  --rs-accent: #65ba88;    /* Verde água — ações, links, hover */
  --rs-light: #cde9f2;     /* Azul claro — superfícies, hover sutil */
  --rs-success: #66b32e;   /* Verde claro — badges positivos */
}
```

### Classes CSS disponíveis

| Classe | Elemento |
|---|---|
| `.rs-table` | Container principal |
| `.rs-thead` | Cabeçalho |
| `.rs-tbody` | Corpo |
| `.rs-row` | Linha |
| `.rs-cell` | Célula |
| `.rs-cell--error` | Célula com erro (produção) |
| `.rs-cell--error-debug` | Célula com erro (dev) |
| `.rs-pagination` | Controles de paginação |
| `.rs-filters` | Barra de filtros |
| `.rs-loading` | Estado de carregamento |
| `.rs-empty` | Estado vazio |
| `.rs-badge` | Badge de status |
| `.rs-actions` | Menu de ações |

### Modo escuro

O tema detecta automaticamente a preferência do sistema:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --rs-bg-page: #0f172a;
    --rs-bg-card: #1e293b;
    --rs-text-primary: #f1f5f9;
    --rs-text-secondary: #94a3b8;
    --rs-border: #334155;
  }
}
```

---

## 11. PREFERÊNCIAS PERSISTENTES

Ative a persistência com a prop `persistencia`:

```vue
<RsTable :columns="colunas" :adapter="adapter" persistencia="minha-tabela" />
```

Isso salva em `localStorage`:
- Ordem das colunas
- Colunas visíveis
- Tamanho da página (pageSize)

Ao recarregar a página, as preferências são restauradas automaticamente. Cada tabela na sua aplicação deve ter uma chave única.

**É opt-in explícito** — sem a prop `persistencia`, nada é salvo.

---

## 12. API COMPLETA

### `@rsdata/core` — exportações principais

| Export | Tipo | Descrição |
|---|---|---|
| `RsTable` | Classe | Instância viva do Data Engine |
| `coluna(key, config)` | Função | Criar definição de coluna |
| `colunaAcao(key, actions)` | Função | Criar coluna de ação (Render) |
| `LocalAdapter` | Classe | Adapter para array local |
| `LaravelAdapter` | Classe | Adapter para backend Laravel |
| `EventEmitter` | Classe | Sistema de eventos JS puro |
| `aplicarFiltros` | Função | Aplicar filtros a um array |
| `ordenarArray` | Função | Ordenar array |
| `paginarArray` | Função | Paginar array |
| `calcularTotalPaginas` | Função | Math.ceil(total / pageSize) |
| `formatarValorPadrao` | Função | Formatar valor pelo tipo da coluna |
| `validarLinha` / `validarLinhas` | Função | Validar dados (Falhe Alto) |

### `RsTable` — métodos públicos

| Método | Descrição |
|---|---|
| `new RsTable({ columns, pageSize? })` | Criar instância |
| `.usarAdapter(adapter)` | Conectar fonte de dados |
| `.filtrar({ column, operator, value })` | Aplicar filtro |
| `.ordenar(column, direction)` | Ordenar por coluna |
| `.irParaPagina(n)` | Navegar para página |
| `.setPageSize(n)` | Mudar itens por página |
| `.getLinhas()` | Retorna linhas da página atual (transformadas) |
| `.getTotal()` | Retorna total de registros |
| `.getEstado()` | Retorna snapshot completo do estado |
| `.esconderColuna(key)` | Esconder coluna |
| `.mostrarColuna(key)` | Mostrar coluna |
| `.reordenarColunas([...keys])` | Reordenar colunas visíveis |
| `.getOpcoesFiltro(column)` | Buscar opções de dropdown do adapter |
| `.on('dados:carregados', fn)` | Ouvir evento de dados carregados |
| `.on('erro', fn)` | Ouvir evento de erro (Falhe Alto) |
| `.on('estado:alterado', fn)` | Ouvir mudança de estado |

### `@rsdata/nuxt` — exportações principais

| Export | Tipo | Descrição |
|---|---|---|
| `useRsTable(tabela)` | Composable | Ponte Core ↔ Vue (estado reativo) |
| `RsData` | Plugin | `app.use(RsData)` registra componentes |
| `RsDataTable` | Componente | Componente principal (`<RsTable>`) |
| `RsThead` | Componente | Cabeçalho clicável |
| `RsTbody` | Componente | Corpo da tabela |
| `RsActions` | Componente | Botões de ação |
| `RsPagination` | Componente | Controles de paginação |
| `RsFilters` | Componente | Inputs de filtro |
| `colunaAcao()` | Função | Helper para coluna de ação |
| `lerPreferencias()` | Função | Restaurar preferências do localStorage |
| `salvarPreferencias()` | Função | Persistir preferências no localStorage |
| `THEME_DEFAULT_CSS` | String | Caminho do CSS padrão |

### Props do `<RsTable>`

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `columns` | `ColumnDefinition[]` | — | Definição das colunas |
| `adapter` | `DataAdapter` | — | Fonte de dados |
| `pageSize` | `number` | `20` | Itens por página |
| `debug` | `boolean` | `import.meta.env.DEV` | Modo Falhe Alto dev |
| `persistencia` | `string` | — | Chave localStorage (opt-in) |

### Eventos do `<RsTable>`

| Evento | Payload | Quando |
|---|---|---|
| `@action` | `{ key: string, row: TransformedRow }` | Usuário clicou em uma action |
| `@dados:carregados` | `TransformedRow[]` | Dados foram carregados |
| `@erro` | `ValidationError` | Falhe Alto detectou dado inválido |
| `@estado:alterado` | `RsTableState` | Qualquer mudança de estado |

---

## EXEMPLO COMPLETO (PRODUÇÃO)

```vue
<template>
  <RsTable
    :columns="colunas"
    :adapter="adapter"
    :pageSize="25"
    persistencia="produtos"
    @action="handleAction"
  />
</template>

<script setup>
import { coluna } from '@rsdata/core'
import { LaravelAdapter } from '@rsdata/core'
import { colunaAcao } from '@rsdata/nuxt'
import '@rsdata/nuxt/theme/default.css'

const colunas = [
  coluna('id',     { type: 'numero',  label: 'ID' }),
  coluna('nome',   { type: 'texto',   label: 'Produto' }),
  coluna('preco',  { type: 'numero',  label: 'Preço', mask: 'R$ #.##0,00' }),
  coluna('estoque',{ type: 'numero',  label: 'Estoque' }),
  coluna('status', { type: 'selecao', label: 'Status', options: {
    entries: { 1: 'Ativo', 2: 'Inativo', 3: 'Pendente' }
  }}),
  colunaAcao('acoes', [
    { key: 'editar', label: 'Editar' },
    { key: 'excluir', label: 'Excluir', danger: true },
  ]),
]

const adapter = new LaravelAdapter('https://api.seudominio.com/api/produtos', {
  headers: { Authorization: `Bearer ${token}` }
})

function handleAction({ key, row }) {
  if (key === 'editar') router.push(`/produtos/${row.raw.id}`)
  if (key === 'excluir') confirmar(row.raw.id)
}
</script>
```

---

> **Documentos relacionados:** `ARCHITECTURE.md` (estrutura interna), `FEATURES.md` (funcionalidades por fase), `GLOSSARY.md` (termos).
