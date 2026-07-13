# AI_GUIDE.md — Guia para IAs Desenvolvedoras

> **Leia antes de escrever qualquer código na RSdata.** Você é uma IA desenvolvedora — não é o CKO. Siga estas regras.

---

## O QUE VOCÊ PODE FAZER

- ✅ Implementar código dentro do que já foi decidido (Roadmap, Arquitetura, Features).
- ✅ Escrever testes com Vitest.
- ✅ Refatorar para pagar dívida técnica (caminho B).
- ✅ Sugerir melhorias na implementação (não na arquitetura).
- ✅ Corrigir bugs.

## O QUE VOCÊ NUNCA PODE FAZER

- ❌ Mudar a API pública do Core.
- ❌ Adicionar dependência externa ao `@rsdata/core` (Core = zero-dep, sempre).
- ❌ Quebrar a **Linha Sagrada**: estilo nunca vaza para dado, dado nunca carrega estilo.
- ❌ Adicionar "mágica" ou comportamento implícito não-visível no código de uso (Princípio #6).
- ❌ Alterar escopo — sugerir features fora do Roadmap sem consultar o autor.
- ❌ Escolher dependências externas sem aprovação + justificativa de soberania.
- ❌ Gerar documentação que contradiga os documentos oficiais.

---

## O QUE FAZER EM CADA SITUAÇÃO

| Situação | Ação |
|---|---|
| Vai implementar algo | Leia o `CURRENT_PHASE.md` e a fase correspondente no `ROADMAP.md`. |
| Encontrou algo que contradiz uma decisão | **Pare.** Consulte o CKO (Brain Builder) ou o autor. Não decida sozinha. |
| Precisa de uma lib externa | **Pare.** Justifique. A lib é forte/consolidada? Pode ser isolada em plugin/adapter? |
| O usuário pediu algo fora do escopo | Lembre: RSdata é read-only, tabular, sem mágica. Recuse educadamente. |
| Não sabe onde algo vive | Consulte `ARCHITECTURE.md` — cada camada tem responsabilidades claras. |

---

## REGRAS INVioláveis

1. **Core = zero dependências.** Comprovável pelo `package.json` do `packages/core/`.
2. **Linha Sagrada inviolável.** DADO (transformação de valor) no Data Engine. APRESENTAÇÃO (cor, negrito) no Theme. Nunca se misturam. Exportação = dado puro.
3. **Nada de mágica.** Código de uso é a documentação primária. Comportamento visível.
4. **Nada de gambiarra.** Se não há caminho oficial, é bug de design — crie o gancho, não a gambiarra.
5. **Release sempre limpo.** Nenhum código temporário sobrevive a release.

---

## FLUXO RECOMENDADO

1. Leia `BRAIN.md` (5 min — visão geral).
2. Leia `CURRENT_PHASE.md` (2 min — onde estamos).
3. Leia a fase atual no `ROADMAP.md` (2 min — o que entregar).
4. Leia `ARCHITECTURE.md` se precisar de detalhes de camadas.
5. **Implemente.** Teste. Commite.

---

## DOCUMENTOS QUE VOCÊ PRECISA CONHECER

| Prioridade | Documento | Por que |
|---|---|---|
| 🔴 Obrigatório | `BRAIN.md` | Índice de todo o conhecimento |
| 🔴 Obrigatório | `CURRENT_PHASE.md` | Onde estamos agora |
| 🔴 Obrigatório | `docs/ARCHITECTURE.md` | Onde cada coisa vive |
| 🟡 Recomendado | `docs/PRINCIPLES.md` | Os 7 princípios |
| 🟡 Recomendado | `docs/ROADMAP.md` | Fases e prioridades |
| 🟢 Quando precisar | `docs/GLOSSARY.md` | Significado dos termos |
| 🟢 Quando precisar | `docs/DECISIONS.md` | Por que decidimos X |
| 🟢 Quando precisar | `docs/FEATURES.md` | Lista de funcionalidades |
