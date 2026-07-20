# FEATURES.md — rosiumdata

> **Funcionalidades da rosiumdata.** O que está planejado, em qual fase e com qual prioridade.

---

## MVP (v1.0)

Funcionalidades que estarão na primeira versão estável. Organizadas por fase.

### Fase 1 — Data Engine + Colunas + Tipos

| Feature | Descrição | Prioridade |
|---|---|---|
| **RsTable (instância viva)** | Classe principal com estado mutável e eventos | Essencial |
| **Definição de colunas** | API declarativa para definir colunas com nome, tipo e opções | Essencial |
| **Tipo: texto** | Filtro "contém", ordenação alfabética, alinhamento esquerda, validação string | Essencial |
| **Tipo: número** | Filtro =, >, <, entre; ordenação numérica; alinhamento direita; validação numérica | Essencial |
| **Tipo: data / data-hora** | Filtro por intervalo; ordenação cronológica; validação de data; máscara configurável | Essencial |
| **Tipo: booleano** | Filtro de duas opções; alinhamento centro | Essencial |
| **Tipo: seleção/enum** | Filtro dropdown; valores mapeados (1→Ativo); ordenação pelo valor de exibição | Essencial |
| **Filters** | Explicit API: `.filter({ column, operator, value })` | Essential |
| **Sorting** | `.sort(column, 'asc'|'desc')` | Essential |
| **Pagination** | `.goToPage(n)` + `.getTotal()` | Essential |
| **Visible state** | `.getRows()`, `.getState()` — full snapshot for debug/plugins | Essential |
| **Transformação de dado** | `1 → "Ativo"`, formatação de valor (Linha Sagrada lado dado) | Essencial |
| **Valor real + máscara** | Cada coluna guarda valor calculável + receita de exibição separados | Essencial |
| **Falhe Alto** | Detecção de dado imperfeito com localização exata (coluna+linha+esperado vs. recebido) | Essencial |
| **Event system** | `.on('data:loaded')`, `.on('error')`, `.on('state:changed')` | Essential |
| **Column management** | `.hideColumn()`, `.showColumn()`, `.reorderColumns()` | Essential |
| **Interface do Adapter** | Contrato TypeScript (`DataAdapter`) que todo adapter implementa | Essencial |

### Fase 2 — Adapter Local

| Feature | Descrição | Prioridade |
|---|---|---|
| **LocalAdapter** | Adapter que filtra/ordena/pagina array em memória | Essencial |
| **Filtro local** | Todos os operadores dos tipos suportados executados no navegador | Essencial |
| **Ordenação local** | Ordenação de array por coluna e direção | Essencial |
| **Paginação local** | Fatiamento do array por página | Essencial |

### Fase 3 — Render Engine Nuxt + Theme Default

| Feature | Descrição | Prioridade |
|---|---|---|
| **useRsTable()** | Composable Vue que conecta instância RsTable à reatividade do Vue | Essencial |
| **`<RsTable>`** | Componente principal que renderiza a tabela completa | Essencial |
| **Cabeçalho clicável** | Header com ordenação ao clicar | Essencial |
| **Corpo da tabela** | Renderização de linhas e células com dados transformados | Essencial |
| **Paginação visual** | Controles de página (anterior, próximo, números) | Essencial |
| **Filtros visuais** | Inputs/dropdowns renderizados por tipo de coluna | Essencial |
| **Theme default** | CSS puro próprio, zero dependências, funcional out-of-the-box | Essencial |
| **Estrutura de classes** | Classes CSS previsíveis para sobrescrita pelo usuário | Essencial |
| **Plugin Nuxt** | Instalação via `app.use(RsTable)` | Essencial |

### Fase 4 — Actions + Falhe Alto integrado

| Feature | Descrição | Prioridade |
|---|---|---|
| **Coluna tipo ação** | Renderiza botão configurável por linha | Essencial |
| **Evento de action** | Emite evento com o dado da linha no clique | Essencial |
| **Múltiplas actions** | Suporte a mais de um botão por linha | Essencial |
| **Falhe Alto visual (dev)** | Em dev: mensagem visível com localização exata do erro | Essencial |
| **Falhe Alto visual (prod)** | Em produção: estado de erro na célula sem derrubar a tela | Essencial |

### Fase 5 — Adapter Server-side (Laravel)

| Feature | Descrição | Prioridade |
|---|---|---|
| **ServerAdapter (HTTP)** | Adapter base que faz requisições HTTP para backend | Essencial |
| **Tradução Query → Request** | Converte o contrato Query da rosiumdata em parâmetros de API | Essencial |
| **Parsing Response → Flat** | Converte resposta do servidor em dado plano para o Core | Essencial |
| **Opções de filtro remotas** | Busca opções de dropdown do servidor | Essencial |

---

## PÓS-1.0 (BACKLOG)

### Exportação

| Feature | Descrição | Fase |
|---|---|---|
| **Exportação CSV** | Exportar dados filtrados (sem paginação) para CSV. Dados limpos, sem estilo. | Pós-1.0 |
| **Exportação Excel (.xlsx)** | Exportar para Excel com valor calculável. Plugin com dependência externa isolada. | Pós-1.0 |
| **Override de exportação por coluna** | Coluna pode ser marcada para exportar como texto formatado (CPF, código com zero) | Pós-1.0 |

### Dados

| Feature | Descrição | Fase |
|---|---|---|
| **Seleção de linhas** | Checkbox por linha + selecionar todas. Lógica no Core, visual no Render. | Pós-1.0 |
| **Cache de dados** | Memorizar resultados já buscados para evitar novas requisições. Opcional. | Futuro |
| **Polling / Refresh** | Atualização automática dos dados em intervalo configurável. | Futuro |

### Visual

| Feature | Descrição | Fase |
|---|---|---|
| **Substituição de componente** | Escape hatch: trocar o componente de uma célula/cabeçalho inteiro pelo do usuário. | Pós-1.0 (pode ser antecipado se necessário) |
| **Linhas expansíveis** | Expandir uma linha para mostrar detalhes extras (row detail). | Futuro |
| **Agrupamento de linhas** | Agrupar linhas por valor de coluna com subtotais. | Futuro |
| **Estado visual** | Loading, empty state ("nenhum registro encontrado"), error state. | Pós-1.0 |
| **Responsividade** | Colunas colapsam/adaptam em telas menores. | Futuro |
| **Tema escuro** | Variante dark do theme default. | Futuro |

### Multi-framework

| Feature | Descrição | Fase |
|---|---|---|
| **Casca React (`@rosiumdata/react`)** | Render Engine para React, usando o mesmo `@rosiumdata/core`. | Futuro |
| **Casca Web Component (`<rs-table>`)** | Render Engine como elemento HTML nativo — funciona em qualquer framework. | Futuro |
| **Casca Vue vanilla** | Render Engine para Vue puro (sem Nuxt). | Futuro |

### Extensibilidade

| Feature | Descrição | Fase |
|---|---|---|
| **Plugin de internacionalização (i18n)** | Tradução de textos da tabela (paginação, filtros, empty state). | Futuro |
| **Plugin de acessibilidade (a11y)** | Navegação por teclado, ARIA labels, leitores de tela. | Futuro |
| **Mais adapters oficiais** | Adapters prontos para GraphQL, Supabase, Firebase, etc. | Futuro |
| **Ganchos de ciclo de vida** | Hooks: `beforeFetch`, `afterFetch`, `beforeRender`, `afterRender`. | Pós-1.0 |

### Qualidade e DX

| Feature | Descrição | Fase |
|---|---|---|
| **TypeScript strict** | Modo strict do TypeScript ativado em todo o projeto. | Fase 0 |
| **Documentação de API** | Documentação gerada a partir dos tipos (TSDoc / API Reference). | Pós-1.0 |
| **Playground** | Ambiente online para testar a rosiumdata sem instalar nada. | Futuro |
| **Devtools** | Extensão/ferramenta para inspecionar estado, eventos e performance da tabela. | Futuro |

---

## NÃO TEREMOS (FORA DE ESCOPO)

| Feature | Motivo |
|---|---|
| Edição inline de células | rosiumdata é read-only. CRUD é do sistema do usuário. |
| Drag-and-drop de colunas | Luxo visual. "Bem depois, e só se precisar." |
| Fórmulas estilo Excel | "Para isso já existe Excel." Não somos planilha. |
| Gráficos e dashboards | Foco é grade/tabela. Não somos BI. |
| Temas prontos (catálogo) | Damos o mecanismo de estilização, não o catálogo. |
| Colaboração em tempo real | Fora de escopo. É outro produto. |

---

> **Documentos relacionados:** `docs/ROADMAP.md` (fases e prioridades), `VISION.md` (o que somos e não somos), `docs/ARCHITECTURE.md` (como as features se encaixam nas camadas).
