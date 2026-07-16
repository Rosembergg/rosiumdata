# 🧠 RSdata

> Índice inteligente. Leia isto primeiro. Depois vá para o documento específico.

---

## QUEM SOMOS

Framework OSS de Data Grid. **Hoje** resolve a migração Laravel→Nuxt do autor. **Amanhã** concorrente do TanStack/AG Grid. Nome: RSdata (provisório).

**Missão:** tratar e exibir dados sem acoplar camadas. Controle total.
**Regra de ouro:** decisão de hoje não inviabiliza o amanhã público.
→ `VISION.md`

---

## 3 FORÇAS

1. **Desacoplamento** — dado ≠ lógica ≠ visual ≠ estilo. Cura do PowerGrid.
2. **Manutenibilidade** — simples de manter, não só de começar.
3. **Soberania** — Core zero-dep. Dependência morre? RSdata sobrevive.

---

## 7 PRINCÍPIOS

| # | Princípio | 1 frase |
|---|---|---|
| 1 | Dívida nunca abandonada | Rápido vai pra produção, correto é obrigatório; **nenhum release sai com dívida**. |
| 2 | Nunca força gambiarra | Sempre há porta oficial de extensão. Se não tem, é bug de design. |
| 3 | Dependência descartável | Core = zero-dep. Deps isoladas nas bordas, substituíveis por adapter. |
| 4 | Híbrido | Convenção padrão (rápido) + configuração possível (controle). Sempre. |
| 5 | Sem parede | Customiza peça OU camada. Nunca "tudo ou nada". |
| 6 | Explícito > mágico | Código é documentação primária. Nada de comportamento invisível. |
| 7 | Falhe Alto | Dado errado? Grita no dev (localização exata). Seguro na produção. |

→ `docs/PRINCIPLES.md`

---

## ARQUITETURA (4 CAMADAS)

```
ADAPTER ──▶ DATA ENGINE ──▶ RENDER ENGINE ──▶ THEME
(mundo)      (JS puro)       (Nuxt casca)       (CSS)
```

| Camada | É | NÃO é |
|---|---|---|
| **Adapter** | Tradutor do mundo externo. Filtro de sujeira (relação, aninhamento). Tudo é adapter (local ou remoto). | Nunca escreve (read-only). |
| **Data Engine** | Cérebro: estado, filtro, ordenação, página, transformação de DADO, validação. Instância viva com eventos. | Nunca desenha, nunca sabe de onde vem o dado. |
| **Render** | Casca Nuxt: esqueleto visual + comportamento. Única que conhece o framework. | Nunca toca no dado. |
| **Theme** | Pele: cor, fonte, borda. CSS puro, zero-dep. | Nunca altera estrutura. |

### 🔴 Linha Sagrada

- **DADO** (Data Engine): `1→"Ativo"`, `100→"R$ 100"` valor. → Vai pro Excel.
- **APRESENTAÇÃO** (Theme): verde, negrito, alinhamento. → **NUNCA** vai pro Excel.
- Exportação = dado puro, sempre. Override por coluna para CPF, zero à esquerda.

### Headless

Core (`@rsdata/core`) = JS puro, zero Vue, zero framework. Portar pra React = nova casca, mesmo cérebro.

### Core vs Plugin

| Core (zero-dep) | Plugin (bordas) |
|---|---|
| Tabela, ordenação, filtros, paginação | Exportação (Excel/CSV) |
| Colunas, tipos, transformação de dado | |
| Actions, Falhe Alto, seleção, eventos | |

→ `docs/ARCHITECTURE.md`

---

## TIPOS DE COLUNA (DIA 1)

`texto` `numero` `data/data-hora` `booleano` `selecao/enum` `acao`

Cada tipo = pacote de comportamento pronto (filtro, ordenação, alinhamento, validação). Sobrescrevível.

---

## ROADMAP

| Fase | O quê | Status |
|---|---|---|
| **0** | Setup: monorepo, TS, npm, unbuild, vitest | ✅ |
| **1** | Data Engine + Colunas + Tipos (JS puro) | ✅ |
| **2** | Adapter local (array) | ✅ |
| **3** | Render Nuxt + Theme default (CSS) | ✅ |
| **4** | Actions + Falhe Alto integrado | ✅ |
| **5** | Adapter Server-side (Laravel) | ⏳ |
| **= v1.0** | MVP: RSdata no projeto real | |
| **+** | Exportação, Seleção, Cache, React, etc. | |

→ `docs/ROADMAP.md` · `docs/CURRENT_PHASE.md`

---

## DECISÕES-CHAVE (19)

| ID | Decisão | Rev? |
|---|---|---|
| D-001 | Headless (Core JS puro) | Não |
| D-002 | Read-only | Não |
| D-003 | Core zero-dependências | Não |
| D-004 | Dado plano no Core | ~Não |
| D-005 | Adapter universal | Não |
| D-006 | Server-side padrão | Não |
| D-007 | Filtro explícito | ~Não |
| D-008 | Instância viva + eventos | Não |
| D-009 | Stateless dia 1 | Sim |
| D-010 | Nome RSdata provisório | Sim |
| D-011 | Solo→OSS | Sim |
| D-012 | TypeScript | ~Não |
| D-013 | npm | Sim |
| D-014 | Monorepo | ~Não |
| D-015 | unbuild+vitest | Sim |
| D-016 | GitHub→Git Flow | Sim |
| D-017 | CSS puro próprio | ~Não |
| D-018 | SemVer | ~Não |
| D-019 | Suporte só última versão | Sim |

→ `docs/DECISIONS.md`

---

## GLOSSÁRIO RÁPIDO

- **Adapter** — traduz mundo externo → dado plano. Torna a RSdata universal.
- **Headless** — cérebro independente do framework visual.
- **Linha Sagrada** — dado ≠ apresentação. Nunca se misturam.
- **Dado plano** — linha = campos simples, sem objetos aninhados.
- **Falhe Alto** — denuncia dado errado com localização exata. Cura "catar feijão".
- **Porta de mão dupla** — decisão reversível: simples hoje, muda amanhã.
- **Sem parede** — customizar 1 coisa não obriga a reconstruir tudo.
- **Caminho A/B** — A = rápido (temporário). B = correto (obrigatório antes do release).

→ `docs/GLOSSARY.md`

---

## FASE ATUAL: Fase 5 (Adapter Server-side Laravel)

→ `docs/CURRENT_PHASE.md`

---

## ÍNDICE DE DOCUMENTOS

| Documento | Local | Status |
|---|---|---|
| BRAIN.md | `.ai/` | ✅ |
| VISION.md | Raiz | ✅ |
| CONTRIBUTING.md | Raiz | ✅ |
| README.md | Raiz | ✅ |
| PRINCIPLES.md | `docs/` | ✅ |
| ARCHITECTURE.md | `docs/` | ✅ |
| ROADMAP.md | `docs/` | ✅ |
| CURRENT_PHASE.md | `docs/` | ✅ |
| DECISIONS.md | `docs/` | ✅ |
| GLOSSARY.md | `docs/` | ✅ |
| FEATURES.md | `docs/` | ✅ |
| FUTURE.md | `docs/` | ✅ |
| RISKS.md | `docs/` | ✅ |
| AI_GUIDE.md | `.ai/` | ✅ |
| TEMPLATE.md | `.ai/` | ✅ |
| PROJECT_RULES.md | `docs/` | ✅ |
