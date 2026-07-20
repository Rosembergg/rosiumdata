# ROADMAP.md — rosiumdata

> **Caminho até a versão 1.0.** Fases sequenciais, prioridades e dependências.

---

## ESTRATÉGIA GERAL

O desenvolvimento segue o **Caminho A — Núcleo Primeiro**: cada camada é construída e testada em isolamento antes da próxima ser acoplada. O Core (Data Engine) é a fundação que *"não pode ficar alterando o tempo todo"*.

**Ritmo:** fases sequenciais, sem prazos fixos de calendário. O autor trabalha 100% na lib, com pausas para outras demandas.

**Progresso:** GitHub Issues (tarefas do dia a dia) + `CURRENT_PHASE.md` (mapa geral).

---

## FASES

### Fase 0 — Fundação

**Objetivo:** montar a "casa" antes dos móveis. Estrutura do repositório, ferramentas e setup inicial.

**Escolhas técnicas:**
| Ferramenta | Escolha |
|---|---|
| Gerenciador | npm |
| Linguagem | TypeScript |
| Estrutura | Monorepo (`packages/core` + `packages/nuxt`) |
| Build | unbuild |
| Testes | Vitest |
| Git | GitHub Flow (solo) |

**Entregas:**
- [ ] Inicializar monorepo com npm workspaces
- [ ] Criar `packages/core/package.json` (zero dependências)
- [ ] Criar `packages/nuxt/package.json` (depende de `@rosiumdata/core`)
- [ ] Configurar TypeScript (`tsconfig.json`) em ambos os pacotes
- [ ] Configurar unbuild para build de cada pacote
- [ ] Configurar Vitest
- [ ] Criar estrutura de pastas do `@rosiumdata/core`
- [ ] Criar estrutura de pastas do `@rosiumdata/nuxt`
- [ ] CI mínimo (rodar testes no push)

**Duração estimada:** horas (setup único, sem código de negócio).

---

### Fase 1 — Data Engine + Colunas + Tipos

**Objetivo:** o cérebro puro. Toda a lógica de estado, transformação, validação, eventos e definição de colunas — em TypeScript puro, testável no terminal, sem interface visual.

**Dependências:** Fase 0.

**Entregas:**
- [ ] Classe `RosiumTable` (instância viva com estado)
- [ ] API explícita: `.filter()`, `.sort()`, `.goToPage()`
- [ ] Leitura: `.getRows()`, `.getTotal()`, `.getState()`
- [ ] Definição de colunas com tipos (`texto`, `numero`, `data`, `booleano`, `selecao`, `acao`)
- [ ] Cada tipo como pacote de comportamento pronto (filtro, ordenação, alinhamento)
- [ ] Transformação de DADO (valor) — Linha Sagrada lado dado
- [ ] Valor real + receita de exibição separados
- [ ] Falhe Alto: validação de dado imperfeito (coluna + linha + esperado vs. recebido)
- [ ] Sistema de eventos (`dados:carregados`, `erro`, `estado:alterado`)
- [ ] Interface do Adapter definida (contrato TypeScript)
- [ ] Gerenciamento de colunas: `.hideColumn()`, `.showColumn()`, `.reorderColumns()`
- [ ] Cobertura de testes com Vitest

**Não inclui:** adapter real (só a interface), renderização, tema, actions visuais.

**Duração estimada:** a maior fase, por ser a fundação lógica de tudo.

---

### Fase 2 — Adapter Local

**Objetivo:** a primeira implementação concreta do Adapter — filtrar, ordenar e paginar um array em memória. Permite testar o Data Engine com dados reais pela primeira vez.

**Dependências:** Fase 1.

**Entregas:**
- [ ] Implementar `LocalAdapter` seguindo a interface definida na Fase 1
- [ ] Lógica de filtro local (todos os operadores dos tipos)
- [ ] Lógica de ordenação local
- [ ] Lógica de paginação local
- [ ] Testes de integração: RosiumTable + LocalAdapter com dados reais
- [ ] Cenários de teste: filtro combinado, ordenação + paginação, dados vazios, Falhe Alto com dados inválidos

**Não inclui:** servidor, HTTP, renderização.

---

### Fase 3 — Render Engine Nuxt + Theme Default

**Objetivo:** a primeira tabela visível. A casca Nuxt que desenha o esqueleto, conectada ao Core via composable, com o theme default em CSS puro.

**Dependências:** Fase 2.

**Entregas:**
- [ ] Composable `useRosiumTable()` — conecta a instância RosiumTable (Core) à reatividade do Vue
- [ ] Componente `<RosiumTable>` — renderiza a tabela completa
- [ ] Renderização de cabeçalho (com ordenação clicável)
- [ ] Renderização de corpo (linhas e células)
- [ ] Renderização de paginação (controles de página)
- [ ] Renderização de filtros (inputs/dropdowns por tipo de coluna)
- [ ] Theme default em CSS puro próprio (zero dependência)
- [ ] Estrutura de classes previsível para sobrescrita
- [ ] Plugin Nuxt para instalação (`app.use(RosiumTable)`)
- [ ] Testes de componente com Vitest

**Não inclui:** actions (botão), adapter server-side, exportação.

---

### Fase 4 — Actions + Falhe Alto (integrado)

**Objetivo:** botões de ação (gatilho) funcionando na interface e o Falhe Alto integrado ao ciclo de vida real.

**Dependências:** Fase 3.

**Entregas:**
- [ ] Coluna tipo `acao` renderizando botão configurável
- [ ] Evento emitido com o dado da linha no clique
- [ ] Suporte a múltiplas actions por linha
- [ ] Falhe Alto integrado ao Render: em dev, mensagem visível (coluna + linha + esperado vs. recebido)
- [ ] Falhe Alto em produção: estado de erro na célula, não derruba a tela
- [ ] Configuração de nível de severidade (dev vs. produção)

**Não inclui:** adapter server-side, exportação.

---

### Fase 5 — Adapter Server-side (Laravel)

**Objetivo:** conectar a rosiumdata ao backend Laravel do projeto DDD real. O servidor filtra, ordena e pagina. A rosiumdata substitui o PowerGrid.

**Dependências:** Fase 4.

**Entregas:**
- [ ] Implementar `LaravelAdapter` (ou adapter HTTP genérico customizável)
- [ ] Tradução do contrato Query → parâmetros de request do Laravel
- [ ] Parsing da resposta do Laravel → formato plano da rosiumdata
- [ ] Opções de filtro (dropdowns) vindas do servidor
- [ ] Testes de integração com um servidor Laravel real (ou mock)
- [ ] Documentação de como configurar o lado Laravel (formato esperado de request/response)

**= v1.0 MVP:** rosiumdata funcionando no projeto real do autor, substituindo o PowerGrid.

---

## PÓS-1.0 (BACKLOG)

Funcionalidades planejadas para após o MVP. Sem ordem fixa; priorizadas conforme necessidade.

| Item | Prioridade | Notas |
|---|---|---|
| Exportação CSV | Média | Plugin. Pode usar lib externa, isolada por adapter de exportação. |
| Exportação Excel (.xlsx) | Média | Plugin. Dependência externa (ex: exceljs), isolada por adapter. |
| Seleção de linhas (checkbox) | Média | Lógica é Core, visual é Render/Plugin. |
| Cache de dados | Baixa | Refinamento de performance. Stateless é suficiente para MVP. |
| Adapter para outras APIs | Baixa | Conforme demanda da comunidade. |
| Casca React (`@rosiumdata/react`) | Futuro | Novo Render Engine, mesmo Core. |
| Casca Web Component (`<rs-table>`) | Futuro | HTML puro, funciona em qualquer framework. |
| Drag-and-drop visual de colunas | Muito futuro | Luxo. "Bem depois, e só se precisar." |
| Internacionalização (i18n) | Futuro | Plugin. |
| Acessibilidade (a11y) | Futuro | Integrado ao Render. |
| Temas pré-definidos | Futuro | Contraria "não somos kit de UI"? A reavaliar. |

---

## DEPENDÊNCIAS ENTRE FASES

```
Fase 0 (Fundação)
  └── Fase 1 (Data Engine + Colunas + Tipos)
        └── Fase 2 (Adapter Local)
              └── Fase 3 (Render Engine Nuxt + Theme)
                    └── Fase 4 (Actions + Falhe Alto integrado)
                          └── Fase 5 (Adapter Server-side Laravel)
                                └── v1.0 MVP
```

Cada fase é **bloqueante** para a seguinte. Nenhuma fase pode começar antes da anterior estar concluída e testada.

---

## MARCOS DE RELEASE

| Versão | Fases incluídas | O que entrega |
|---|---|---|
| **v0.1** | Fase 0 + 1 | Core funcional, testável no terminal. Sem interface. |
| **v0.2** | + Fase 2 | Dados locais fluindo pelo Core. |
| **v0.3** | + Fase 3 | Primeira tabela visível em Nuxt. |
| **v0.4** | + Fase 4 | Actions + Falhe Alto funcionais. |
| **v1.0** | + Fase 5 | MVP: rosiumdata no projeto real. |

> Cada release é "limpo" — sem dívida técnica sobrevivente (Princípio #1). Nenhuma versão é publicada carregando solução temporária não-resolvida.

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `docs/CURRENT_PHASE.md` (status atual), `docs/DECISIONS.md` (decisões que moldaram o roadmap), `docs/FUTURE.md` (pós-1.0 detalhado).
