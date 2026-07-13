# CURRENT_PHASE.md — RSdata

> **Status atual do desenvolvimento.** Onde estamos, o que está feito e qual o próximo passo.  
> **Atualizado em:** após conclusão das 5 etapas de discovery.

---

## FASE ATUAL: Fase 0 — Fundação

**Status:** ⏳ Em progresso

**Objetivo:** montar a "casa" antes dos móveis. Setup do repositório, ferramentas e estrutura inicial.

---

### Checklist da Fase 0

#### Estrutura do repositório
- [ ] Inicializar repositório Git (`git init`)
- [ ] Criar `package.json` raiz com npm workspaces
- [ ] Criar `packages/core/package.json` (`@rsdata/core`, zero dependências)
- [ ] Criar `packages/nuxt/package.json` (`@rsdata/nuxt`, depende de `@rsdata/core`)

#### TypeScript
- [ ] Criar `tsconfig.json` base na raiz
- [ ] Criar `tsconfig.json` para `packages/core`
- [ ] Criar `tsconfig.json` para `packages/nuxt`

#### Build
- [ ] Instalar e configurar unbuild para `packages/core`
- [ ] Instalar e configurar unbuild para `packages/nuxt`
- [ ] Script `build` na raiz (compila core → nuxt)

#### Testes
- [ ] Instalar e configurar Vitest
- [ ] Script `test` na raiz
- [ ] Criar arquivo de teste inicial (smoke test)

#### Estrutura de pastas
- [ ] Criar estrutura de `packages/core/src/` (engine, columns, adapter, filters, sorting, pagination, validation, events)
- [ ] Criar estrutura de `packages/nuxt/src/` (components, composables, theme)

#### CI mínimo
- [ ] Configurar GitHub Actions (ou similar) para rodar testes no push

#### Documentação
- [ ] BRAIN.md ✅ (em `.ai/`)
- [ ] VISION.md ✅
- [ ] PRINCIPLES.md ✅
- [ ] ARCHITECTURE.md ✅
- [ ] ROADMAP.md ✅
- [ ] CURRENT_PHASE.md ✅
- [ ] DECISIONS.md ⏳
- [ ] GLOSSARY.md ⏳
- [ ] FEATURES.md ⏳
- [ ] FUTURE.md ⏳
- [ ] RISKS.md ⏳
- [ ] CONTRIBUTING.md ⏳
- [ ] AI_GUIDE.md ⏳
- [ ] PROJECT_RULES.md ⏳
- [ ] README.md ⏳

---

## O QUE JÁ EXISTE

| Item | Status |
|---|---|
| Conhecimento do projeto | ✅ 5 etapas de discovery concluídas |
| BRAIN.md | ✅ Criado (em `.ai/`) |
| VISION.md | ✅ Criado |
| PRINCIPLES.md | ✅ Criado |
| ARCHITECTURE.md | ✅ Criado |
| ROADMAP.md | ✅ Criado |
| Código | ❌ Zero. Nenhuma linha escrita ainda. |
| Setup do repositório | ❌ Não inicializado. |

---

## PRÓXIMOS PASSOS IMEDIATOS

1. **Concluir a geração dos documentos restantes** (ordem: DECISIONS → GLOSSARY → FEATURES → FUTURE → RISKS → CONTRIBUTING → AI_GUIDE → PROJECT_RULES → README)
2. **Inicializar o repositório Git** e criar a estrutura de pastas
3. **Configurar npm workspaces, TypeScript, unbuild e Vitest**
4. **Iniciar a Fase 1:** escrever a primeira linha de código do Data Engine

---

## BLOQUEIOS

Nenhum no momento.

---

## PRÓXIMA FASE

**Fase 1 — Data Engine + Colunas + Tipos**

Quando a Fase 0 estiver concluída, a Fase 1 começa com:
- Implementar classe `RsTable`
- Definir interface do Adapter
- Implementar tipos de coluna como pacotes de comportamento
- Sistema de eventos (reatividade própria)
- Falhe Alto (validação)
- Cobertura de testes com Vitest

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `docs/ROADMAP.md` (fases completas), `docs/DECISIONS.md` (decisões relevantes à fase atual).
