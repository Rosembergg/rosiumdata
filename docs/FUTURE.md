# FUTURE.md — RSdata

> **O que está planejado para além da v1.0.** Visões de longo prazo, ideias em aberto, direções possíveis e decisões conscientemente adiadas.  
> Nada aqui é compromisso — é direção. Sujeito a mudança conforme o projeto evoluir.

---

## MULTI-FRAMEWORK

A arquitetura headless foi desenhada exatamente para isso: o Core não sabe qual framework está usando.

### Casca React (`@rosiumdata/react`)
**Visão:** um pacote que importa `@rosiumdata/core` e fornece componentes e hooks React equivalentes ao que `@rosiumdata/nuxt` faz hoje com Vue.
**Quando:** quando houver demanda real (usuários React pedindo) ou quando o autor quiser validar a universalidade do Core.
**Esforço:** médio. O Core não muda. É "só" escrever a casca — componentes, hooks, conexão de reatividade.

### Casca Vue vanilla (`@rosiumdata/vue`)
**Visão:** mesma lógica do Nuxt, mas sem a dependência de Nuxt — funciona em qualquer projeto Vue 3 (Vite, Vue CLI, etc.).
**Quando:** quando houver demanda de usuários Vue que não usam Nuxt.

### Web Component (`<rs-table>`)
**Visão:** um elemento HTML nativo que funciona em **qualquer** framework — ou sem framework nenhum. É a promessa mais forte de universalidade.
**Desafios:** estilização encapsulada (Shadow DOM), passar dados complexos (objetos, arrays) via atributos HTML é limitado, experiência de uso menos "nativa" para devs de cada framework.
**Quando:** a reavaliar. O Core headless já é a garantia de que isso é possível — a decisão de *fazer* depende de demanda e maturidade dos Web Components.

### Outras linguagens (backend)
**Visão:** o Core, sendo lógica pura em TypeScript, pode ser portado para outras linguagens mantendo a mesma arquitetura e contrato. Ex: um `RSdata Core` em PHP, Python ou Go que alimenta o frontend com o mesmo contrato de Adapter.
**Quando:** muito futuro. Depende do sucesso da versão JS/TS e de demanda concreta.
**Nota:** a arquitetura de camadas e o contrato do Adapter foram desenhados para serem portáveis — são conceitos, não implementações.

---

## PLUGINS E ECOSSISTEMA

### Exportação
- **CSV:** primeira prioridade pós-1.0. Implementação simples, sem dependência externa necessária.
- **Excel (.xlsx):** prioridade seguinte. Plugin com dependência externa (ex: `exceljs`), isolada por adapter de exportação.
- **PDF:** futuro distante. Depende de demanda.

### Seleção de linhas
Lógica de seleção (checkbox) já é prevista como Core. O visual é Render/Plugin. Permite ações em lote ("excluir selecionados", "exportar selecionados").

### Cache
Hoje a RSdata é stateless (toda mudança = nova consulta). Um sistema de cache pode reduzir chamadas ao servidor para dados já vistos. Desafios: invalidação (quando o dado mudou no servidor?), tamanho do cache, expiração.
**Quando:** só quando a necessidade for real e mensurável (lentidão percebida).

### Internacionalização (i18n)
Tradução dos textos da tabela: "Mostrando X de Y resultados", "Página anterior", "Nenhum registro encontrado", labels de filtro.
**Quando:** pós-1.0, quando o projeto começar a ter usuários não-lusófonos.

### Acessibilidade (a11y)
Navegação por teclado, atributos ARIA, suporte a leitores de tela, contraste adequado.
**Quando:** antes do lançamento OSS público (fase B). É requisito para ser uma lib séria.

### Temas pré-definidos
Hoje o Theme é um template default em CSS puro que o usuário sobrescreve. Temas prontos (Material, Bootstrap, etc.) contrariam a filosofia "não somos kit de UI", mas podem existir como **plugins opcionais da comunidade**, não como parte oficial da RSdata.
**Quando:** se a comunidade criar e mantiver. Não é prioridade do Core.

---

## ADAPTERS

### Adapters para bancos e APIs populares
Hoje o adapter-padrão é local (array) e o primeiro remoto será Laravel (projeto do autor). No futuro, adapters oficiais ou da comunidade para:
- **GraphQL** (Apollo, URQL)
- **REST genérico** (fetch/axios configurável)
- **Supabase**
- **Firebase / Firestore**
- **Prisma** (direto no backend)
- **APIs paginadas comuns** (Laravel paginator, Django REST, Spring Page)

### Adapter "zero-config"
Um adapter que "adivinha" a API por convenção — se o backend seguir um formato comum, funciona sem configurar nada. Seria o "resolve rápido" para o caso server-side.

---

## DECISÕES ADIADAS CONSCIENTEMENTE

Estas são as "portas de mão dupla" — decisões que tomamos o caminho mais simples hoje, mas mantemos a intenção de revisar:

| Decisão atual | Quando revisar | Possível evolução |
|---|---|---|
| Suporte só da última versão | Quando houver comunidade | LTS para versões selecionadas |
| GitHub Flow | Quando houver contribuidores | Git Flow com develop + release |
| Stateless (sem cache) | Quando performance for problema | Cache opcional como plugin |
| Sem drag-and-drop de colunas | Se houver demanda real | Reordenar via drag no Render |
| Sem edição inline | Se for pedido recorrente | Reavaliar (mas provavelmente não) |
| Nome RSdata | Antes do lançamento OSS público | Nome definitivo |
| Sem temas prontos | Se comunidade pedir | Plugins de tema mantidos pela comunidade |

---

## IDEIAS EM ABERTO (NÃO DECIDIDAS)

Funcionalidades mencionadas ou imaginadas, mas sem decisão:

- **Virtualização de linhas:** para tabelas com milhares de linhas no modo client-side (renderizar só o visível).
- **Modo "denso" vs "confortável":** variante de espaçamento do tema (mais informação vs. mais respiro).
- **Sticky header:** cabeçalho fixo ao rolar a página.
- **Largura de coluna ajustável:** redimensionar arrastando a borda (outra forma de drag, mas mais útil que reordenar).
- **Salvar estado do usuário:** lembrar filtros, ordenação e colunas visíveis no localStorage.
- **Modo escuro automático:** detector de `prefers-color-scheme` do navegador.

---

## MARCOS DE LONGO PRAZO

| Marco | O que significa |
|---|---|
| **v1.0** | MVP: RSdata funcionando no projeto real do autor (Laravel DDD). |
| **v1.x** | Exportação CSV/Excel, seleção de linhas. Lib usável para além do autor. |
| **v2.0** | Primeiro Render Engine alternativo (React ou Web Component). Prova de que o Core é verdadeiramente headless. |
| **v3.0** | Ecossistema: plugins da comunidade, múltiplos adapters, documentação madura. |
| **Além** | Referência em arquitetura de Data Grid. A lib que acertou a separação de responsabilidades. |

---

## RISCOS DO FUTURO

- **Abandono por falta de tempo:** o autor tem demandas variáveis. O projeto pode ficar parado por períodos.
- **Complexidade acumulada:** cada feature nova adiciona superfície. O desafio é crescer sem virar o PowerGrid.
- **Comunidade não engajar:** o projeto resolve a dor do autor, mas pode não atrair outros. A fase B (OSS) depende de adoção externa.
- **Concorrência:** TanStack Table e AG Grid têm equipes, comunidades e anos de estrada.

---

> **Documentos relacionados:** `docs/ROADMAP.md` (fases e backlog), `docs/DECISIONS.md` (decisões adiadas), `docs/RISKS.md` (riscos), `VISION.md` (aspirações de longo prazo).
