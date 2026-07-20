# ARCHITECTURE.md — RSdata

> **Arquitetura completa do RSdata.** Como as camadas se relacionam, responsabilidades, fronteiras, contratos e regras invioláveis.

---

## VISÃO GERAL

A RSdata segue uma arquitetura de **4 camadas sequenciais** com uma quinta dimensão transversal (Plugins):

```
┌──────────────────────────────────────────────────────┐
│                     PLUGINS                          │
│  (exportação, futuros: impressão, i18n, etc.)        │
│  Pendurados em ganchos oficiais do Core              │
└──────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  DATA     │   │   DATA    │   │  RENDER   │   │           │
│  SOURCE   │──▶│  ENGINE   │──▶│  ENGINE   │──▶│   THEME   │
│ (Adapter) │   │  (Core)   │   │  (Nuxt)   │   │  (CSS)    │
└───────────┘   └───────────┘   └───────────┘   └───────────┘
    Mundo            JS puro         Vue/Nuxt        CSS puro
    externo         (headless)       (casca)         (pele)
```

### Regra fundamental

> **Cada camada só conhece a camada imediatamente abaixo.** Data Engine conhece o Adapter. Render conhece o Data Engine. Theme conhece o Render. Nenhuma camada "pula" outra. Nenhuma camada olha para cima.

---

## CAMADA 1 — DATA SOURCE (ADAPTER)

### Responsabilidade

Traduzir o mundo externo para o formato que o Core entende. É a **fronteira** entre a RSdata e qualquer fonte de dados.

### O que faz
- Recebe pedidos do Data Engine no contrato padrão da RSdata.
- Traduz esses pedidos para a "língua" do mundo externo (API REST, GraphQL, array local).
- Entrega os dados de volta no formato plano que o Core espera.
- **Filtro de sujeira:** relação entre tabelas, dados aninhados, formato de request/response — tudo isso é tratado AQUI e nunca chega ao Core.

### O que NÃO faz
- **Nunca altera dados** (read-only). A RSdata não escreve, edita ou deleta.
- **Nunca sabe** como os dados serão desenhados (Render) ou estilizados (Theme).
- **Nunca sabe** o estado da tabela (filtros ativos, página atual) — quem coordena isso é o Data Engine.

### O Adapter como conceito central

> **Tudo é adapter.** A RSdata nunca sabe de onde vêm os dados. Seja um servidor Laravel, uma API GraphQL, ou um array de 20 itens na memória — para a RSdata é sempre a mesma coisa: *"adapter, me dê os dados com este filtro/ordenação/página"*.

- **Adapter local:** filtra/ordena/pagina um array na memória do navegador.
- **Adapter remoto (server-side):** delega filtro/ordenação/paginação ao servidor.
- **Mesmo contrato, mesmo modelo mental, um único caminho no Core.**

### Modelo híbrido
- A RSdata vem com um **adapter-padrão embutido** (local, array) — funciona out-of-the-box.
- O dev pode **trocar por um adapter customizado** (ex: adapter para Laravel, para GraphQL, para qualquer backend).
- Trocou de backend? Troca o adapter. A tabela inteira continua idêntica.

### Servidor-side por padrão
A prioridade arquitetural é **server-side** — o servidor filtra, ordena e pagina. Isso protege o navegador do usuário final (sem travamento com 100 mil linhas). O adapter local existe para o caso simples ("só mostrar 20 itens").

### Contrato do Adapter (interface)

Todo adapter implementa esta interface:

```ts
interface DataAdapter {
  /** Buscar dados paginados com filtro e ordenação */
  fetch(query: Query): Promise<FetchResult>

  /** Buscar todos os dados que batem com os filtros (para exportação) */
  fetchAll(query: Query): Promise<Row[]>

  /** Buscar opções disponíveis para um filtro (dropdown de categorias, etc.) */
  fetchFilterOptions?(column: string): Promise<FilterOption[]>
}

interface Query {
  filters: Filter[]
  sort?: { column: string; direction: 'asc' | 'desc' }
  page: number
  pageSize: number
}

interface FetchResult {
  rows: Row[]       // dados planos (flat)
  total: number     // total rows (for pagination)
}

type Row = Record<string, unknown>  // { id: 1, nome: "Coca", preco: 5.99 }
```

### Dado sempre plano (flat)

> A RSdata trabalha exclusivamente com dados planos. Se o dado vem aninhado (`categoria: { nome: "Bebidas" }`), é o **adapter** quem achata (`categoria_nome: "Bebidas"`) antes de entregar ao Data Engine. O Core **nunca** navega em objetos aninhados.

---

## CAMADA 2 — DATA ENGINE (CORE)

### Responsabilidade

O **cérebro** da RSdata. Gerencia o estado da tabela, transforma dados e coordena a comunicação entre o Adapter e o Render Engine.

### O que faz
- **Estado da tabela:** filtros ativos, ordenação atual, página visível, definição de colunas (tipos, visibilidade, ordem).
- **Transformação de DADO:** `1 → "Ativo"`, `nome+sobrenome`, máscaras de valor. Afeta valor lógico, não visual.
- **Coordenação:** quando o estado muda, pede novos dados ao Adapter e avisa o Render.
- **Validação (Falhe Alto):** detecta dado imperfeito e denuncia com localização exata.
- **Eventos:** emite eventos para o Render e Plugins ("dados carregados", "erro", "estado alterado").

### O que NÃO faz
- **Nunca sabe** *como* os dados são desenhados na tela (Render Engine).
- **Nunca sabe** *de onde* vêm os dados (Adapter).
- **Nunca sabe** qual framework está sendo usado (headless — JS puro).
- **Nunca aplica estilo visual** (Theme).

### Modelo: Instância viva com eventos

O Data Engine é uma classe com estado mutável que emite eventos:

```ts
const table = new RsTable({ columns: [...] })
table.useAdapter(adapter)

// State
table.filter({ column: 'price', operator: '>', value: 50 })
table.sort('name', 'asc')
table.goToPage(2)

// Reading
table.getRows()    // current page rows (transformed)
table.getTotal()   // total rows
table.getState()   // full state snapshot

// Columns
table.hideColumn('id')
table.showColumn('id')
table.reorderColumns(['name', 'price', 'status'])

// Events
table.on('data:loaded', (rows) => { ... })
table.on('error', (err) => { ... })           // Fail Loud
table.on('state:changed', (state) => { ... })
```

### A Linha Sagrada (Dado × Apresentação)

Esta é a fronteira mais importante de toda a arquitetura:

| | Transformação de DADO | Transformação de APRESENTAÇÃO |
|---|---|---|
| **Exemplo** | `1 → "Ativo"`, `100 → "R$ 100,00"` (valor) | Verde, negrito, alinhamento, ícone |
| **Onde vive** | Data Engine | Theme / Render Engine |
| **Afeta filtro?** | Sim | Não |
| **Afeta ordenação?** | Sim | Não |
| **Afeta exportação?** | Sim (vai para Excel/CSV) | **NUNCA** |
| **Pode ser sobrescrita?** | Sim, por coluna | Sim, por CSS ou substituição de componente |

> **A exportação recebe o valor transformado pelo Data Engine, ZERO do Render/Theme.** O Excel recebe `"Ativo"` texto puro, sem cor. Fim do vazamento de estilo.

### Valor: dois aspectos separados

Cada coluna guarda:
- **Valor real** (`100`, número): usado para filtro, ordenação e **exportação** (valor calculável).
- **Receita de exibição** (`"R$ #.##0,00"`): instrução de *como mostrar* na tela. Separada do valor real.

**Exportação, por padrão:** manda o valor calculável (`100`).
**Override por coluna:** o dev pode marcar uma coluna para exportar como texto formatado (CPF `123.456.789-00`, código `00042` — onde o número puro corromperia o dado).

### Colunas e Tipos

> **Tipo de coluna = pacote de comportamento pronto.** Declarar uma coluna como `data`, `número`, `texto` traz automaticamente: operadores de filtro adequados, ordenação correta, alinhamento padrão e validação de dados. Tudo **sobrescrevível**.

**Tipos do dia 1:**

| Tipo | Filtro padrão | Ordenação | Validação (Falhe Alto) | Alinhamento padrão |
|---|---|---|---|---|
| `texto` | contém, igual, começa com | Alfabética | Deve ser string | Esquerda |
| `numero` | =, >, <, entre | Numérica | Deve ser número | Direita |
| `data` / `data-hora` | Entre (intervalo) | Cronológica | Deve ser data válida | Centro |
| `booleano` | Igual (2 opções) | — | — | Centro |
| `selecao` | Igual (dropdown) | Pelo valor de exibição | Deve estar entre as opções | Esquerda |
| `acao` | — | — | — | Centro |

```ts
// Example column definition
const columns = [
  column('name',    { type: 'text' }),
  column('price',   { type: 'number', mask: 'R$ #,##0.00' }),
  column('status',  { type: 'select', options: { entries: { 1: 'Active', 2: 'Inactive' } } }),
  column('createdAt', { type: 'date' }),
  column('actions', { type: 'action' }),
]
```

### Reatividade própria (sem Vue)

O Data Engine é JavaScript/TypeScript puro. Sua "reatividade" é um sistema de eventos simples (observer pattern). A casca Nuxt (Render Engine) escuta esses eventos e os conecta à reatividade do Vue.

---

## CAMADA 3 — RENDER ENGINE (CASCA)

### Responsabilidade

Desenhar a **estrutura visual** da tabela: linhas, células, cabeçalho, corpo, paginação, dropdown de filtro. É a única camada que conhece o framework de interface.

### O que faz
- Renderiza a tabela com componentes do framework (hoje Nuxt/Vue).
- Conecta a reatividade do Vue aos eventos do Data Engine (via `useRsTable()` composable).
- Gerencia comportamento visual: cabeçalho clicável (ordenação), dropdown de filtro, paginação.
- Exibe os botões de **Action** (gatilho) — renderiza o botão, emite evento com o dado da linha.
- Recebe o Theme e aplica classes/estilos.

### O que NÃO faz
- **Nunca** transforma dados (isso é Data Engine).
- **Nunca** se comunica diretamente com o Adapter.
- **Nunca** define cores, fontes ou espaçamentos (isso é Theme).

### Headless

> O Render Engine é a **casca** que veste o cérebro (Core). O Core é JavaScript puro — funciona em qualquer lugar. O Render Engine conhece o framework (Nuxt/Vue hoje). Portar para React no futuro = criar `packages/react/` com uma nova casca, mantendo `@rsdata/core` **intacto**.

```
@rsdata/core (JS puro, zero-dep)
        │
        ├── @rsdata/nuxt (casca Vue/Nuxt)     ← HOJE
        ├── @rsdata/react (casca React)        ← futuro
        └── @rsdata/web-component (HTML puro)  ← futuro
```

### Actions (botão gatilho)

> A RSdata oferece o **ponto de ação** (botão renderizado na linha) e **emite um evento** com o dado da linha. A lógica é 100% do usuário. A RSdata nunca sabe o que a action faz — ela é o **transportador**, o usuário traz a **arma**. Actions vivem no Render Engine (é sobre exibir o botão e capturar o clique), mas emitem eventos para fora.

---

## CAMADA 4 — THEME (PELE)

### Responsabilidade

A **aparência** visual: cores, fontes, espaçamentos, bordas, sombras. A pele que veste o esqueleto (Render).

### O que faz
- Define o visual padrão da tabela via CSS puro próprio (template default).
- Expõe uma estrutura de classes previsível para sobrescrita.
- Permite substituição total por componente (escape hatch).

### O que NÃO faz
- **Nunca** altera a estrutura da tabela (número de colunas, posição de elementos).
- **Nunca** toca nos dados.
- **Nunca** depende de Tailwind, Bootstrap ou qualquer framework CSS externo.

### Template padrão

A RSdata vem com um **theme default em CSS puro próprio**, zero dependências. Funciona sozinho. O usuário pode:
- **Sobrescrever classes CSS** (nível leve — ajusta cor, fonte, borda).
- **Substituir componentes inteiros** (nível pesado — troca a renderização de uma célula ou cabeçalho).

A RSdata **não conhece** Tailwind ou qualquer ferramenta CSS. Se o usuário quiser usar Tailwind, ele aplica por conta própria — a estrutura de classes é previsível e estilizável.

---

## PLUGINS (DIMENSÃO TRANSVERSAL)

### Responsabilidade

Funcionalidades opcionais que estendem a RSdata sem inchar o Core.

### O que são
- Funcionalidades que **não são essenciais** para a tabela existir.
- Onde vivem **dependências externas** (ex: lib de Excel).
- Conectam-se ao Core via **ganchos oficiais** (hooks/eventos).

### O que NÃO são
- **Não** residem no Core.
- **Não** podem corromper dados nem quebrar a Linha Sagrada.
- **Não** são conhecidos pelo Core — o Core expõe ganchos genéricos, não sabe quais plugins existem.

### Mecanismo de extensibilidade

> O Core expõe **pontos de encaixe oficiais** (hooks/eventos). O plugin se pendura nesses pontos. Se amanhã surgir um plugin novo, ele usa os **mesmos ganchos** — o Core não muda nada. Se falta um gancho, isso é **bug de design** (Princípio #2) — a solução é criar o gancho oficial.

### Plugins previstos

| Plugin | Status | Dependência externa? |
|---|---|---|
| Exportação (Excel/CSV) | Pós-1.0 | Sim (lib de .xlsx, via adapter) |
| Seleção de linhas | Pós-1.0 (lógica é Core, visual é plugin/Render) | Não |
| Cache de dados | Futuro | Não |

---

## CORE VS PLUGIN: A FRONTEIRA

| Core (`@rsdata/core`, zero-dep) | Plugin (bordas) |
|---|---|
| Mostrar dados em linhas/colunas | Exportação (Excel/CSV) |
| Ordenação | |
| Filtros | |
| Paginação | |
| Definição de colunas e tipos | |
| Transformação de dado (Linha Sagrada) | |
| Falhe Alto (validação) | |
| Actions (lógica do gatilho) | |
| Ordem/visibilidade de colunas (lógica) | |
| Sistema de eventos | |
| Interface do Adapter | |

> **A fronteira Core/Plugin coincide naturalmente com a fronteira sem-dependência/com-dependência.** Tudo que é Core é JS puro e não depende de nada externo. Tudo que tem dependência externa vive como Plugin.

---

## FORA DE ESCOPO (DECISÕES CONSCIENTES)

| Item | Decisão | Justificativa |
|---|---|---|
| Escrita/edição de dados | Fora de escopo. RSdata é read-only. | CRUD é responsabilidade do sistema do usuário. |
| Drag-and-drop de colunas | Fora de escopo. Adiado indefinidamente. | Luxo visual, caro de implementar, não serve à dor central. |
| Dado aninhado no Core | Fora de escopo. Adapter achata. | Mantém o Core simples e universal. |
| Cache de dados (dia 1) | Fora de escopo. Stateless. | Complexidade prematura. Refinamento futuro. |
| Gráficos/charts/dashboards | Fora de escopo. | Foco é grade/tabela. "Pra isso já existe Power BI." |

---

## REGRAS INVioláveis

1. **O Core NUNCA tem dependências externas de runtime.** Zero. Comprovável pelo `package.json` de `@rsdata/core`.
2. **A Linha Sagrada NUNCA é quebrada.** Estilo não vaza para dado. Dado não carrega estilo.
3. **Nenhuma camada "pula" outra.** Data Engine não chama o Render diretamente. O fluxo é sempre Adapter → Engine → Render → Theme.
4. **Nenhum release sai com dívida técnica.** Soluções temporárias (caminho A) não sobrevivem a um release.
5. **Nada de mágica.** Todo comportamento é visível no código de uso.

---

## ESTRUTURA DO REPOSITÓRIO

```
RSdata/
├── packages/
│   ├── core/                   ← @rsdata/core (JS puro, zero-dep)
│   │   └── src/
│   │       ├── engine/         ← Data Engine (RsTable, estado, eventos)
│   │       ├── columns/        ← Definição de colunas e tipos
│   │       ├── adapter/        ← Interface do adapter + adapter local
│   │       ├── filters/        ← Lógica de filtro e operadores
│   │       ├── sorting/        ← Lógica de ordenação
│   │       ├── pagination/     ← Lógica de paginação
│   │       ├── validation/     ← Falhe Alto (validação por tipo)
│   │       ├── events/         ← Sistema de eventos (observer)
│   │       └── index.ts        ← API pública
│   │
│   └── nuxt/                   ← @rsdata/nuxt (casca Vue/Nuxt)
│       └── src/
│           ├── components/     ← RsTable, RsColumn, etc.
│           ├── composables/    ← useRsTable() — conecta Core ao Vue
│           ├── theme/          ← CSS puro (template default)
│           └── index.ts        ← Plugin Nuxt
│
├── docs/                       ← Documentação (PRINCIPLES, ARCHITECTURE, etc.)
├── .ai/                        ← Guias, regras e índice para IAs
│   ├── BRAIN.md                ← Índice inteligente (leia primeiro)
│   ├── AI_GUIDE.md             ← Regras para IAs desenvolvedoras
│   └── TEMPLATE.md             ← Templates de kickoff de fases
├── VISION.md                   ← Visão do projeto
├── CONTRIBUTING.md             ← Guia de contribuição
└── README.md                   ← Portal de entrada
```

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `VISION.md` (identidade), `docs/PRINCIPLES.md` (princípios), `docs/GLOSSARY.md` (termos).
