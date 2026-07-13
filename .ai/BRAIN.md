# BRAIN.md — RSdata

> **Índice inteligente do projeto.** Este documento resume todo o conhecimento construído sobre o RSdata.  
> Para detalhes completos, consulte os documentos individuais em `/docs/` e na raiz.  
> **Última atualização:** após conclusão das 5 etapas de discovery (Identidade, Filosofia, Arquitetura, Roadmap, Organização).

---

## IDENTIDADE

| Item | Definição |
|---|---|
| **Nome** | RSdata (provisório, pode mudar) |
| **O que é** | Framework Open Source de Data Grid / plataforma de manipulação e visualização de dados. Foco inicial: Nuxt 3. Futuro: agnóstico de framework/linguagem. |
| **Missão** | Dar ao desenvolvedor uma forma simples e robusta de tratar e exibir dados, sem acoplar dado, lógica, apresentação e estilo — mantendo controle total. |
| **Visão** | **Hoje:** resolver a própria dor (dogfooding, projeto Laravel → Nuxt DDD). **Amanhã:** produto Open Source concorrendo com TanStack Table / AG Grid. Critério de ouro: decisões de hoje não inviabilizam o amanhã público. |

**As 3 forças que fazem o RSdata existir:**
1. **Desacoplamento** — no PowerGrid, tudo (buscar, filtrar, estilizar, exportar) vive nas mesmas funções de construção. Cada pedido novo vira gambiarra empilhada. O estilo visual vaza para a exportação e corrompe o dado. A causa-raiz é o **acoplamento**, não falta de features.
2. **Manutenibilidade** — precisa ser *simples de manter* (não só de começar). Defaults inteligentes + escape hatches por camada.
3. **Soberania/Controle** — não depender de código de terceiros numa peça crítica do projeto DDD. Aplica-se também à própria lib: mínimo de dependências (se uma morrer, a RSdata não morre junto).

| Público | Descrição |
|---|---|
| **É público** | Devs que precisam resolver pedidos reais de tratamento de dados de um sistema — do caso simples ("só mostrar dados") ao completo (relações, filtros, exportação). Teste de fogo: o próprio autor (dev backend Laravel aprendendo Nuxt). |
| **NÃO é público** | #1 quem quer kit de UI/templates prontos • #2 quem quer visualização não-tabular (charts, BI, dashboards) • #3 quem quer planilha/Excel/fórmulas. *"Pra isso já existe Excel e Power BI."* |

| Diferencial | Detalhe |
|---|---|
| Separação radical de camadas | `Data Source → Data Engine → Render Engine → Theme` — cada uma com responsabilidade única |
| Soberania | Core = zero dependências. Dependências externas só nas bordas (plugins/adapters), isoladas e substituíveis |
| Dado íntegro | O mesmo dado serve tela, filtro e exportação **sem contaminação de estilo** |
| RSdata é a ponte | Exporta dado limpo para a pessoa de dados manipular no Excel/BI; não compete com eles |

| Estilização | Damos o **mecanismo** (Theme) + **um template padrão** funcional (CSS puro). Não damos catálogo de temas prontos. |

---

## VISÃO (resumo)

> Resolver a própria dor hoje (projeto DDD Laravel → Nuxt), com o olho no futuro Open Source.  
> **Regra de ouro:** cada decisão tomada agora precisa ser compatível com o "amanhã público".  
> **Estratégia:** dogfooding primeiro — a experiência real no próprio projeto valida a lib antes de abrir para o mundo.

→ Detalhes em: `VISION.md`

---

## PRINCÍPIOS (7)

| # | Princípio | Essência |
|---|---|---|
| 1 | **Dívida Consciente, nunca abandonada** | Pode fazer o rápido (A) para não deixar ninguém na mão, mas o correto (B) é obrigatório e **jamais sobrevive a um release**. Task do B registrada antes do A existir. |
| 2 | **A lib nunca força à gambiarra** | Se não existe caminho oficial para algo, é **bug de design nosso**. Sempre há uma "porta oficial" de extensão. |
| 3 | **Dependência Descartável** | Core = **zero dependências**. Dependências externas só nas bordas (plugins/adapters), isoladas por interface interna, substituíveis. Se a lib morre, troca-se o adapter. |
| 4 | **Híbrido / Progressive Disclosure** | Convenção por padrão (resolve rápido), configuração sempre possível (nunca fecha a porta do controle). Defaults inteligentes + escape hatches. |
| 5 | **Customização em 2 níveis, sem parede** | Sobrescreve a **peça** (coluna/célula/filtro) OU a **camada** inteira. Descer de nível é opcional e localizado. Nunca "tudo ou nada". |
| 6 | **Explícito acima de mágico** | Comportamento sempre visível no código de uso. O **código é a documentação primária**. Verbosidade honesta > automágica invisível. |
| 7 | **Falhe Alto no Dev, Seguro na Produção** | Dado imperfeito nunca é silencioso. Dev: grita com localização exata (coluna+linha+esperado vs. recebido). Produção: estado de erro visível na célula, não derruba a tela, reporta ao dev. |

**Versionamento:** SemVer (major quebra, minor adiciona, patch corrige). HOJE (solo): suporte só para a última versão. AMANHÃ (OSS): política revisável.

**Padrão de decisão:** "portas de mão dupla" — decide o simples para hoje, registra que pode mudar amanhã, sem se prender a perfeição prematura.

→ Detalhes em: `docs/PRINCIPLES.md`

---

## ARQUITETURA

### O fluxo completo

```
ADAPTER  → traduz o mundo externo (Laravel/API/array) em dado PLANO
   ↓  contrato: buscar(filtro, ordenação, página) → {linhas, total} · buscar-tudo(export) · opções-de-filtro
DATA ENGINE  → cérebro JS PURO (headless): estado (filtros/ordenação/página/colunas) + transformação de DADO
   ↓  avisa "dados novos" (reatividade própria, sem Vue)
RENDER ENGINE  → casca Nuxt/Vue: esqueleto + comportamento visual
   ↓
THEME  → pele (cor/fonte/espaço), CSS puro próprio, zero-dep
```

### Camadas

| Camada | Responsabilidade | O que NÃO faz |
|---|---|---|
| **Data Source / Adapter** | Traduz o mundo externo. Filtro de sujeira: relação, aninhamento, formato de API morrem aqui. Core só vê **dado plano**. | Nunca altera dados (read-only). |
| **Data Engine** | Maestro de estado. Gerencia filtros, ordenação, página, colunas. Dona da **transformação de DADO**. | Nunca sabe *como* desenhar (Render) nem *de onde* vêm os dados (adapter). |
| **Render Engine** | Esqueleto + comportamento visual. Única camada que conhece o framework (hoje Nuxt). | Não toca no dado. Não sabe de onde ele vem. |
| **Theme** | Pele (cor, fonte, espaçamento, borda). CSS puro próprio. | Não altera estrutura, não toca no dado. |

### A Linha Sagrada (Dado × Apresentação)

> **Transformação de DADO** (`1 → "Ativo"`, máscara de valor) vive no **Data Engine**. Afeta valor, filtro, ordenação e **vai para a exportação**.
> **Transformação de APRESENTAÇÃO** (verde, negrito, alinhamento) vive no **Theme/Render** e **NUNCA** contamina o dado nem a exportação.
> A exportação recebe o valor transformado pelo Data Engine, **ZERO** do Render/Theme.

**Valor:** cada coluna guarda **valor real** (para export/filtro/ordenação) + **receita de exibição** (máscara) separados. Exportação = valor calculável por padrão; **override por coluna** para texto formatado (CPF, códigos com zero à esquerda).

### Headless

> **Cérebro (Data Source + Data Engine) = JavaScript puro, zero framework.** Funciona em qualquer lugar.
> **Render Engine = única casca que conhece o framework** (hoje Nuxt/Vue).
> Portar para React/Web Component no futuro = escrever nova casca, mantendo o cérebro **intacto**.

### Core vs Plugin

| Core (JS puro, zero-dep) | Plugin (bordas, onde vivem deps externas) |
|---|---|
| Exibir dados | Exportação (Excel/CSV) |
| Ordenação, Filtros, Paginação | |
| Seleção de linhas | |
| Actions (botão gatilho) | |
| Reordenar/esconder colunas (lógica) | |

> Fronteira Core/Plugin **coincide naturalmente** com a fronteira sem-dependência/com-dependência.

### Colunas e Tipos

**Tipo = pacote de comportamento pronto.** Declarar uma coluna como `data`, `número`, `texto` traz automaticamente: operadores de filtro, ordenação correta, alinhamento padrão e validação. Tudo sobrescrevível.

**Tipos do dia 1:** `texto`, `número`, `data`/`data-hora`, `booleano`, `seleção`/`enum`, `ação`.

### Extensibilidade

O Core expõe **ganchos oficiais** (hooks/eventos). Plugins se penduram; o Core não conhece nenhum plugin específico. Plugins também obedecem à **Linha Sagrada** (nunca corrompem dados).

### Fora de escopo
- Escrita/edição de dados (read-only por natureza)
- Drag-and-drop visual de colunas (adiado indefinidamente)
- Dado aninhado no Core (achatado pelo adapter)
- Cache de dados no dia 1 (stateless — toda mudança = nova consulta)

→ Detalhes em: `docs/ARCHITECTURE.md`

---

## ROADMAP

| Fase | Entrega |
|---|---|
| **Fase 0** | Setup: npm + TypeScript + monorepo (`@rsdata/core`, `@rsdata/nuxt`) + unbuild + vitest + GitHub Flow |
| **Fase 1** | Data Engine + Colunas + Tipos. JS puro. Instância viva com eventos. API explícita. Interface do adapter definida. |
| **Fase 2** | Adapter Local (array em memória). Testes com dados reais. |
| **Fase 3** | Render Engine Nuxt + Theme Default (CSS puro). Primeira tabela visível. |
| **Fase 4** | Actions (botão gatilho) + Falhe Alto (validação/denúncia de dado imperfeito). |
| **Fase 5** | Adapter Server-side (Laravel). Conexão com o projeto DDD real. |
| **= v1.0 MVP** | RSdata funcionando no projeto real. |
| **Pós-1.0** | Exportação (CSV/Excel), Seleção de linhas, Cache, etc. (backlog) |

**Ritmo:** fases sequenciais, sem prazos fixos de calendário. Pausas para outras demandas do autor.  
**Progresso:** GitHub Issues (dia a dia) + `CURRENT_PHASE.md` (mapa geral).

→ Detalhes em: `docs/ROADMAP.md`

---

## FASE ATUAL

**Fase 0 — Fundação (em progresso)**

Tarefas da Fase 0:
- [ ] Inicializar monorepo com npm workspaces (`packages/core`, `packages/nuxt`)
- [ ] Configurar TypeScript em ambos os pacotes
- [ ] Configurar unbuild para build
- [ ] Configurar Vitest para testes
- [ ] Criar estrutura de pastas do `@rsdata/core`
- [ ] Criar estrutura de pastas do `@rsdata/nuxt`
- [ ] Gerar documentos de conhecimento (em andamento — BRAIN.md criado)

→ Status detalhado em: `docs/CURRENT_PHASE.md`

---

## PRÓXIMOS PASSOS

1. **Concluir a geração dos documentos** (BRAIN.md → VISION.md → PRINCIPLES.md → ARCHITECTURE.md → ROADMAP.md → CURRENT_PHASE.md → DECISIONS.md → GLOSSARY.md → FEATURES.md → FUTURE.md → RISKS.md → CONTRIBUTING.md → AI_GUIDE.md → PROJECT_RULES.md)
2. **Iniciar implementação da Fase 0** (setup do monorepo, TypeScript, unbuild, vitest)
3. **Fase 1:** Data Engine + Colunas + Tipos

---

## DECISÕES IMPORTANTES

| Decisão | Detalhe | Reversível? |
|---|---|---|
| **Nome RSdata** | Provisório, pode mudar | Sim |
| **Headless** | Cérebro JS puro; Render = casca framework | Não (define a arquitetura) |
| **Read-only** | RSdata não edita/deleta/cria dados | Não |
| **Core zero-dep** | Dependências só nas bordas | Não (princípio fundador) |
| **Dado plano no Core** | Adapter achata aninhamento/relação | Não |
| **TypeScript** | Linguagem principal | Dificilmente |
| **npm** | Gerenciador de pacotes | Sim |
| **Monorepo** | `packages/core` + `packages/nuxt` | Dificilmente |
| **unbuild + vitest** | Build e testes | Sim |
| **GitHub Flow → Git Flow** | HOJE / AMANHÃ | Sim (porta de mão dupla) |
| **Modelo A (instância viva)** | Data Engine como objeto com estado + eventos | Não (define a API) |
| **Filtro por método explícito** | `.filtrar({ coluna, operador, valor })` | Dificilmente |
| **Servidor-side por padrão** | Servidor filtra/ordena/pagina | Não (prioridade arquitetural) |
| **Stateless dia 1** | Sem cache de dados; sempre busca fresco | Sim (refinamento futuro) |
| **CSS puro próprio** | Theme default zero dependência de framework CSS | Dificilmente |
| **Suporte: só última versão** | HOJE. Pode evoluir para LTS quando OSS | Sim (porta de mão dupla) |

→ Todas as decisões em: `docs/DECISIONS.md`

---

## GLOSSÁRIO RÁPIDO

| Termo | Significado |
|---|---|
| **Adapter** | Peça que traduz o mundo externo (API/array) para o formato plano que o Core entende. Torna a RSdata universal. |
| **Headless** | Arquitetura onde o cérebro (lógica) é independente da interface visual (framework). |
| **Linha Sagrada** | Fronteira inviolável entre transformação de DADO (Data Engine) e transformação de APRESENTAÇÃO (Theme/Render). Nada de estilo vazar pro dado nem pra exportação. |
| **Dado plano (flat)** | Uma linha é um conjunto de campos simples `{ id, nome, preco }` — sem objetos aninhados. |
| **Progressive Disclosure** | A lib te guia pelo caminho fácil por padrão, mas nunca fecha a porta do controle total. |
| **Porta de mão dupla** | Decisão reversível: escolhe-se o simples hoje, registra-se que pode mudar amanhã, sem se prender. |
| **Dependência Descartável** | Toda dependência externa é isolada por um adapter interno; se a lib morrer, troca-se o adapter, o Core não sente. |
| **Falhe Alto** | Sistema que denuncia dado imperfeito com localização exata (coluna + linha + esperado vs. recebido). Cura o "catar feijão". |
| **Dívida Consciente** | Solução rápida (A) permitida, mas o correto (B) é obrigatório e nunca sobrevive a um release. |
| **Sem parede** | Customizar uma coisa específica nunca obriga a reconstruir tudo. Sempre há degraus suaves entre o fácil e o complexo. |

→ Glossário completo em: `docs/GLOSSARY.md`

---

## ESTADO ATUAL

- **Conhecimento:** 5 etapas de discovery concluídas (Identidade, Filosofia, Arquitetura, Roadmap, Organização).
- **Código:** zero. Nenhuma linha escrita ainda. Projeto iniciando do zero.
- **Documentação:** BRAIN.md criado. Demais documentos pendentes de geração e revisão.
- **Setup:** nada configurado (Fase 0 pendente).
- **Inconsistências conhecidas:** nenhuma. Arquitetura, princípios e roadmap são internamente coerentes.

---

## ÍNDICE DE DOCUMENTOS

| Documento | Local | Status |
|---|---|---|
| BRAIN.md | Raiz | ✅ Criado |
| VISION.md | Raiz | ⏳ Pendente |
| CONTRIBUTING.md | Raiz | ⏳ Pendente |
| README.md | Raiz | ⏳ Pendente |
| PRINCIPLES.md | `docs/` | ⏳ Pendente |
| ARCHITECTURE.md | `docs/` | ⏳ Pendente |
| ROADMAP.md | `docs/` | ⏳ Pendente |
| CURRENT_PHASE.md | `docs/` | ⏳ Pendente |
| DECISIONS.md | `docs/` | ⏳ Pendente |
| GLOSSARY.md | `docs/` | ⏳ Pendente |
| FEATURES.md | `docs/` | ⏳ Pendente |
| FUTURE.md | `docs/` | ⏳ Pendente |
| RISKS.md | `docs/` | ⏳ Pendente |
| AI_GUIDE.md | `docs/` | ⏳ Pendente |
| PROJECT_RULES.md | `docs/` | ⏳ Pendente |
