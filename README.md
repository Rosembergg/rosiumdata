# RSdata

> Framework Open Source de Data Grid. Tratamento e visualização de dados com separação radical de responsabilidades.

**Status:** Em desenvolvimento inicial (Fase 0 — Fundação).

---

## O QUE É

RSdata é uma plataforma de manipulação e visualização de dados em grade (tabela). Não é apenas uma tabela bonita — é um framework que separa **dado**, **lógica**, **apresentação** e **estilo** em camadas independentes.

- **Hoje:** foco em Nuxt 3, resolvendo uma migração real Laravel → Nuxt DDD.
- **Amanhã:** agnóstico de framework (React, Web Components, qualquer frontend).

---

## POR QUE EXISTE

Frameworks de Data Grid existentes sofrem de **acoplamento**: buscar dados, filtrar, estilizar e exportar acontecem no mesmo lugar. Cada pedido novo vira gambiarra. O estilo visual vaza para a exportação e corrompe o dado.

A RSdata resolve isso com **4 camadas separadas**:

```
Data Source → Data Engine → Render Engine → Theme
```

O mesmo dado serve tela, filtro e exportação — **sem contaminação de estilo**. Sempre.

---

## ARQUITETURA EM 30 SEGUNDOS

| Camada | Responsabilidade |
|---|---|
| **Data Source (Adapter)** | Traduz o mundo externo (API, array, banco) em dado plano. |
| **Data Engine (Core)** | Cérebro: estado, filtros, ordenação, paginação. JS puro, zero dependências. |
| **Render Engine** | Casca visual (hoje Nuxt/Vue). Única que conhece o framework. |
| **Theme** | Pele: cor, fonte, borda. CSS puro próprio. |

---

## PRINCÍPIOS

1. **Dívida nunca abandonada** — rápido vai pra produção, correto é obrigatório. Nenhum release sai com dívida.
2. **Nunca força gambiarra** — sempre há porta oficial de extensão.
3. **Dependência descartável** — Core zero-dep. Deps isoladas nas bordas.
4. **Híbrido** — convenção padrão + configuração possível.
5. **Sem parede** — customiza peça ou camada. Nunca "tudo ou nada".
6. **Explícito > mágico** — código é documentação primária.
7. **Falhe Alto** — dado errado grita no dev, seguro na produção.

---

## COMEÇANDO

```bash
# Instalar dependências
npm install

# Rodar testes
npm test

# Build
npm run build
```

> **Nota:** scripts em configuração durante a Fase 0.

---

## DOCUMENTAÇÃO

| Documento | Conteúdo |
|---|---|
| [BRAIN.md](./.ai/BRAIN.md) | Índice inteligente — leia primeiro |
| [VISION.md](./VISION.md) | Visão, missão, público, diferencial |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Como contribuir |
| [docs/PRINCIPLES.md](./docs/PRINCIPLES.md) | Os 7 princípios em detalhe |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Arquitetura completa |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Fases até v1.0 e além |
| [docs/CURRENT_PHASE.md](./docs/CURRENT_PHASE.md) | Status atual do desenvolvimento |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Decisões importantes e seus motivos |
| [docs/GLOSSARY.md](./docs/GLOSSARY.md) | Vocabulário do projeto |
| [docs/FEATURES.md](./docs/FEATURES.md) | Funcionalidades planejadas |
| [docs/FUTURE.md](./docs/FUTURE.md) | Visão de longo prazo |
| [docs/RISKS.md](./docs/RISKS.md) | Riscos e mitigações |
| [docs/PROJECT_RULES.md](./docs/PROJECT_RULES.md) | Regras operacionais |

---

## TECNOLOGIAS

| Ferramenta | Uso |
|---|---|
| TypeScript | Linguagem principal |
| npm | Gerenciador de pacotes |
| unbuild | Build |
| Vitest | Testes |
| Nuxt 3 / Vue 3 | Render Engine (casca) |

---

## LICENÇA

A definir antes do lançamento público.

---

> **Feito para devs que precisam tratar dados de verdade — do caso simples ao complexo — sem gambiarra e sem estilo vazando pro Excel.**
