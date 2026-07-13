# CONTRIBUTING.md — RSdata

> **Guia para contribuir com o projeto.** Leve e direto — expandível conforme o projeto crescer.

---

## ANTES DE CONTRIBUIR

Leia estes documentos (não precisa decorar, mas conheça a essência):

1. **[BRAIN.md](./BRAIN.md)** — índice de todo o conhecimento do projeto. Leia ao menos as seções de Identidade, Princípios e Arquitetura.
2. **[VISION.md](./VISION.md)** — quem somos, o que queremos e o que NÃO queremos.
3. **[docs/PRINCIPLES.md](./docs/PRINCIPLES.md)** — os 7 princípios que guiam cada decisão.

Se for usar IA para contribuir, leia também: **[.ai/AI_GUIDE.md](./.ai/AI_GUIDE.md)**.

---

## COMO CONTRIBUIR

### Fluxo (GitHub Flow)

```
main (sempre deployável)
  └── sua-branch (feature/fix)
        └── Pull Request → main
```

1. **Crie uma branch** a partir de `main`.
2. **Desenvolva e teste** sua contribuição.
3. **Abra um Pull Request** contra `main`.
4. **Aguarde revisão.**

### O que toda contribuição precisa

- [ ] Não viola nenhum dos 7 princípios (`docs/PRINCIPLES.md`).
- [ ] Não quebra a Linha Sagrada (estilo nunca vaza para dado).
- [ ] Não adiciona dependência externa ao Core (`@rsdata/core` é zero-dep).
- [ ] Código é explícito — sem mágica escondida (Princípio #6).
- [ ] Testes cobrem o novo comportamento.
- [ ] Se for uma feature nova, está alinhada com o Roadmap e o `FEATURES.md`.

### Commits

Nada de convenção estrita por enquanto. Apenas mensagens claras e em português ou inglês — o que for mais natural.

---

## O QUE PODE SER CONTRIBUÍDO

| Tipo | Exemplos |
|---|---|
| 🐛 **Bug fix** | Corrigir comportamento quebrado, Falhe Alto que não dispara, filtro que não funciona. |
| ✨ **Feature do Roadmap** | Qualquer item das fases ativas ou planejadas (`docs/ROADMAP.md`). |
| 🧪 **Testes** | Aumentar cobertura, testar casos de borda. |
| 📝 **Documentação** | Correções, melhorias, traduções. |
| 🔌 **Plugin** | Funcionalidade opcional que estende a RSdata sem tocar no Core. |

### O que precisa ser discutido antes

- Novas features **fora** do Roadmap atual.
- Qualquer mudança na **API pública** do Core.
- Adição de **dependência externa** (Princípio #3 — precisa de justificativa).
- Mudanças que **quebrem a arquitetura** de camadas.

Nesses casos, **abra uma issue primeiro** para discutir.

---

## ESTRUTURA DO PROJETO

```
RSdata/
├── packages/
│   ├── core/        ← @rsdata/core (JS/TS puro, zero-dep)
│   └── nuxt/        ← @rsdata/nuxt (casca Vue/Nuxt)
├── docs/            ← Documentação detalhada
├── .ai/             ← Guias para IAs
├── VISION.md
├── BRAIN.md
└── CONTRIBUTING.md  ← você está aqui
```

---

## AMBIENTE DE DESENVOLVIMENTO

```bash
# Instalar dependências
npm install

# Rodar testes (todos os pacotes)
npm test

# Build
npm run build
```

*(Scripts detalhados serão definidos durante a Fase 0.)*

---

## PERGUNTAS?

Abra uma issue no GitHub. Este projeto ainda está em fase inicial — toda contribuição e dúvida é bem-vinda.
