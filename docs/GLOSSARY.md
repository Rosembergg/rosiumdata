# GLOSSARY.md — rosiumdata

> **Vocabulário do projeto.** Definições precisas de todos os termos, conceitos e jargões usados na rosiumdata.  
> Se um termo não está aqui, ele não existe no projeto — ou precisa ser adicionado.

---

## CONCEITOS FUNDAMENTAIS

### Adapter
Peça que traduz o mundo externo (API REST, GraphQL, array local, banco de dados) para o formato que o Core entende. É a **fronteira** entre a rosiumdata e qualquer fonte de dados. Todo Adapter implementa a mesma interface (`DataAdapter`), independente da fonte. É o conceito que torna a rosiumdata universal: trocou de backend, troca o adapter; a tabela inteira continua idêntica.

→ Ver: `docs/ARCHITECTURE.md` — Camada 1

---

### Headless
Arquitetura onde o **cérebro** (lógica, estado, regras de negócio) é completamente independente da **interface visual** (framework, componentes). Na rosiumdata, o Core (`@rosiumdata/core`) é headless — JavaScript/TypeScript puro, funciona em qualquer lugar. A interface é uma "casca" (`@rosiumdata/nuxt`) que veste o cérebro. Portar para React = nova casca, mesmo cérebro.

→ Ver: `docs/ARCHITECTURE.md` — Camada 3

---

### Linha Sagrada
A fronteira inviolável entre **transformação de DADO** (que muda o valor lógico) e **transformação de APRESENTAÇÃO** (que muda só o visual). O DADO vive no Data Engine e vai para a exportação. A APRESENTAÇÃO vive no Theme/Render e **nunca** contamina o dado. É a cura do problema original: no PowerGrid, o estilo visual vazava para o Excel e corrompia os dados.

> Exemplo: `1 → "Ativo"` é DADO (vai pro Excel). `"Ativo"` em verde e negrito é APRESENTAÇÃO (NÃO vai pro Excel).

→ Ver: `docs/ARCHITECTURE.md` — Camada 2

---

### Dado plano (flat)
Uma linha de dados onde cada campo é um valor simples — sem objetos aninhados, sem arrays profundos. Ex: `{ id: 1, nome: "Coca", categoria_nome: "Bebidas", preco: 5.99 }`. A rosiumdata só trabalha com dados planos. Se a fonte manda dado aninhado (`categoria: { nome: "Bebidas" }`), o Adapter "achata" antes de entregar ao Core.

→ Ver: `docs/ARCHITECTURE.md` — Camada 1

---

### Core
O núcleo da rosiumdata: `@rosiumdata/core`. Contém o Data Engine + a interface do Adapter + definição de colunas e tipos + validação + sistema de eventos. É JavaScript/TypeScript puro, **zero dependências externas**, headless. Não contém: renderização, tema, plugins. É sagrado — "não pode ficar alterando o tempo todo".

→ Ver: `docs/ARCHITECTURE.md` — Core vs Plugin

---

### Plugin
Funcionalidade opcional que estende a rosiumdata sem inchar o Core. Vive nas bordas do projeto. Conecta-se ao Core via **ganchos oficiais** (hooks/eventos). Onde vivem as **dependências externas** (ex: lib de Excel). Exemplos: exportação CSV/Excel, seleção de linhas, cache, i18n.

→ Ver: `docs/ARCHITECTURE.md` — Plugins

---

### Casca
Apelido para o **Render Engine** — a camada que "veste" o cérebro (Core) com uma interface visual. Hoje a casca é Nuxt/Vue (`@rosiumdata/nuxt`). Amanhã pode ser React, Web Components, ou qualquer framework. A casca conhece o framework; o cérebro não.

→ Ver: `docs/ARCHITECTURE.md` — Camada 3

---

## CONCEITOS DE DESIGN

### Progressive Disclosure
Filosofia de design onde a lib funciona **out-of-the-box** com quase nada de configuração (convenção), mas permite "descer de nível" progressivamente para ter mais controle (configuração). O básico exige o mínimo de código. O complexo é possível sem reescrever tudo. É o oposto de "tudo ou nada".

→ Ver: `docs/PRINCIPLES.md` — Princípio #4

---

### Escape hatch
"Alçapão de fuga" — um mecanismo oficial que permite ao usuário sair do caminho padrão (convenção) e ter controle total sobre algo específico, **sem abandonar todo o resto**. Na rosiumdata, os escape hatches existem em dois níveis: **peça** (customizar uma coluna) e **camada** (trocar o Theme inteiro).

→ Ver: `docs/PRINCIPLES.md` — Princípio #5

---

### Sem parede
Princípio que garante que **customizar uma coisa específica nunca obriga a reconstruir tudo**. Se o usuário quer mudar só o visual de uma célula, ele não precisa reescrever o Data Engine. Se quer trocar o Adapter, não precisa mexer no Theme. Não existe o momento "tudo ou nada".

→ Ver: `docs/PRINCIPLES.md` — Princípio #5

---

### Porta de mão dupla
Decisão que é **conscientemente reversível**. Escolhe-se a opção mais simples para o momento atual, mas registra-se que pode ser mudada no futuro sem crise. Exemplo: "hoje GitHub Flow, amanhã Git Flow"; "hoje suporte só à última versão, amanhã LTS". Permite agilidade sem perder a visão de longo prazo.

→ Ver: `docs/DECISIONS.md`

---

### Default inteligente
Comportamento padrão que funciona bem para o caso mais comum, sem exigir configuração. O usuário não precisa tomar decisões para o básico funcionar. Exemplos: o tipo `numero` já alinha à direita, já filtra com `>`, `<`, `entre`, e já valida que o valor é numérico — sem o dev configurar nada.

→ Ver: `docs/PRINCIPLES.md` — Princípio #4

---

## CONCEITOS DE QUALIDADE

### Falhe Alto (Fail Loud)
Sistema que **denuncia** dado imperfeito de forma clara e localizada, em vez de esconder silenciosamente. Em desenvolvimento, grita com localização exata (coluna + linha + esperado vs. recebido). Em produção, mostra estado de erro visível na célula sem derrubar a tela. Cura o "catar feijão" — em vez de caçar o dado errado manualmente, a rosiumdata aponta o dedo.

→ Ver: `docs/PRINCIPLES.md` — Princípio #7

---

### Dívida consciente
Solução rápida (caminho A) que é aceita **temporariamente** para não deixar ninguém na mão, mas com a **obrigação** de ser substituída pela solução correta (caminho B). A dívida é "consciente" porque: (1) a task do B é registrada antes do A existir, (2) o B é desenvolvido em paralelo, (3) **nenhum release sobrevive com dívida** — se o B não estiver pronto, o release é travado.

→ Ver: `docs/PRINCIPLES.md` — Princípio #1

---

### Dependência descartável
Toda dependência externa que é **isolada** por uma interface interna (adapter) de forma que, se a dependência morrer ou for abandonada, **troca-se o adapter** sem afetar o resto do sistema. A rosiumdata não perde funcionalidade — só troca a peça. É o que garante a soberania.

→ Ver: `docs/PRINCIPLES.md` — Princípio #3

---

### Soberania
Princípio fundador: a rosiumdata não depende de código de terceiros para funcionar. O Core é zero dependências. Dependências externas são exceções justificadas que vivem isoladas nas bordas. Se qualquer dependência morrer, a rosiumdata continua de pé.

→ Ver: `docs/PRINCIPLES.md` — Princípio #3

---

## CONCEITOS DE PROCESSO

### Dogfooding
"Comer a própria ração" — a prática de usar o próprio produto para resolver problemas reais. A rosiumdata nasce como dogfooding: o autor a usa no seu projeto DDD (Laravel → Nuxt) antes de oferecê-la ao público. Isso valida a lib em condições reais antes do lançamento OSS.

→ Ver: `VISION.md`

---

### GitHub Flow
Estratégia de branches onde `main` é sempre deployável e toda feature/correção é uma branch curta que volta para `main` via Pull Request. Usada durante a fase solo do projeto. Mais leve que Git Flow.

→ Ver: `docs/DECISIONS.md` — D-016

---

### Git Flow
Estratégia de branches com `main` (produção), `develop` (integração), `feature/*`, `release/*` e `hotfix/*`. Oferece checkpoints formais para releases. Será adotada quando o projeto tiver comunidade/contribuidores.

→ Ver: `docs/DECISIONS.md` — D-016

---

### SemVer (Versionamento Semântico)
Esquema de versionamento `MAJOR.MINOR.PATCH`. Major quebra compatibilidade (usuário precisa adaptar). Minor adiciona funcionalidade sem quebrar. Patch corrige bug. Permite ao usuário fixar a versão que quiser.

→ Ver: `docs/DECISIONS.md` — D-018

---

### Release limpo
Um release que **não carrega dívida técnica**. Toda solução temporária (caminho A) foi substituída pela correta (caminho B) antes do release sair. É a garantia de qualidade da rosiumdata: cada versão pública está arquiteturalmente íntegra.

→ Ver: `docs/PRINCIPLES.md` — Princípio #1

---

### Caminho A / Caminho B
**A:** solução rápida, funcional, mas não ideal arquiteturalmente. Permitida para não deixar ninguém na mão.
**B:** solução correta, desacoplada, seguindo a arquitetura. Obrigatória. Deve substituir o A **antes do próximo release**.

→ Ver: `docs/PRINCIPLES.md` — Princípio #1

---

## TIPOS DE DADOS

### Coluna (Column)
A unidade fundamental de definição de uma tabela. Cada coluna tem: nome, tipo, máscara de exibição, transformação de valor, e comportamentos herdados do tipo.

### Tipo de coluna (Column Type)
Um **pacote de comportamento pronto** associado a uma coluna. Define automaticamente: operadores de filtro, método de ordenação, alinhamento padrão e validação (Falhe Alto). Tudo pode ser sobrescrito. Tipos iniciais: `texto`, `numero`, `data`, `data-hora`, `booleano`, `selecao`, `acao`.

### Action
Uma coluna especial que renderiza um **botão** (gatilho) em cada linha. A rosiumdata emite um evento com o dado da linha quando o botão é clicado. A lógica do que acontece depois (excluir, editar, navegar) é **100% responsabilidade do usuário** — a rosiumdata só fornece o gatilho. *"A rosiumdata é o transportador; você traz a arma."*

### Valor real
O valor **calculável** de uma coluna — sem máscara, sem formatação visual. Ex: `100` (número), não `"R$ 100,00"`. Usado para filtro, ordenação e exportação padrão.

### Receita de exibição (máscara)
A instrução de **como mostrar** o valor na tela para o humano. Ex: `"R$ #.##0,00"`, `"DD/MM/AAAA"`. Separada do valor real. **Não** vai para a exportação (por padrão).

---

> **Documentos relacionados:** `.ai/BRAIN.md` (índice), `docs/ARCHITECTURE.md` (onde os conceitos se aplicam), `docs/PRINCIPLES.md` (princípios por trás dos conceitos).
