# PRINCIPLES.md — RSdata

> **Princípios que guiam o projeto.** Toda decisão técnica, de design ou de produto deve passar por estes princípios. Se algo os viola, a decisão está errada — ou o princípio precisa ser revisado (com justificativa).

---

## OS 7 PRINCÍPIOS

### 1. Dívida Consciente, Nunca Abandonada

> Pode fazer o rápido para não deixar ninguém na mão. Mas o correto é obrigatório — e jamais sobrevive a um release.

**Regra:**
- Uma solução rápida (caminho A) pode existir para resolver uma dor urgente.
- A task da solução correta (caminho B) **precisa estar registrada antes** do A ir para produção.
- O B é desenvolvido em paralelo (branch separada) e mergeado quando pronto.
- **Nenhum release sai com dívida técnica.** Se o B não estiver pronto, o release é travado.

**Motivação:** evita que o "funciona, depois arrumo" vire permanente — que foi exatamente como o PowerGrid virou um monstro no projeto original.

**Relação com outros princípios:** este princípio protege a qualidade arquitetural (#2, #3) e a integridade do Core (#4).

---

### 2. A Lib Nunca Força à Gambiarra

> Se não existe um caminho oficial para fazer algo, isso é bug de design nosso — não culpa do usuário.

**Regra:**
- Toda feature da RSdata tem uma "porta oficial" de extensão: ganchos, eventos, adapters, substituição de componentes.
- Se um usuário precisa de algo que não tem caminho oficial, a resposta NUNCA é "dá um jeito aí". A resposta é: **criamos o caminho oficial.**
- A extensibilidade é um direito do usuário, não um favor que a lib concede.

**Motivação:** no PowerGrid, o usuário era forçado a distorcer a lib para atender pedidos reais — porque a arquitetura fechada não oferecia saída. A RSdata aprende com esse erro.

**Relação com outros princípios:** sustenta o #3 (extensibilidade por ganchos) e o #5 (customização sem parede).

---

### 3. Dependência Descartável

> Core = zero dependências. Dependências externas só nas bordas, isoladas por interface, substituíveis. Se a lib morrer, a RSdata sobrevive.

**Regra:**
- O **Core** (`@rosiumdata/core`) tem **zero dependências externas de runtime**. Nenhuma. É TypeScript puro.
- Quando uma dependência externa é inevitável (ex: lib para gerar .xlsx), ela:
  - Vive **fora do Core** (em um plugin ou na borda de um adapter).
  - É **isolada** atrás de uma interface interna. O Core nunca chama a lib diretamente.
  - É **substituível**: troca-se o adapter/plugin, não o projeto inteiro.
- Toda dependência externa precisa ser justificada: a reimplementação seria desproporcional E a lib é forte/consolidada/completa no mercado.

**Motivação:** o autor não quer que uma peça crítica do seu projeto DDD fique refém de código de terceiros. Se uma dependência morrer ou mudar de licença, a RSdata continua de pé.

**Relação com outros princípios:** é a base da Soberania que define a Identidade do projeto. Garante que #1 (dívida) nunca seja imposta por uma lib externa.

---

### 4. Híbrido / Progressive Disclosure

> Convenção por padrão para resolver rápido. Configuração sempre possível para controle total. Nunca fecha a porta.

**Regra:**
- A RSdata funciona **out-of-the-box** com quase nada de configuração. O caso simples ("só mostrar dados") exige o mínimo de código.
- Quando o pedido complexo chega, o usuário "desce de nível" — **sem reescrever tudo**.
- A unidade de customização é a **peça** (coluna, filtro, célula) ou a **camada** (tema, adapter, render). Descer de nível é sempre opcional e localizado.
- **Nunca é "tudo ou nada".** Customizar uma coisa específica não obriga a abandonar o modo fácil em todo o resto.

**Motivação:** o público inclui desde o dev que só quer mostrar dados até o que precisa de filtros complexos com exportação. A lib serve os dois sem forçar o simples a aprender o complexo, nem o complexo a lutar contra o simples.

**Relação com outros princípios:** anda de mãos dadas com #5 (customização em 2 níveis) e #6 (explícito — o que foi customizado é visível).

---

### 5. Customização em Dois Níveis, Sem Parede

> Sobrescreva a peça OU a camada. Nunca é forçado a reconstruir tudo para mudar uma coisa.

**Regra:**
- **Nível PEÇA (o mais frequente):** customizar algo pontual — uma coluna, uma célula, um cabeçalho, um filtro, um botão. Sem tocar em mais nada.
- **Nível CAMADA (o mais poderoso):** substituir ou estender uma camada inteira — trocar o Theme, plugar outro Data Source, customizar o comportamento do Data Engine.
- A decisão de customizar uma peça nunca te obriga a mexer na camada. Customizar uma camada nunca te obriga a reconstruir as outras.
- Isso se aplica à lógica (filtro, transformação) e ao visual (CSS, substituição de componente).

**Motivação:** o maior risco do modelo híbrido (#4) é a "parede" — o momento em que o usuário faz tudo fácil no modo convenção, aí precisa de uma coisinha a mais, e descobre que para customizar aquilo tem que jogar tudo fora e reconstruir do zero. Este princípio existe para garantir que essa parede nunca exista.

**Relação com outros princípios:** é a implementação concreta do #4. Reforça #2 (sempre há caminho oficial).

---

### 6. Explícito Acima de Mágico

> Comportamento sempre visível no código de uso. O código é a documentação primária.

**Regra:**
- Nenhum comportamento "automágico" escondido. Se algo acontece na tabela, o código de uso **mostra** que aquilo foi configurado.
- Preferimos verbosidade honesta a "mágica" invisível que ninguém entende depois.
- O código de uso da RSdata é a **documentação primária**. A documentação escrita é apoio, não pré-requisito para entender o que está acontecendo.
- Nada de convenções implícitas que exijam ler o manual para entender o comportamento (ex: "toda coluna chamada `preco` é automaticamente formatada como dinheiro").

**Motivação:** o público-alvo inclui o dev que quer resolver rápido e vai aprendendo a lib gradativamente conforme usa — lendo o próprio código, não decorando um manual. Se o comportamento não está visível no código, a lib falhou.

**Relação com outros princípios:** reforça #2 (não escondemos limitações atrás de mágica), #5 (customização visível, não escondida) e a Manutenibilidade.

---

### 7. Falhe Alto no Dev, Seguro na Produção

> Dado imperfeito nunca é silencioso. Mas a forma de denunciar depende do contexto.

**Regra:**
- **Em desenvolvimento:** a RSdata grita. Aponta exatamente: qual coluna, qual linha, o que esperava e o que recebeu. O dev descobre o problema na hora, sem "catar feijão" atrás do dado errado.
- **Em produção:** não derruba a tela do usuário final. Mostra um estado de erro visível na célula problemática, mantém o resto da tabela funcionando, e reporta o problema para o dev.
- **Nunca silencioso:** a RSdata jamais esconde um dado errado sem avisar. Silêncio = dado parece correto mas não é — o pior cenário possível.

**Motivação:** a dor real do autor era ter que caçar manualmente qual dado estava errado no meio de uma tabela, sem nenhuma ajuda da lib. O Falhe Alto transforma "catar feijão" em "apontar o dedo".

**Relação com outros princípios:** coerente com #6 (explícito até nos erros) e com #1 (dado errado exposto cedo evita dívida técnica escondida).

---

## COMO USAR ESTES PRINCÍPIOS

### Para tomar uma decisão

Quando houver dúvida sobre como implementar algo, passe pelos 7 princípios:

1. Isso cria dívida técnica? Se sim, já registrei a task do caminho B? (#1)
2. O usuário consegue fazer isso sem gambiarra? Tem porta oficial? (#2)
3. Precisa de dependência externa? Se sim, está isolada e justificada? (#3)
4. Funciona out-of-the-box com default? E dá pra customizar depois? (#4)
5. A customização é granular? Ou obriga a reconstruir tudo? (#5)
6. O comportamento é visível no código de uso? Ou é mágica escondida? (#6)
7. Se o dado vier errado, o que acontece? É silencioso? (#7)

### Para avaliar uma contribuição externa

Toda contribuição (PR, sugestão, plugin) deve:
- Não violar nenhum princípio.
- Se propuser violar um princípio, deve justificar por que o princípio deveria ser revisado.
- Preferir simplicidade e explicitude a "inteligência" e mágica.

### Para resolver conflitos entre princípios

Se dois princípios entrarem em conflito, a ordem de prioridade é:

1. **Integridade do dado** (Linha Sagrada) — acima de tudo.
2. **Core sagrado** (#3 + zero-dependência) — a fundação não se compromete.
3. **Explícito acima de mágico** (#6) — se não é visível, não existe.
4. Os demais princípios, balanceados pelo contexto.

---

## O QUE NÃO SÃO PRINCÍPIOS (mas parecem)

| Não-princípio | Por que não é |
|---|---|
| "Sempre a tecnologia mais nova" | Não. Escolhemos ferramentas maduras e coerentes com o ecossistema (unbuild, vitest). |
| "Código mais curto possível" | Não. Preferimos clareza a concisão (#6). Alguma verbosidade é bem-vinda se aumenta compreensão. |
| "Performance acima de tudo" | Não. Performance importa, mas não sacrificamos clareza (#6) ou separação de camadas (#3) por micro-otimizações prematuras. |
| "Agradar todos os públicos" | Não. Já definimos quem NÃO é nosso público (ver VISION.md). Foco. |

---

> **Documentos relacionados:** `VISION.md` (identidade e visão), `docs/ARCHITECTURE.md` (como os princípios viram código), `docs/DECISIONS.md` (decisões que aplicam estes princípios).
