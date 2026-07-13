# PROJECT_RULES.md — RSdata

> **Regras operacionais do projeto.** Como trabalhamos no dia a dia. Complementa os princípios (o "porquê") com o "como".

---

## REGRA DE OURO

**Nenhum release sai com dívida técnica.** Toda solução temporária (caminho A) é substituída pela correta (caminho B) **antes** do release. Se o B não estiver pronto, o release não sai.

---

## REGRAS DE CÓDIGO

### R1 — Core intocável
- `@rsdata/core` tem **zero** dependências de runtime. Comprove com `npm ls --production` dentro do pacote.
- Nenhum código do Core importa Vue, React, Nuxt, ou qualquer framework.
- O Core é TypeScript puro. Sempre.

### R2 — Linha Sagrada
- Dado (valor) e apresentação (estilo) nunca se misturam no código.
- Se um valor aparece colorido no Excel, **algo foi feito errado**.
- Transformação de valor: sempre no Data Engine, sempre visível na definição da coluna.

### R3 — Explícito, sempre
- Não existe "convenção mágica". Comportamento deve ser visível no código de uso.
- Prefira verbosidade a "inteligência". Código claro > código curto.
- Nada de `if (coluna.nome === 'preco') { /* faz mágica */ }`.

### R4 — Tipos primeiro
- Toda coluna tem tipo declarado. Sem exceção.
- O tipo define comportamento padrão (filtro, ordenação, alinhamento, validação).
- Comportamento padrão pode ser sobrescrito — mas o tipo sempre está lá.

### R5 — Dado sempre plano
- O Core nunca navega em objetos aninhados (`categoria.nome`).
- O Adapter é responsável por achatar antes de entregar.
- Uma linha = `Record<string, unknown>`. Sempre.

---

## REGRAS DE GIT

### R6 — GitHub Flow (hoje)
- `main` sempre deployável.
- Features e fixes em branches (`feature/*`, `fix/*`).
- PR contra `main`.

### R7 — Commits atômicos
- Um commit = uma mudança lógica. Não misture feature com refactor.
- Mensagem clara. O que FOI feito, não o que VOCÊ fez.

### R8 — Nada de commit de código quebrado
- `main` sempre passa em todos os testes. `npm test` antes do push.
- Se quebrou, conserte antes de commitar.

---

## REGRAS DE RELEASE

### R9 — SemVer estrito
- `MAJOR`: quebra API pública.
- `MINOR`: adiciona sem quebrar.
- `PATCH`: corrige bug.

### R10 — Checklist de release
Antes de qualquer release:
- [ ] Todos os testes passam.
- [ ] Nenhum código marcado como temporário (A) sem seu B mergeado.
- [ ] `CURRENT_PHASE.md` atualizado.
- [ ] `CHANGELOG` (se existir) ou tag com descrição das mudanças.

### R11 — Versão antiga congelada
- Hoje (fase solo): apenas a última versão recebe correções.
- Versões antigas continuam existindo (usuário fixa no `package.json`), mas não recebem patches.
- Isso pode mudar na fase OSS (LTS). Está registrado em `DECISIONS.md`.

---

## REGRAS DE TESTE

### R12 — Teste antes de entregar
- Toda feature nova tem teste.
- Todo bug fix tem teste que reproduz o bug.
- `npm test` passa antes de abrir PR.

### R13 — Teste isolado por camada
- Core é testado sem Render (testes unitários e de integração sem Vue).
- Render é testado com Core mockado ou integrado.
- Nada de testar Theme junto com Data Engine.

---

## REGRAS DE DEPENDÊNCIA

### R14 — Dependência externa = exceção justificada
- Só usar lib externa se: (a) reimplementar for desproporcional, E (b) a lib for forte/consolidada/completa.
- Toda dependência externa vive em **plugin ou borda de adapter**, nunca no Core.
- Toda dependência externa é **isolada atrás de uma interface interna** (adapter).

### R15 — Antes de adicionar dependência
1. A reimplementação é realmente inviável?
2. A lib é consolidada? (comunidade ativa, histórico, manutenção)
3. O que acontece se ela morrer? (o adapter isola — tem que ser substituível)
4. O autor aprovou?

---

## REGRAS DE DOCUMENTAÇÃO

### R16 — Documento atualizado com código
- Se o código muda, o documento correspondente muda junto.
- Se uma decisão nova é tomada, `DECISIONS.md` é atualizado.
- `CURRENT_PHASE.md` reflete o estado real, sempre.

### R17 — Código é documentação primária
- O comportamento deve ser compreensível lendo o código de uso.
- Documentos escritos são **apoio**, não substitutos de código claro.

---

## REGRAS PARA IAs

### R18 — IA segue as mesmas regras
- IAs desenvolvedoras devem ler `AI_GUIDE.md` antes de trabalhar.
- Se a IA violar uma regra, o código é rejeitado — mesmo que funcione.
- Se a IA sugerir algo que contradiz uma decisão, consultar o CKO ou o autor.

### R19 — IA não decide arquitetura
- IAs implementam, não decidem.
- Mudanças de escopo, API pública ou arquitetura passam pelo autor.
- Dúvida sobre "onde isso vive?" → `ARCHITECTURE.md`.

---

## RESUMO

| Categoria | Regra mais importante |
|---|---|
| Código | Core zero-dep, sempre |
| Dados | Linha Sagrada inviolável |
| Git | main sempre deployável e testada |
| Release | Nenhum release carrega dívida |
| Teste | Teste antes de entregar |
| Dependência | Isolada, justificada, substituível |
| Documentação | Atualizada com o código |
| IAs | Implementam, não decidem |

---

> **Documentos relacionados:** `docs/PRINCIPLES.md` (o porquê), `docs/DECISIONS.md` (decisões específicas), `.ai/AI_GUIDE.md` (regras para IAs), `CONTRIBUTING.md` (como contribuir).
