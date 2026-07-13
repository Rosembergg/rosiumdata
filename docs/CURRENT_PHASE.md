# CURRENT_PHASE.md — RSdata

> **Status atual do desenvolvimento.** Onde estamos, o que está feito e qual o próximo passo.  
> **Atualizado em:** 2026-07-13 — após conclusão da Fase 0.

---

## FASE ATUAL: Fase 1 — Data Engine + Colunas + Tipos

**Status:** ⏳ Em progresso

---

### Checklist da Fase 0 ✅ (CONCLUÍDA)

#### Estrutura do repositório
- [x] Inicializar repositório Git (`git init`)
- [x] Criar `package.json` raiz com npm workspaces
- [x] Criar `packages/core/package.json` (`@rsdata/core`, zero dependências)
- [x] Criar `packages/nuxt/package.json` (`@rsdata/nuxt`, depende de `@rsdata/core`)

#### TypeScript
- [x] Criar `tsconfig.json` base na raiz
- [x] Criar `tsconfig.json` para `packages/core`
- [x] Criar `tsconfig.json` para `packages/nuxt`

#### Build
- [x] Instalar e configurar unbuild para `packages/core`
- [x] Instalar e configurar unbuild para `packages/nuxt`
- [x] Script `build` na raiz (compila core → nuxt)

#### Testes
- [x] Instalar e configurar Vitest
- [x] Script `test` na raiz
- [x] Criar arquivo de teste inicial (smoke test)

#### Estrutura de pastas
- [x] Criar estrutura de `packages/core/src/` (engine, columns, adapter, filters, sorting, pagination, validation, events)
- [x] Criar estrutura de `packages/nuxt/src/` (components, composables, theme)

#### CI mínimo
- [ ] Configurar GitHub Actions (ou similar) para rodar testes no push
- **Nota:** CI foi adiado. O foco agora é código. Será configurado antes do primeiro release público.

#### Documentação
- [x] BRAIN.md ✅
- [x] VISION.md ✅
- [x] PRINCIPLES.md ✅
- [x] ARCHITECTURE.md ✅
- [x] ROADMAP.md ✅
- [x] CURRENT_PHASE.md ✅
- [x] PROJECT_RULES.md ✅
- [x] AI_GUIDE.md ✅
- [x] DECISIONS.md ✅
- [x] GLOSSARY.md ✅
- [x] FEATURES.md ✅
- [x] FUTURE.md ✅
- [x] RISKS.md ✅
- [x] CONTRIBUTING.md ✅
- [x] README.md ✅

---

## O QUE JÁ EXISTE

| Item | Status |
|---|---|
| Conhecimento do projeto | ✅ 5 etapas de discovery concluídas |
| Documentação | ✅ Completa (14 documentos) |
| Repositório Git | ✅ Inicializado (branch `etapa-0`) |
| npm workspaces | ✅ `packages/core` + `packages/nuxt` |
| TypeScript | ✅ Configurado (strict, base + específicos) |
| Build (unbuild) | ✅ Ambos pacotes compilam |
| Testes (Vitest) | ✅ Smoke test passa (4/4) |
| Estrutura de pastas | ✅ Conforme ARCHITECTURE.md |
| Código de negócio | ❌ Apenas placeholders — implementação começa na Fase 1 |

---

## PRÓXIMOS PASSOS IMEDIATOS

1. **Iniciar a Fase 1:** escrever a primeira linha de código do Data Engine
2. Implementar classe `RsTable`
3. Definir interface do Adapter
4. Implementar tipos de coluna como pacotes de comportamento
5. Sistema de eventos (reatividade própria)
6. Falhe Alto (validação)
7. Cobertura de testes com Vitest

---

## BLOQUEIOS

Nenhum no momento.

---

## PRÓXIMA FASE

**Fase 2 — Adapter Local**

Quando a Fase 1 estiver concluída, a Fase 2 começa com:
- Implementar `LocalAdapter` seguindo a interface definida na Fase 1
- Lógica de filtro local
- Lógica de ordenação local
- Lógica de paginação local
- Testes de integração: RsTable + LocalAdapter

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `docs/ROADMAP.md` (fases completas), `docs/DECISIONS.md` (decisões relevantes à fase atual).
