# USAGE.md — Guia de Uso da RSdata

> Como instalar, configurar e usar a RSdata no seu projeto Nuxt 3. Do caso mais
> simples ao mais complexo. Todos os exemplos são baseados no código real.

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

### Usando localmente (antes da publicação no npm)

Enquanto a RSdata não está publicada no registro npm, use o caminho local no `package.json` do seu frontend Nuxt:

```json
{
  "dependencies": {
    "@rsdata/core": "file:../RStable/packages/core",
    "@rsdata/nuxt": "file:../RStable/packages/nuxt"
  }
}
```

Ajuste `../RStable/` para o caminho real entre seu `frontend/` e a pasta `RStable/`. Depois:

```bash
cd frontend
npm install
```

> **Importante:** o RSdata precisa estar buildado antes. Rode `npm run build` na raiz do RStable para gerar a pasta `dist/` em ambos os pacotes. Sem isso, o import falha.

### Quando estiver publicado no npm (futuro)

```bash
npm install @rsdata/core @rsdata/nuxt
```

### Registrando no Nuxt

Crie um arquivo de plugin em `plugins/rsdata.ts`:

```ts
// frontend/plugins/rsdata.ts
import { RsData } from '@rsdata/nuxt'
import '@rsdata/nuxt/theme/default.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RsData)
})
```

> **Nota:** `RsData` é um **Plugin Vue**, não um Módulo Nuxt. Por isso ele é registrado via `plugins/`, não em `modules` no `nuxt.config.ts`.

---

## 2. PRIMEIRA TABELA (3 LINHAS)

O caso mais simples: dados locais, sem servidor. Apenas `columns` + `adapter` como props — o componente faz todo o resto.

```vue
<template>
  <RsTable :columns="colunas" :adapter="adapter" />
</template>

<script setup>
import { coluna, LocalAdapter } from '@rsdata/core'

const colunas = [
  coluna('id',     { type: 'numero',  label: 'ID' }),
  coluna('nome',   { type: 'texto',   label: 'Nome' }),
  coluna('preco',  { type: 'numero',  label: 'Preço', mask: 'R$ #.##0,00' }),
  coluna('status', { type: 'selecao', label: 'Status', options: {
    1: 'Ativo', 2: 'Inativo'
  }}),
    colunaAcao('acoes', {

    label: 'Ações',

    actions: [

      { key: 'editar', label: 'Editar' },

      { key: 'excluir', label: 'Excluir', danger: true },

    ],

  }),
]

const adapter = new LocalAdapter([
  { id: 1, nome: 'Coca-Cola', preco: 5.99, status: 1 },
  { id: 2, nome: 'Pepsi',     preco: 4.99, status: 2 },
  { id: 3, nome: 'Guaraná',   preco: 3.50, status: 1 },
])
</script>
```

**Resultado:** uma tabela com 4 colunas, 3 linhas, filtro, ordenação e paginação funcionando. Zero configuração além disso.

---

## 3. COLUNAS E TIPOS

### Função `coluna(key, config)`

Cria a definição de uma coluna:

```ts
import { coluna } from '@rsdata/core'

coluna('nome_do_campo', {
  type: 'texto',        // obrigatório — define o comportamento
  label: 'Nome',        // opcional — texto no cabeçalho (default: key)
  mask: 'R$ #.##0,00',  // opcional — máscara de exibição (tipo 'numero')
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
| `'texto'` | contém | Alfabética (pt-BR) | Esquerda | — |
| `'numero'` | `=` | Numérica | Direita | — |
| `'data'` | entre (intervalo) | Cronológica | Centro | — |
| `'data-hora'` | entre (intervalo) | Cronológica | Centro | — |
| `'booleano'` | igual (dropdown Sim/Não) | Não < Sim | Centro | — (exibe `Sim`/`Nao`; use `transform` para customizar) |
| `'selecao'` | igual (dropdown) | Pelo valor bruto | Esquerda | `{ valor: 'Rótulo' }` (mapa plano) |
| `'acao'` | — | — | Centro | `{ actions: ActionDefinition[] }` (use `colunaAcao()`) |

### Exemplos

```ts
// Texto
coluna('nome', { type: 'texto', label: 'Nome do Produto' })

// Número com máscara
coluna('preco', { type: 'numero', label: 'Preço', mask: 'R$ #.##0,00' })

// Data (exibe DD/MM/AAAA automaticamente, pt-BR)
coluna('criadoEm', { type: 'data', label: 'Criado em' })

// Seleção (enum) — mapa plano valor → rótulo
coluna('status', {
  type: 'selecao',
  label: 'Status',
  options: { 1: 'Ativo', 2: 'Inativo', 3: 'Pendente' }
})

// Booleano (exibe "Sim"/"Nao" por padrão; customize com transform)
coluna('ativo', {
  type: 'booleano',
  label: 'Ativo',
  transform: (v) => (v ? 'Habilitado' : 'Desabilitado')  // opcional
})
```

---

## 4. FILTROS

Cada tipo de coluna tem operadores de filtro automáticos. Os inputs são renderizados pelo `<RsFilters>` dentro da tabela.

### Operadores por tipo

Os operadores do Core são em português. O primeiro da lista é o padrão usado pelos inputs do `<RsFilters>`.

| Tipo | Operadores |
|---|---|
| `texto` | `contem` (contém), `igual`, `comeca_com`, `termina_com` |
| `numero` | `=`, `>`, `<`, `>=`, `<=`, `entre` |
| `data` / `data-hora` | `entre`, `antes`, `depois`, `igual` |
| `booleano` | `igual` |
| `selecao` | `igual` |

> **Nota:** ao usar o `LaravelAdapter`, esses operadores são traduzidos automaticamente para a URL: `contem`→`like`, `igual`/`=`→`eq`, `>`→`gt`, `<`→`lt`, `>=`→`gte`, `<=`→`lte`, `entre`→`between`, `antes`→`before`, `depois`→`after`, `comeca_com`→`starts_with`, `termina_com`→`ends_with`. No seu código Vue/TS, use sempre os nomes do Core.

### API programática

Para aplicar filtro via código:

```ts
import { RsTable } from '@rsdata/core'
import { useRsTable } from '@rsdata/nuxt'

const tabela = new RsTable({ columns }) // instância do Core
tabela.usarAdapter(adapter)

const { filtrar } = useRsTable(tabela)

filtrar({ column: 'nome', operator: 'contem', value: 'coca' })
filtrar({ column: 'preco', operator: '>', value: 10 })
filtrar({ column: 'status', operator: 'igual', value: 1 }) // valor bruto, não o rótulo

// Remover filtro: value vazio ou null
filtrar({ column: 'nome', operator: 'contem', value: '' })
```

---

## 5. ORDENAÇÃO

O cabeçalho da tabela é clicável. Cada clique alterna entre `asc`, `desc` e sem ordenação.

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
const { irParaPagina, setPageSize, getEstado } = useRsTable(tabela)

irParaPagina(3)
setPageSize(50)

const estado = getEstado()
// { page: 3, pageSize: 50, total: 200, totalPages: 4, rows: [...], ... }
```

---

## 7. ACTIONS (BOTÕES DE AÇÃO)

Colunas do tipo `'acao'` renderizam botões por linha. A RSdata emite um evento com `{ key, row }` — a lógica de execução é 100% sua. *"A RSdata é o transportador; você traz a arma."*

### Definindo actions

```ts
import { coluna } from '@rsdata/core'
import { colunaAcao } from '@rsdata/nuxt'

const colunas = [
  coluna('id', { type: 'numero', label: 'ID' }),
  coluna('nome', { type: 'texto', label: 'Nome' }),
  colunaAcao('acoes', {
    label: 'Ações',
    actions: [
      { key: 'editar', label: 'Editar' },
      { key: 'excluir', label: 'Excluir', danger: true },
    ],
  }),
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
  // row.raw contém o dado bruto da linha

  if (key === 'editar') {
    router.push(`/produtos/${row.raw.id}/editar`)
  } else if (key === 'excluir') {
    confirmarExclusao(row.raw.id)
  }
}
</script>
```

### Visual

- **1 ação:** botão direto na linha
- **2+ ações:** ícone ⋯ que abre um dropdown com as opções
- **Ação `danger: true`:** texto vermelho no dropdown

---

## 8. ADAPTERS (DE ONDE VÊM OS DADOS)

### 8.1 LocalAdapter (array em memória)

Para protótipos, testes ou dados que já estão no frontend.

```ts
import { LocalAdapter } from '@rsdata/core'

const adapter = new LocalAdapter([
  { id: 1, nome: 'Coca-Cola', preco: 5.99 },
  { id: 2, nome: 'Pepsi',     preco: 4.99 },
])

<RsTable :columns="colunas" :adapter="adapter" />
```

Filtra, ordena e pagina no navegador. Ideal para até ~500 linhas.

### 8.2 LaravelAdapter (servidor)

Para produção: o servidor filtra, ordena e pagina. O navegador só exibe.

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

#### O que o backend precisa retornar

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

- `data` (obrigatório): array de linhas
- `meta.total` (obrigatório): total de registros. Se ausente, procura `total` na raiz

#### Exemplo de controller Laravel

```php
// app/Http/Controllers/ProdutoController.php
public function index(Request $request)
{
    $query = Produto::query();

    // Filtros
    foreach ($request->input('filter', []) as $coluna => $operadores) {
        foreach ($operadores as $operador => $valor) {
            match ($operador) {
                'gt'      => $query->where($coluna, '>', $valor),
                'gte'     => $query->where($coluna, '>=', $valor),
                'lt'      => $query->where($coluna, '<', $valor),
                'lte'     => $query->where($coluna, '<=', $valor),
                'eq'      => $query->where($coluna, $valor),
                'like'    => $query->where($coluna, 'like', "%{$valor}%"),
                'between' => $query->whereBetween($coluna, $valor),
                default   => null,
            };
        }
    }

    // Ordenação
    if ($sort = $request->input('sort')) {
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');
        $query->orderBy($column, $direction);
    }

    return $query->paginate($request->input('per_page', 20));
}
```

### 8.3 Criando seu próprio adapter

Implemente a interface `DataAdapter`:

```ts
import type { DataAdapter, Query, FetchResult, Row, FilterOption } from '@rsdata/core'

class MeuAdapter implements DataAdapter {
  async fetch(query: Query): Promise<FetchResult> {
    // Recebe Query, retorna { rows, total }
  }

  async fetchAll(query: Query): Promise<Row[]> {
    // Mesmo que fetch, mas sem paginação
  }

  async fetchFilterOptions?(column: string): Promise<FilterOption[]> {
    // Opcional: retorna opções de dropdown para a coluna
  }
}
```

---

## 9. FALHE ALTO (VALIDAÇÃO DE DADOS)

A RSdata detecta dados inválidos automaticamente com base no tipo da coluna. Ex: `preco: "grátis"` onde o tipo é `numero`.

### Modo DEV (`:debug="true"`)

A tabela mostra a localização exata do erro. Útil durante desenvolvimento.

```vue
<RsTable :columns="colunas" :adapter="adapter" :debug="true" />
```

Exibe: ``Coluna `preco`, linha 42, esperava `numero`, recebeu `"grátis"` ``.

### Modo PRODUÇÃO (`:debug="false"` — padrão)

Ícone ⚠ sutil na célula. O usuário final não vê detalhes internos. A tabela continua funcionando.

### Capturando erros via código

```ts
const tabela = new RsTable({ columns })
tabela.on('erro', (erro) => {
  // erro: { column, rowIndex, expected, received }
  console.error(`Erro: coluna ${erro.column}, linha ${erro.rowIndex}, esperava ${erro.expected}`)
})
```

---

## 10. TEMA E ESTILIZAÇÃO

### Theme default

O CSS padrão é importado no plugin:

```ts
// plugins/rsdata.ts
import '@rsdata/nuxt/theme/default.css'
```

### Customização rápida (cores)

```css
:root {
  --rs-primary: #1c203f;   /* Azul escuro */
  --rs-accent:  #65ba88;   /* Verde água */
  --rs-light:   #cde9f2;   /* Azul claro */
  --rs-success: #66b32e;   /* Verde claro */
}
```

> **Guia completo de estilização:** `THEMING.md` — 3 níveis de customização, 70+ variáveis CSS, galeria de 4 exemplos prontos, tema do zero passo a passo, modo escuro customizável.

### Modo escuro

Dois mecanismos, ambos suportados:

1. **Preferência do SO:** detecta automaticamente `prefers-color-scheme: dark`
2. **Classe `.dark` no `<html>`:** compatível com Tailwind `darkMode: 'class'`

---

## 11. PREFERÊNCIAS PERSISTENTES

Prop `persistencia` salva em `localStorage`:

```vue
<RsTable :columns="colunas" :adapter="adapter" persistencia="minha-tabela" />
```

O que é salvo: ordem das colunas, colunas visíveis, tamanho da página.

**É opt-in explícito** — sem a prop, nada é salvo. Cada tabela deve ter uma chave única.

---

## 12. API COMPLETA

### `@rsdata/core` — exportações principais

| Export | Tipo | Descrição |
|---|---|---|
| `RsTable` | Classe | Instância viva do Data Engine |
| `coluna(key, config)` | Função | Criar definição de coluna |
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
| `.getLinhas()` | Linhas da página atual (transformadas) |
| `.getTotal()` | Total de registros |
| `.getEstado()` | Snapshot completo do estado |
| `.esconderColuna(key)` | Esconder coluna |
| `.mostrarColuna(key)` | Mostrar coluna |
| `.reordenarColunas([...keys])` | Reordenar colunas visíveis |
| `.getOpcoesFiltro(column)` | Opções de dropdown do adapter |
| `.on('dados:carregados', fn)` | Evento: dados carregados |
| `.on('erro', fn)` | Evento: erro (Falhe Alto) |
| `.on('estado:alterado', fn)` | Evento: mudança de estado |

### `@rsdata/nuxt` — exportações principais

| Export | Tipo | Descrição |
|---|---|---|
| `RsData` | Plugin Vue | `app.use(RsData)` |
| `useRsTable(tabela)` | Composable | Ponte Core ↔ Vue |
| `RsDataTable` | Componente | Componente principal (`<RsTable>`) |
| `RsThead` | Componente | Cabeçalho clicável |
| `RsTbody` | Componente | Corpo da tabela |
| `RsActions` | Componente | Botões de ação |
| `RsPagination` | Componente | Controles de paginação |
| `RsFilters` | Componente | Inputs de filtro |
| `colunaAcao()` | Função | Helper para coluna de ação |
| `lerPreferencias()` | Função | Restaurar preferências do localStorage |
| `salvarPreferencias()` | Função | Persistir preferências no localStorage |

### Props do `<RsTable>`

| Prop | Tipo | Default | Descrição |
|---|---|---|---|
| `columns` | `ColumnDefinition[]` | — | Definição das colunas |
| `adapter` | `DataAdapter` | — | Fonte de dados |
| `pageSize` | `number` | `20` | Itens por página |
| `debug` | `boolean` | `import.meta.env.DEV` | Modo Falhe Alto dev |
| `persistencia` | `string` | — | Chave localStorage (opt-in) |

### Eventos do `<RsTable>`

O componente emite **um único evento**:

| Evento | Payload | Quando |
|---|---|---|
| `@action` | `{ key: string, row: TransformedRow }` | Clique em action |

Os demais eventos são da **instância Core** (`RsTable`), via `tabela.on(...)` — use o modo controle total (`:tabela="tabela"`) para acessá-los:

| Evento (Core) | Payload | Quando |
|---|---|---|
| `dados:carregados` | `TransformedRow[]` | Dados carregados |
| `erro` | `ValidationError` | Falhe Alto |
| `estado:alterado` | `RsTableState` | Estado mudou |

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
import { coluna, LaravelAdapter } from '@rsdata/core'
import { colunaAcao } from '@rsdata/nuxt'

const colunas = [
  coluna('id',       { type: 'numero',  label: 'ID' }),
  coluna('nome',     { type: 'texto',   label: 'Produto' }),
  coluna('preco',    { type: 'numero',  label: 'Preço', mask: 'R$ #.##0,00' }),
  coluna('estoque',  { type: 'numero',  label: 'Estoque' }),
  coluna('status',   { type: 'selecao', label: 'Status', options: {
    1: 'Ativo', 2: 'Inativo', 3: 'Pendente'
  }}),
  colunaAcao('acoes', {
    label: 'Ações',
    actions: [
      { key: 'editar',  label: 'Editar' },
      { key: 'excluir', label: 'Excluir', danger: true },
    ],
  }),
]

const adapter = new LaravelAdapter('https://api.seudominio.com/api/produtos', {
  headers: { Authorization: `Bearer ${token}` }
})

function handleAction({ key, row }) {
  if (key === 'editar')  router.push(`/produtos/${row.raw.id}`)
  if (key === 'excluir') confirmarExclusao(row.raw.id)
}
</script>
```

---

> **Documentos relacionados:** `ARCHITECTURE.md` (estrutura interna), `FEATURES.md` (funcionalidades por fase), `GLOSSARY.md` (termos).
