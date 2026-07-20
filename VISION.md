# VISION.md — rosiumdata

> **Visão do projeto.** Por que existimos, o que queremos nos tornar e como chegaremos lá.

---

## NOSSA MISSÃO

Dar ao desenvolvedor uma forma **simples e robusta** de tratar e exibir dados em grade — sem acoplar dado, lógica, apresentação e estilo — mantendo **controle total** sobre cada camada.

---

## O PROBLEMA QUE RESOLVEMOS

Frameworks de Data Grid existentes (como o PowerGrid, que motivou este projeto) sofrem de um problema fundamental: **tudo acontece no mesmo lugar**. Buscar dados relacionados, filtrar, estilizar e exportar vivem nas mesmas funções de construção. Cada novo pedido vira uma gambiarra empilhada sobre a anterior. O sintoma mais grave: **o estilo visual vaza para a exportação e corrompe o dado.**

A causa-raiz não é "falta de features". É **falta de separação de responsabilidades**. Dado, lógica, apresentação e estilo estão acoplados — e quando você mexe em um, quebra o outro.

A rosiumdata resolve isso com uma arquitetura de camadas radicalmente separadas:

```
Data Source  →  Data Engine  →  Render Engine  →  Theme
```

Cada camada tem uma responsabilidade única. A exportação recebe **dado puro**, sem contaminação de estilo. O mesmo dado serve tela, filtro e Excel — íntegro, sempre.

---

## PARA ONDE VAMOS

### Hoje (Fase A — Dogfooding)

A rosiumdata nasce para resolver uma dor real e concreta: a migração de um projeto Laravel (PowerGrid) para Nuxt 3 com arquitetura DDD. O autor é o primeiro usuário e o teste de fogo da lib.

**Critério de sucesso da Fase A:** o autor consegue substituir o PowerGrid pela rosiumdata no seu projeto real, com menos código, mais clareza e zero gambiarra.

### Amanhã (Fase B — Open Source)

Com a lib validada pelo uso real (dogfooding), o objetivo é abri-la para a comunidade como um produto Open Source competitivo — concorrendo diretamente com TanStack Table, AG Grid e similares.

**Regra de ouro:** toda decisão tomada hoje (Fase A) deve ser compatível com o amanhã público (Fase B). Nada de atalhos que sirvam só para o autor e travem o futuro Open Source.

---

## NOSSO DIFERENCIAL

| Diferencial | Por que importa |
|---|---|
| **Separação radical de camadas** | Mexer no visual não quebra o dado. Mexer no dado não quebra o visual. Exportação recebe dado limpo. Fim do vazamento de estilo. |
| **Soberania (quase zero dependências)** | O Core é JavaScript/TypeScript puro, zero dependências externas. Dependências (quando inevitáveis) vivem isoladas em plugins/adapters, substituíveis a qualquer momento. Se uma lib morrer, a rosiumdata não morre. |
| **Headless por natureza** | O cérebro (Data Source + Data Engine) funciona em qualquer lugar — Nuxt, React, HTML puro. A interface visual é uma "casca" trocável. Portar para outro framework = nova casca, mesmo cérebro. |
| **Resolve rápido + mantém fácil** | Convenção por padrão (funciona com quase nada de código), configuração sempre possível (escape hatches por camada e por peça). Você nunca é forçado a reconstruir tudo para customizar uma coisa. |
| **Código como documentação** | Nada de mágica escondida. Todo comportamento é visível e rastreável no código de uso. Nenhuma convenção implícita que exija ler o manual para entender. |

---

## QUEM USA A rosiumdata

**Nosso público:** desenvolvedores que precisam resolver pedidos reais de tratamento de dados de um sistema — do caso mais simples ("só preciso mostrar estes dados na tela") ao mais complexo (relações, filtros avançados, exportação).

O perfil típico: um dev que quer **resolver o problema real da empresa**, não necessariamente um especialista no framework frontend. O teste de fogo é o próprio autor: um desenvolvedor backend Laravel aprendendo Nuxt.

**Não é nosso público:**
- Quem quer um "kit de UI" com componentes visuais e temas prontos (damos o mecanismo de estilização, não o catálogo de estilos).
- Quem precisa de dashboards, gráficos ou visualizações não-tabulares (o foco é grade/tabela).
- Quem quer um substituto do Excel/Google Sheets com fórmulas e colaboração em tempo real. Para isso, use Excel e Power BI — a rosiumdata é a **ponte** que entrega o dado limpo para essas ferramentas.

---

## COMO CHEGAMOS LÁ

O caminho até a versão 1.0 está dividido em fases sequenciais:

| Fase | Marco |
|---|---|
| **Fase 0** | Fundação: setup do monorepo, TypeScript, ferramentas. A casa antes dos móveis. |
| **Fase 1** | Data Engine + Colunas + Tipos. O cérebro puro, testável sem interface. |
| **Fase 2** | Adapter Local (array). Dados locais fluindo pelo Core. |
| **Fase 3** | Render Engine Nuxt + Theme Default. Primeira tabela visível. |
| **Fase 4** | Actions + Falhe Alto. Gatilhos de ação e diagnóstico de dados. |
| **Fase 5** | Adapter Server-side (Laravel). Conexão com o projeto real. |
| **= v1.0** | rosiumdata substituindo o PowerGrid no projeto DDD do autor. |
| **Pós-1.0** | Exportação, Seleção de linhas, Cache, e o caminho para o Open Source público. |

---

## NOSSAS ASPIRAÇÕES DE LONGO PRAZO

1. **Agnóstico de framework:** hoje Nuxt 3; amanhã React, Vue vanilla, Web Components, e potencialmente backends/outras linguagens consumindo o mesmo Core.
2. **Ecosystema de plugins:** exportação (Excel, CSV, PDF), temas, adapters para bancos/APIs populares, internacionalização, acessibilidade.
3. **Comunidade ativa:** contribuidores, documentação viva, casos de uso reais validando e expandindo a lib.
4. **Referência em arquitetura de Data Grid:** ser reconhecida como a lib que acertou a separação de responsabilidades que outras falharam em fazer.

---

## O QUE NÃO QUEREMOS SER

- **Não somos um kit de UI.** Não entregamos catálogo de temas bonitos. Entregamos o mecanismo para você aplicar SUA identidade visual.
- **Não somos uma ferramenta de BI.** Não fazemos gráficos, dashboards, análises estatísticas. Somos a **ponte** que entrega dado limpo para essas ferramentas.
- **Não somos um substituto do Excel.** Não temos fórmulas, células que se referenciam, colaboração em tempo real.
- **Não somos "mais uma tabela bonita".** Somos uma plataforma de **tratamento de dados** que, incidentalmente, desenha uma tabela.

---

## TOM DE VOZ

A rosiumdata é **técnica, direta e sem firulas**. Não prometemos mágica — prometemos arquitetura sólida e decisões conscientes. Nosso "marketing" é a qualidade do código e a clareza da documentação.

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice geral), `docs/PRINCIPLES.md` (princípios), `docs/ARCHITECTURE.md` (arquitetura), `docs/ROADMAP.md` (fases).
