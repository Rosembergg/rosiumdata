# DECISIONS.md — RSdata

> **Registro de todas as decisões importantes do projeto.** O que foi decidido, por quê, quando e se é reversível.  
> Serve como memória institucional — se alguém questionar "por que fizemos assim?", a resposta está aqui.

---

## DECISÕES ARQUITETURAIS

### D-001: Headless — Cérebro JS puro, Render como casca

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** O Core (Data Source + Data Engine) é JavaScript/TypeScript puro, zero framework. O Render Engine é a única camada que conhece o framework (hoje Nuxt/Vue).
**Motivo:** Permite portar a RSdata para React, Web Components ou qualquer frontend no futuro sem reescrever a lógica. Torna real o sonho "qualquer frontend".
**Alternativa considerada:** Tudo acoplado ao Nuxt (mais rápido hoje, mas amarra ao Vue para sempre). Web Components puro (mais universal, mas difícil de usar no ecossistema Nuxt hoje).
**Reversível:** Não. Define a arquitetura do projeto.
**Impacto:** O Core não pode usar `ref`, `computed`, `reactive` nem qualquer API do Vue. A reatividade é própria (eventos em JS puro).

---

### D-002: Read-only — RSdata não escreve dados

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** A RSdata é somente-leitura (read-only) por natureza. Ela exibe e exporta dados; não edita, cria ou deleta. A mutação é responsabilidade do CRUD do sistema do usuário.
**Motivo:** Coerente com a Identidade ("a RSdata é a ponte, não o destino"). Mantém o Core simples e o escopo afiado.
**Alternativa considerada:** Permitir edição inline (como o AG Grid). Rejeitada: fere o princípio de foco ("não somos Excel") e aumenta a complexidade do Core.
**Reversível:** Não. Define o escopo do produto.
**Impacto:** O contrato do Adapter é só leitura (`fetch`, nunca `save`/`update`/`delete`). Ações (botões) são gatilhos que emitem eventos, mas a execução é externa.

---

### D-003: Core zero dependências

**Data:** Discovery — Etapa 2 (Filosofia)
**Decisão:** O `@rsdata/core` tem zero dependências externas de runtime. Literalmente nenhuma.
**Motivo:** Soberania — se uma dependência morre, a RSdata não morre junto. O Core é sagrado. Dependências externas, quando inevitáveis, vivem isoladas em plugins/adapters nas bordas.
**Alternativa considerada:** Dependências criteriosas dentro do Core. Rejeitada: qualquer dependência no Core compromete a soberania.
**Reversível:** Não. Princípio fundador.
**Impacto:** Tudo que exija lib externa (ex: gerar .xlsx) é Plugin, nunca Core. O `package.json` do `@rsdata/core` comprova: zero `dependencies`.

---

### D-004: Dado plano (flat) no Core

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** A RSdata trabalha exclusivamente com dados planos. O Core nunca navega em objetos aninhados. Se o dado vier aninhado, o Adapter achata antes de entregar.
**Motivo:** Mantém o Core simples e universal. Relação entre tabelas, JOINs, agregações são responsabilidade do backend/adapter, não da RSdata. Cura a dor original do PowerGrid (dado de relação exigia lógica especial na tabela).
**Alternativa considerada:** Core aceitar caminhos aninhados (`categoria.nome`). Rejeitada: adicionaria complexidade ao Core e quebraria o princípio de "Core minimalista".
**Reversível:** Dificilmente. Afeta a interface do Adapter e a definição de colunas.
**Impacto:** Toda coluna aponta para um campo simples (`preco`, não `categoria.preco`). O Adapter tem a responsabilidade de "achatar" o dado.

---

### D-005: Adapter como conceito universal

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** Toda fonte de dados é um Adapter. Server-side e client-side usam o mesmo contrato. A RSdata nunca sabe de onde vêm os dados.
**Motivo:** Um único modelo mental no Core. Escala sem reescrever: começa com adapter local, migra para remoto trocando só o adapter. É o anti-PowerGrid: a tabela não muda, o adapter muda.
**Alternativa considerada:** Caminhos separados para local vs. remoto. Rejeitada: duplicaria lógica e quebraria a simplicidade do Core.
**Reversível:** Não. Define a interface do Data Engine.
**Impacto:** O contrato `DataAdapter` é a espinha dorsal da comunicação com o mundo externo.

---

### D-006: Servidor-side por padrão

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** A prioridade arquitetural é server-side — o servidor filtra, ordena e pagina. O adapter local existe para o caso simples, mas a arquitetura é desenhada para o servidor fazer o trabalho pesado.
**Motivo:** Proteger o navegador do usuário final (sem travamento com 100 mil linhas). É a dor real do autor: o navegador não pode receber tudo.
**Alternativa considerada:** Client-side como padrão. Rejeitada: não escala para os volumes de dados reais.
**Reversível:** Não. Prioridade arquitetural.
**Impacto:** O contrato `Query` do Adapter foi desenhado para server-side (filtro, ordenação, página são enviados, não executados localmente). O adapter local é um caso especial que "simula" o servidor.

---

### D-007: Filtro por método explícito

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** A API de filtro é explícita: `tabela.filtrar({ column: 'preco', operator: 'gt', value: 50 })`.
**Motivo:** Princípio #6 — explícito acima de mágico. O dev lê e entende cada filtro na hora. Sem DSLs obscuros ou objetos mágicos aninhados.
**Alternativa considerada:** Builder encadeado (`.where('preco').greaterThan(50)`). Objeto simples (`{ preco: { gt: 50 } }`). Ambas rejeitadas por serem menos explícitas ou menos familiares.
**Reversível:** Dificilmente. Define a API pública do Data Engine. Mas a API pode ser estendida com syntax sugar no futuro.

---

### D-008: Modelo A — Instância viva com eventos

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** O Data Engine é uma classe com estado mutável que emite eventos (`new RsTable()`, `.filtrar()`, `.on('dados:carregados', ...)`).
**Motivo:** Conecta naturalmente ao Render Engine headless (casca escuta eventos). Mais intuitivo para o dev "resolve rápido". Coerente com plugins (escutam os mesmos eventos).
**Alternativa considerada:** API funcional/imutável (cada ação retorna novo estado). Rejeitada: menos intuitiva, exigiria mais código do usuário para gerenciar estado.
**Reversível:** Não. Define a API pública do Data Engine.
**Impacto:** Estado é mutável. Testes precisam resetar a instância entre cenários (`beforeEach`).

---

### D-009: Stateless — sem cache no dia 1

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** A RSdata não guarda resultados anteriores. Toda mudança de filtro/ordenação/página gera nova consulta ao Adapter.
**Motivo:** Core minimalista. Complexidade de cache (invalidação, stale data) é prematura para o MVP. Sempre correto (dado fresco) > às vezes rápido (dado em cache).
**Alternativa considerada:** Cache com invalidação. Adiada, não rejeitada — pode virar plugin ou opção no futuro.
**Reversível:** Sim. Pode ser adicionado como refinamento sem quebrar nada.
**Impacto:** Nenhum estado de "dados já buscados". Cada `.filtrar()` dispara `adapter.fetch()`.

---

## DECISÕES DE PRODUTO

### D-010: Nome provisório — RSdata

**Data:** Discovery — Etapa 1 (Identidade)
**Decisão:** O nome atual do projeto é RSdata, mas é provisório e pode mudar.
**Motivo:** Nome não é crítico para a arquitetura. Pode ser decidido mais tarde, antes do lançamento público.
**Alternativa considerada:** Nome definitivo desde o início. Rejeitada: desnecessário neste momento.
**Reversível:** Sim. Nome não afeta código (apenas `package.json` e documentação).

---

### D-011: Hoje solo, amanhã OSS

**Data:** Discovery — Etapa 1 (Identidade)
**Decisão:** O projeto começa como ferramenta pessoal (dogfooding) e evolui para Open Source público.
**Motivo:** Resolver a dor real primeiro. A experiência de uso real valida a lib antes de abrir para o mundo. Regra de ouro: decisões de hoje não inviabilizam o amanhã público.
**Alternativa considerada:** Já nascer como OSS público. Rejeitada: sem validação real, risco de construir algo que ninguém usa. Já nascer como ferramenta interna permanente. Rejeitada: ambição de produto.
**Reversível:** Sim. Mas cada decisão de hoje é tomada com o amanhã OSS em mente.

---

## DECISÕES TÉCNICAS

### D-012: TypeScript como linguagem principal

**Data:** Discovery — Etapa 4 (Roadmap)
**Decisão:** O projeto é escrito em TypeScript.
**Motivo:** Tipos reforçam o Falhe Alto (dado imperfeito detectado em tempo de compilação). Autocomplete melhora a experiência do usuário da lib ("resolve rápido"). Padrão do mercado OSS.
**Alternativa considerada:** JavaScript puro. Rejeitada: menos segurança de tipos, menos DX para o usuário da lib.
**Reversível:** Dificilmente. Migrar de TS para JS seria perda de segurança.
**Impacto:** Configuração de build (unbuild) precisa gerar `.d.ts` para os consumidores.

---

### D-013: npm como gerenciador de pacotes

**Data:** Discovery — Etapa 4 (Roadmap)
**Decisão:** Usar npm (não pnpm ou yarn).
**Motivo:** Preferência do autor. npm workspaces resolvem monorepo sem ferramentas extras.
**Alternativa considerada:** pnpm (mais rápido, mas mais uma ferramenta). Yarn (similar ao npm).
**Reversível:** Sim. Mudar de gerenciador não afeta o código.

---

### D-014: Monorepo com `packages/core` e `packages/nuxt`

**Data:** Discovery — Etapa 4 (Roadmap)
**Decisão:** Estrutura monorepo com pacotes separados para Core e casca Nuxt.
**Motivo:** A fronteira arquitetural (headless) vira fronteira física. Impossível o pacote Nuxt depender de algo sem ser explícito. O `package.json` do Core comprova zero dependências. Amanhã, `packages/react/` usa o mesmo Core.
**Alternativa considerada:** Pacote único com pastas. Rejeitada: separação seria só "disciplina", sem garantia física.
**Reversível:** Dificilmente. Unificar os pacotes depois seria regredir em garantias arquiteturais.
**Impacto:** Setup mais complexo na Fase 0 (workspaces, builds separados), mas é investimento único.

---

### D-015: unbuild + Vitest

**Data:** Discovery — Etapa 4 (Roadmap)
**Decisão:** unbuild para build, Vitest para testes.
**Motivo:** Ambos do ecossistema Nuxt/UnJS. unbuild é usado pelos pacotes oficiais do Nuxt. Vitest é o padrão para Vue/Nuxt e tem suporte nativo a TypeScript.
**Alternativa considerada:** tsup (build) + Jest (testes). Rejeitada: unbuild mais integrado ao ecossistema Nuxt; Vitest mais rápido e moderno que Jest.
**Reversível:** Sim. Trocar ferramentas de build/teste não afeta o código, só a configuração.

---

### D-016: GitHub Flow (hoje) → Git Flow (amanhã)

**Data:** Discovery — Etapa 5 (Organização)
**Decisão:** Durante o desenvolvimento solo, usa-se GitHub Flow (`main` sempre deployável, branches curtas). Quando o projeto tiver comunidade/contribuidores, migra-se para Git Flow (com `develop` + `release/*`).
**Motivo:** GitHub Flow é mais leve para uma pessoa. Git Flow oferece checkpoints formais para a regra de dívida (nenhum release sai com dívida), mas tem overhead que não se justifica solo.
**Alternativa considerada:** Git Flow desde o início. Rejeitada: overhead desnecessário para 1 pessoa.
**Reversível:** Sim. A migração é planejada e esperada.

---

### D-017: Theme default em CSS puro próprio

**Data:** Discovery — Etapa 3 (Arquitetura)
**Decisão:** O template visual padrão usa apenas CSS puro, sem dependência de Tailwind, Bootstrap ou qualquer framework CSS.
**Motivo:** Soberania (Princípio #3). Se um framework CSS morrer, o visual da RSdata não morre. O usuário é livre para aplicar Tailwind ou o que quiser por cima — mas a RSdata não depende de nada.
**Alternativa considerada:** Usar Tailwind como dependência. Rejeitada: fere a soberania. Oferecer múltiplos temas prontos. Rejeitada: "não somos kit de UI".
**Reversível:** Dificilmente. Adicionar dependência a framework CSS seria contradizer o princípio fundador.

---

## DECISÕES DE VERSIONAMENTO E SUPORTE

### D-018: SemVer

**Data:** Discovery — Etapa 2 (Filosofia)
**Decisão:** Versionamento Semântico (Major.Minor.Patch). Major quebra compatibilidade, Minor adiciona sem quebrar, Patch corrige bug.
**Motivo:** Padrão da indústria. Permite ao usuário fixar a versão que quiser (como "Windows 7").
**Alternativa considerada:** CalVer (baseado em data). Rejeitada: menos informativo sobre breaking changes.
**Reversível:** Dificilmente. Mudar esquema de versionamento depois confunde a comunidade.

---

### D-019: Suporte apenas da última versão (hoje)

**Data:** Discovery — Etapa 2 (Filosofia)
**Decisão:** Hoje (fase solo), apenas a última versão recebe correções. Versões antigas continuam existindo e funcionando, mas ficam congeladas — sem suporte.
**Motivo:** O autor está sozinho. Não tem braço para manter múltiplas versões simultaneamente.
**Alternativa considerada:** Suporte à última + 1 anterior. LTS para versões selecionadas. Ambas adiadas para a fase OSS (quando houver comunidade).
**Reversível:** Sim. A política pode (e provavelmente vai) evoluir quando o projeto tiver comunidade.

---

## RESUMO

| ID | Decisão | Reversível? |
|---|---|---|
| D-001 | Headless (Core JS puro, Render casca) | Não |
| D-002 | Read-only | Não |
| D-003 | Core zero dependências | Não |
| D-004 | Dado plano no Core | Dificilmente |
| D-005 | Adapter como conceito universal | Não |
| D-006 | Servidor-side por padrão | Não |
| D-007 | Filtro por método explícito | Dificilmente |
| D-008 | Instância viva com eventos | Não |
| D-009 | Stateless (sem cache no dia 1) | Sim |
| D-010 | Nome provisório RSdata | Sim |
| D-011 | Hoje solo, amanhã OSS | Sim |
| D-012 | TypeScript | Dificilmente |
| D-013 | npm | Sim |
| D-014 | Monorepo | Dificilmente |
| D-015 | unbuild + Vitest | Sim |
| D-016 | GitHub Flow → Git Flow | Sim |
| D-017 | Theme CSS puro próprio | Dificilmente |
| D-018 | SemVer | Dificilmente |
| D-019 | Suporte só última versão (hoje) | Sim |

---

> **Documentos relacionados:** `BRAIN.md` (índice), `docs/PRINCIPLES.md` (princípios que motivaram as decisões), `docs/ARCHITECTURE.md` (como as decisões viram estrutura).
