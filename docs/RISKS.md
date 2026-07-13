# RISKS.md — RSdata

> **Riscos do projeto.** O que pode dar errado, qual o impacto e como mitigamos.  
> Atualizado conforme o projeto evolui e novos riscos são identificados.

---

## RISCOS TÉCNICOS

### R-001: Reatividade própria se tornar complexa demais

**Risco:** O Data Engine é JS puro e precisa de um sistema de eventos (reatividade própria) para se comunicar com o Render Engine. Existe o risco de, ao tentar replicar funcionalidades que o Vue oferece "de graça" (`ref`, `computed`, `watch`), acabarmos reinventando a roda de forma frágil ou complexa.

**Impacto:** Alto. A reatividade própria é a espinha dorsal da comunicação entre camadas. Se for mal feita, toda a arquitetura headless sofre.

**Mitigação:**
- Manter o sistema de eventos **mínimo e simples**. Apenas o necessário para o Core funcionar. Nada de "reatividade reativa" complexa.
- A casca Nuxt (`useRsTable()`) é a única responsável por "traduzir" eventos puros para a reatividade do Vue. Se essa tradução for problemática, o problema fica contido na casca.
- Testar exaustivamente o sistema de eventos na Fase 1, antes de qualquer casca existir.

**Probabilidade:** Média
**Severidade:** Alta

---

### R-002: Complexidade do monorepo atrasar o desenvolvimento

**Risco:** A estrutura monorepo com npm workspaces, builds separados e pacotes interdependentes adiciona complexidade de configuração. Para um desenvolvedor solo, isso pode consumir tempo que deveria ser gasto no código do Core.

**Impacto:** Médio. Atraso na Fase 0, mas não compromete o projeto. Uma vez configurado, o monorepo "some" e o dia a dia é igual ao pacote único.

**Mitigação:**
- A Fase 0 é dedicada exclusivamente a isso. Sem pressa.
- Documentar o setup no próprio repositório (README, scripts).
- Se a configuração se mostrar muito problemática, reavaliar: a decisão do monorepo é "dificilmente reversível", mas não "impossível".

**Probabilidade:** Baixa
**Severidade:** Média

---

### R-003: Dependência externa em plugin quebrar

**Risco:** Plugins (ex: exportação Excel) dependem de bibliotecas de terceiros. Se a lib for abandonada, tiver breaking change inesperado, ou mudar de licença, o plugin quebra.

**Impacto:** Baixo. O plugin é isolado. A RSdata (Core + Render) continua funcionando. Só a feature de exportação é afetada.

**Mitigação:**
- Princípio #3 (Dependência Descartável): toda dependência é isolada por interface.
- Só usar libs "fortes, consolidadas e completas" (critério do autor).
- Se uma lib quebrar, troca-se o adapter do plugin — o resto não sente.

**Probabilidade:** Média (toda lib tem risco de abandono)
**Severidade:** Baixa (isolada)

---

### R-004: Typescript aumentar a barreira de entrada para contribuidores

**Risco:** TypeScript, embora seja padrão do mercado OSS, pode afastar contribuidores que só conhecem JavaScript.

**Impacto:** Baixo. O autor já decidiu TypeScript. A comunidade OSS moderna espera TypeScript.

**Mitigação:**
- A API consumida pelo usuário é bem tipada e fornece autocomplete — isso é vantagem, não barreira.
- Quem contribui precisa saber TS, mas é o esperado para uma lib moderna.

**Probabilidade:** Baixa
**Severidade:** Baixa

---

### R-005: Monorepo travar publicação no npm

**Risco:** Publicar múltiplos pacotes de um monorepo no npm registry pode ter complexidades (versões sincronizadas, ordem de build, workspace links).

**Impacto:** Médio. Afeta apenas o momento de publicação (pós-1.0). Não afeta o desenvolvimento.

**Mitigação:**
- Ferramentas como `changesets` ou scripts de release automatizam isso.
- Só será enfrentado quando a Fase 5 estiver concluída. Tempo para pesquisar a melhor abordagem.

**Probabilidade:** Baixa
**Severidade:** Média

---

## RISCOS DE PRODUTO

### R-006: O autor não conseguir usar a própria lib no projeto real

**Risco:** O objetivo da v1.0 é a RSdata substituir o PowerGrid no projeto DDD do autor. Se, ao chegar na Fase 5, a lib não for capaz de atender os casos reais, o propósito central falha.

**Impacto:** Crítico. A lib existe para resolver essa dor.

**Mitigação:**
- Dogfooding desde o início: cada fase é testada contra cenários reais do projeto, não apenas testes unitários abstratos.
- O Adapter Laravel (Fase 5) é desenhado especificamente para o projeto real do autor.
- Se algo não funcionar, é sinal de que a arquitetura precisa de ajuste — e o ajuste é feito. A lib serve ao autor primeiro.

**Probabilidade:** Baixa (a arquitetura foi desenhada a partir da dor real)
**Severidade:** Crítica

---

### R-007: Escopo crescer descontroladamente

**Risco:** Conforme o projeto avança, novas ideias e "seria legal ter X" podem inflar o escopo e atrasar a v1.0 indefinidamente. É assim que projetos solo morrem.

**Impacto:** Alto. Feature creep é uma das maiores causas de abandono de projetos.

**Mitigação:**
- Roadmap com fases bem definidas e backlog claro.
- Princípio #2: se não tem caminho oficial, é bug de design — mas nem toda ideia vira caminho oficial.
- Princípio #4: a lib é híbrida. Se algo não está no Core, o usuário pode estender por fora (escape hatch). Nem tudo precisa ser nativo.
- Fora de escopo explícito: já decidimos o que NÃO somos.

**Probabilidade:** Média (comum em projetos apaixonados)
**Severidade:** Alta

---

### R-008: Comunidade não adotar (fase B)

**Risco:** Quando a RSdata for aberta como OSS, pode não atrair usuários. TanStack Table, AG Grid e outros já têm comunidade, confiança e ecossistema.

**Impacto:** Médio. A lib já terá cumprido seu propósito primário (resolver a dor do autor). A fase B é ambição, não necessidade. Mas seria uma decepção.

**Mitigação:**
- Diferencial real e palpável: separação de camadas, Linha Sagrada, soberania. Não é "mais uma tabela".
- Experiência real validada (dogfooding) — a lib resolveu um problema concreto, não foi construída no vácuo.
- Documentação de qualidade desde o início (os documentos que estamos gerando).

**Probabilidade:** Média
**Severidade:** Média

---

## RISCOS DE PROCESSO

### R-009: Pausas longas por outras demandas

**Risco:** O autor não tem tempo fixo. Outras demandas podem interromper o desenvolvimento por períodos longos, causando perda de contexto e momentum.

**Impacto:** Alto. Projetos solo param assim.

**Mitigação:**
- `CURRENT_PHASE.md` como "mapa" para retomar rapidamente.
- `.ai/BRAIN.md` como índice geral do conhecimento.
- Documentação extensa (a que estamos gerando) para que o autor — ou qualquer IA — possa retomar de onde parou sem precisar reler tudo.
- Fases pequenas e bem definidas: cada fase tem começo, meio e fim claros.

**Probabilidade:** Alta (é a realidade do autor)
**Severidade:** Média (com mitigação)

---

### R-010: Perda de conhecimento por não documentar decisões

**Risco:** Decisões tomadas em conversas, issues ou na cabeça do autor podem ser esquecidas. Em 6 meses, "por que fizemos assim?" pode não ter resposta.

**Impacto:** Médio. Leva a retrabalho ou decisões contraditórias.

**Mitigação:**
- `DECISIONS.md` como registro formal de cada decisão importante.
- `.ai/BRAIN.md` como resumo executivo de tudo.
- Este documento (`RISKS.md`) como registro do que pode dar errado.
- Atualizar os documentos quando novas decisões forem tomadas.

**Probabilidade:** Baixa (já estamos mitigando)
**Severidade:** Média

---

### R-011: IAs desenvolvedoras violarem princípios

**Risco:** IAs usadas para escrever código podem, sem querer, violar princípios (ex: adicionar dependência no Core, quebrar a Linha Sagrada, usar mágica).

**Impacto:** Médio. Código que viola princípios gera dívida técnica e corrói a arquitetura.

**Mitigação:**
- `AI_GUIDE.md` com regras claras do que a IA pode e não pode fazer.
- `.ai/BRAIN.md` como leitura obrigatória antes de qualquer IA tocar no código.
- Revisão humana (autor) de todo código gerado por IA.
- Princípio #2: se a IA propuser algo sem caminho oficial, é bug de design.

**Probabilidade:** Média
**Severidade:** Média

---

## QUADRO RESUMO

| ID | Risco | Probabilidade | Severidade |
|---|---|---|---|
| R-001 | Reatividade própria complexa | Média | Alta |
| R-002 | Complexidade do monorepo | Baixa | Média |
| R-003 | Dependência externa quebrar | Média | Baixa |
| R-004 | TypeScript como barreira | Baixa | Baixa |
| R-005 | Publicação no npm travar | Baixa | Média |
| R-006 | Lib não funcionar no projeto real | Baixa | Crítica |
| R-007 | Escopo crescer sem controle | Média | Alta |
| R-008 | Comunidade não adotar | Média | Média |
| R-009 | Pausas longas por demandas | Alta | Média |
| R-010 | Perda de conhecimento | Baixa | Média |
| R-011 | IAs violarem princípios | Média | Média |

---

> **Documentos relacionados:** `docs/DECISIONS.md` (decisões mitigadoras), `docs/FUTURE.md` (riscos de longo prazo), `docs/PRINCIPLES.md` (princípios que protegem contra riscos).
