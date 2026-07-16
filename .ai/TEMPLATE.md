# TEMPLATE.md — Kickoff de Fases

> Como gerar o prompt de kickoff para cada fase do RSdata.
> **Regra:** o prompt de cada fase só é gerado QUANDO a fase anterior estiver concluída,
> incorporando aprendizados e ajustes reais. Nada de pré-escrever prompts para o futuro.

---

## ESTRUTURA DO PROMPT

Todo kickoff segue esta estrutura:

```
Você é um desenvolvedor trabalhando no projeto RSdata.

ANTES DE COMEÇAR, leia estes arquivos na ordem:
1. .ai/BRAIN.md
2. docs/CURRENT_PHASE.md
3. docs/ARCHITECTURE.md — [seções relevantes para a fase]
4. docs/ROADMAP.md — seção "[nome da fase]"
5. docs/PROJECT_RULES.md
6. .ai/AI_GUIDE.md

TAREFA: Implementar a [NOME DA FASE].

Entregas:
- [lista de entregas baseada no ROADMAP.md, revisada pós-fase anterior]

REGRAS ESPECÍFICAS DESTA FASE:
- [regras contextuais — ex: "não use Vue", "lembre da Linha Sagrada"]

CRITÉRIO DE CONCLUSÃO:
- [ex: "npm test passa em todos os cenários X, Y, Z"]

AO FINAL:
- Atualize docs/CURRENT_PHASE.md (marque fase como concluída)
- Reporte qualquer decisão nova tomada durante a implementação
```

---

## QUEM GERA O PROMPT

O **Brain Builder (CKO)** gera o prompt de cada fase, com base em:

1. **O que o ROADMAP.md define** para aquela fase.
2. **Ajustes descobertos na fase anterior** (ex: "a interface do Adapter precisou de um campo extra, registre isso no prompt da Fase 2").
3. **Decisões novas** registradas em DECISIONS.md.

O autor **apenas copia e cola** o prompt no novo chat com a IA desenvolvedora.

---

## QUANDO GERAR

Sempre **após** a fase anterior estar:
- [ ] Implementada e testada (todos os testes passam)
- [ ] Revisada pelo autor
- [ ] Mergeada na main
- [ ] CURRENT_PHASE.md atualizado
- [ ] DECISIONS.md atualizado (se novas decisões foram tomadas)

Nunca gere o prompt da Fase N antes da Fase N-1 estar concluída.

---

## EXEMPLO: KICKOFF DA FASE 0

```
Você é um desenvolvedor trabalhando no projeto RSdata.

ANTES DE COMEÇAR, leia estes arquivos na ordem:
1. .ai/BRAIN.md
2. docs/CURRENT_PHASE.md
3. docs/ARCHITECTURE.md — seção "Estrutura do Repositório"
4. docs/ROADMAP.md — seção "Fase 0"
5. docs/PROJECT_RULES.md — regras R1 a R19
6. .ai/AI_GUIDE.md

TAREFA: Implementar a Fase 0 — Fundação.

Entregas:
- Inicializar repositório Git (se ainda não feito)
- Criar package.json raiz com npm workspaces apontando para packages/*
- Criar packages/core/package.json (@rsdata/core, ZERO dependências de runtime)
- Criar packages/nuxt/package.json (@rsdata/nuxt, depende de @rsdata/core via workspace:*)
- Criar tsconfig.json base na raiz + tsconfig específicos para core e nuxt
- Configurar unbuild em ambos os pacotes (build.config.ts)
- Configurar Vitest (vitest.config.ts na raiz)
- Criar estrutura de pastas:
  packages/core/src/{engine,columns,adapter,filters,sorting,pagination,validation,events,index.ts}
  packages/nuxt/src/{components,composables,theme,index.ts}
- Scripts: "build" (compila core → nuxt), "test" (vitest), "dev" (watch mode)
- Criar um teste de fumaça (smoke test) que importa @rsdata/core e verifica que o pacote existe
- Garantir que npm install && npm test && npm run build funcionem sem erros

REGRAS ESPECÍFICAS DESTA FASE:
- @rsdata/core NÃO PODE ter nenhuma dependência de runtime. package.json: "dependencies": {}
- @rsdata/nuxt PODE depender de @rsdata/core e de Vue/Nuxt (é a casca)
- Todo código é TypeScript strict
- Nada de código de negócio ainda — só estrutura e ferramentas
- Se algo não estiver claro nos documentos, pergunte antes de decidir

CRITÉRIO DE CONCLUSÃO:
- npm install executa sem erros
- npm test passa (pelo menos o smoke test)
- npm run build gera os artefatos em packages/*/dist/
- Estrutura de pastas confere com ARCHITECTURE.md

AO FINAL:
- Atualize docs/CURRENT_PHASE.md (marque Fase 0 como ✅, inicie Fase 1)
- Liste quaisquer decisões técnicas tomadas durante o setup (ex: versões específicas, configurações adicionais)
```

---

## KICKOFF DA FASE 1

> Gerado após conclusão da Fase 0. Prompt validado e documentado.

```
Você é um desenvolvedor trabalhando no projeto RSdata.

ANTES DE COMEÇAR, leia estes arquivos na ordem:
1. .ai/BRAIN.md
2. docs/CURRENT_PHASE.md
3. docs/ARCHITECTURE.md — seções "Camada 2 — Data Engine", "Colunas e Tipos",
   "A Linha Sagrada", "Reatividade própria", "Modelo: Instância viva com eventos"
4. docs/ROADMAP.md — seção "Fase 1"
5. docs/FEATURES.md — seção "Fase 1 — Data Engine + Colunas + Tipos"
6. docs/PRINCIPLES.md — foco nos princípios #3, #4, #5, #6, #7
7. docs/PROJECT_RULES.md
8. .ai/AI_GUIDE.md

TAREFA: Implementar a Fase 1 — Data Engine + Colunas + Tipos.

O QUE IMPLEMENTAR (em packages/core/src/):

1. INTERFACE DO ADAPTER (adapter/index.ts):
   - Definir a interface DataAdapter com os métodos:
     fetch(query): Promise<FetchResult>
     fetchAll(query): Promise<Row[]>
     fetchFilterOptions?(column: string): Promise<FilterOption[]>
   - Tipos: Query, FetchResult, Row, FilterOption
   - Query contém: filters[], sort?, page, pageSize

2. TIPOS DE COLUNA (columns/index.ts):
   - Tipo ColumnType: 'texto' | 'numero' | 'data' | 'data-hora' | 'booleano' | 'selecao' | 'acao'
   - Cada tipo é um PACOTE DE COMPORTAMENTO PRONTO:
     * Operadores de filtro padrão (texto: contém/igual; numero: = > < entre; etc.)
     * Método de ordenação padrão
     * Alinhamento padrão (texto: esquerda; numero: direita; etc.)
     * Validação (Falhe Alto): o que é um valor válido para este tipo
   - Definição de coluna: { key, type, label?, mask?, transform?, options? }
   - Função coluna(key, config) para criar definição declarativa
   - TUDO SOBRESCREVÍVEL (Princípio #5)

3. DATA ENGINE — CLASSE RsTable (engine/index.ts):
   - Instância viva com estado mutável + eventos (Princípio #4)
   - Estado: filtros ativos, ordenação, página atual, definição de colunas
   - API explícita (Princípio #6):
     * new RsTable({ columns })
     * .usarAdapter(adapter)
     * .filtrar({ column, operator, value })
     * .ordenar(column, 'asc'|'desc')
     * .irParaPagina(n)
     * .getLinhas() — dados da página atual (já transformados)
     * .getTotal() — total de linhas
     * .getEstado() — snapshot completo
     * .esconderColuna(key) / .mostrarColuna(key)
     * .reordenarColunas([...keys])
   - Ao mudar estado, chama adapter.fetch() e emite evento

4. TRANSFORMAÇÃO DE DADO — LINHA SAGRADA:
   - Cada coluna guarda valor REAL (calculável: 100) + RECEITA DE EXIBIÇÃO (máscara: "R$")
   - .getLinhas() retorna dados com valor real E valor de exibição separados
   - Exportação futura usará valor real (calculável)
   - Override por coluna: possível marcar para exportar como texto formatado

5. SISTEMA DE EVENTOS (events/index.ts):
   - JS puro, sem Vue — reatividade própria
   - .on('dados:carregados', callback)
   - .on('erro', callback)
   - .on('estado:alterado', callback)
   - Implementação simples: observer pattern

6. FILTROS (filters/index.ts):
   - Operadores por tipo de coluna
   - API: { column, operator, value }
   - Múltiplos filtros simultâneos (AND)

7. ORDENAÇÃO (sorting/index.ts):
   - Por coluna, direção asc/desc
   - Ordenação alfabética para texto, numérica para número, cronológica para data

8. PAGINAÇÃO (pagination/index.ts):
   - Controle de página atual e pageSize (default: 20)
   - Cálculo de total de páginas

9. VALIDAÇÃO / FALHE ALTO (validation/index.ts):
   - Validar dado recebido contra o tipo da coluna
   - Se inválido: emitir evento 'erro' com { column, row, expected, received }
   - Localização exata do erro — cura o "catar feijão" (Princípio #7)

10. EXPORTS PÚBLICOS (index.ts):
    - Exportar: RsTable, coluna, DataAdapter, tipos públicos

ARQUIVOS QUE NÃO PRECISAM SER ALTERADOS:
    - packages/nuxt/ (a casca Nuxt só será implementada na Fase 3)
    - build.config.ts, tsconfig.json, vitest.config.ts (já configurados)

REGRAS ESPECÍFICAS DESTA FASE:
    - Core é JS/TS puro — ZERO imports de Vue, React, Nuxt
    - Core tem ZERO dependências de runtime — não instalar nada novo
    - NADA de mágica: todo comportamento visível no código de uso (Princípio #6)
    - LINHA SAGRADA: transformação de DADO aqui; estilo NUNCA. Export = valor calculável.
    - API explícita: .filtrar({ column, operator, value }), não builders mágicos
    - Dado sempre plano: coluna.key é string simples, nunca 'categoria.nome'
    - NADA de cache: stateless — toda mudança = nova chamada ao adapter
    - Se algo não estiver claro nos documentos, PERGUNTE antes de decidir

PONTOS CRÍTICOS — NÃO IGNORE:
    1. NADA DE UI: esta fase é JS/TS puro. Se você sentir vontade de criar um componente
       Vue ou importar HTML/CSS no packages/core/, PARE. Isso é para a Fase 3. O Core é
       testado no terminal (Vitest), sem navegador. Você NÃO verá nada na tela — e está
       correto. O objetivo é solidificar o cérebro antes de vestir o corpo.

    2. A API DEFINIDA AGORA É CONTRATO PARA SEMPRE: .filtrar(), .getLinhas(), .ordenar()
       e todos os métodos públicos do RsTable serão usados por Render, Adapter e Plugins
       nas fases seguintes. Se saírem com assinatura errada, tudo que vier depois nasce
       quebrado. Revise cada assinatura com cuidado. Siga exatamente o que está em
       ARCHITECTURE.md. Em caso de dúvida sobre a assinatura, PERGUNTE.

    3. TESTES SÃO A ÚNICA PROVA DE QUE FUNCIONA: sem tela, sem servidor, sem navegador.
       Se npm test não cobrir um cenário, ele NÃO EXISTE. Exija cobertura total dos casos
       de borda: tabela vazia, filtro sem resultado, página além do total, dado inválido
       por tipo, múltiplos filtros simultâneos, ordenação + filtro combinados.

    4. FALHE ALTO É LÓGICA PURA DO CORE: o sistema de validação NÃO pode depender de
       HTML, console.log ou DOM. Deve ser testável puramente no terminal. Emita eventos
       de erro (tabela.on('erro', callback)) com { column, row, expected, received }.
       O callback deve ser verificável nos testes do Vitest. Se o Falhe Alto só funcionar
       com HTML, está errado.

TESTES (packages/core/test/):
    - Testar cada tipo de coluna (comportamento padrão de filtro, ordenação, validação)
    - Testar RsTable com um adapter mock (simula fetch)
    - Testar Falhe Alto com dados inválidos por tipo
    - Testar sistema de eventos (ouvintes recebem callbacks)
    - Testar esconder/mostrar/reordenar colunas
    - Cobrir casos de borda: tabela vazia, filtro sem resultado, página além do total

CRITÉRIO DE CONCLUSÃO:
    - npm test passa com TODOS os cenários acima
    - npm run build compila sem erros
    - Nenhum import de Vue/React/Nuxt em packages/core/
    - Nenhuma dependência nova em packages/core/package.json
    - API do Data Engine segue exatamente o contrato descrito em ARCHITECTURE.md

AO FINAL:
    - Atualize docs/CURRENT_PHASE.md (marque Fase 1 como ✅, inicie Fase 2)
    - Liste quaisquer decisões técnicas tomadas (ex: formato específico de operador)
    - Reporte qualquer dificuldade ou ambiguidade encontrada nos documentos
```

---

## KICKOFF DA FASE 2

> Gerado após conclusão da Fase 1. A Fase 1 definiu o contrato; a Fase 2 o implementa com dados reais.

```
Você é um desenvolvedor trabalhando no projeto RSdata.

ANTES DE COMEÇAR, leia estes arquivos na ordem:
1. .ai/BRAIN.md
2. docs/CURRENT_PHASE.md
3. docs/ARCHITECTURE.md — seções "Camada 1 — Data Source (Adapter)", "Contrato do
   Adapter", "Dado sempre plano (flat)", e a tabela de Camadas
4. docs/ROADMAP.md — seção "Fase 2"
5. docs/FEATURES.md — seção "Fase 2 — Adapter Local"
6. docs/PRINCIPLES.md — foco nos princípios #2, #3, #5
7. docs/PROJECT_RULES.md
8. .ai/AI_GUIDE.md

TAREFA: Implementar a Fase 2 — Adapter Local.

A Fase 2 é a PRIMEIRA prova real da arquitetura. Até agora o Data Engine só foi
testado com mocks. Aqui ele recebe dados de verdade pela primeira vez.

O QUE IMPLEMENTAR (em packages/core/src/):

1. ADAPTER LOCAL (adapter/local.ts):
   - Classe LocalAdapter que implementa a interface DataAdapter (definida na Fase 1)
   - Construtor recebe um array de dados (Row[])
   - fetch(query): aplica filtros → ordena → pagina → retorna { rows, total }
   - fetchAll(query): aplica filtros → ordena → retorna TODAS as linhas (sem paginação)
   - fetchFilterOptions(column): retorna valores únicos da coluna (para dropdowns)

2. IMPLEMENTAÇÃO DOS OPERADORES DE FILTRO (filters/index.ts):
   - Implementar função que aplica um filtro a uma linha
   - Suporte a todos os operadores definidos por tipo na Fase 1:
     texto: contains, equals, startsWith, endsWith
     numero: eq, gt, lt, gte, lte, between
     data/data-hora: between (intervalo), eq
     booleano: eq
     selecao: eq
   - Múltiplos filtros = AND (todos precisam ser verdadeiros)

3. IMPLEMENTAÇÃO DA ORDENAÇÃO (sorting/index.ts):
   - Ordenar array por coluna e direção (asc/desc)
   - Ordenação sensível ao tipo: alfabética (texto), numérica (numero),
     cronológica (data), pelo valor de exibição (selecao)

4. IMPLEMENTAÇÃO DA PAGINAÇÃO (pagination/index.ts):
   - Fatiar array: calcular offset = (page - 1) * pageSize, retornar slice
   - Calcular total de páginas: Math.ceil(total / pageSize)

ARQUIVOS QUE NÃO PRECISAM SER ALTERADOS:
   - packages/core/src/engine/ (a RsTable já está pronta)
   - packages/core/src/columns/ (tipos e colunas já estão prontos)
   - packages/core/src/events/ (sistema de eventos já está pronto)
   - packages/core/src/validation/ (Falhe Alto já está pronto)
   - packages/nuxt/ (a casca Nuxt só será implementada na Fase 3)
   - build.config.ts, tsconfig.json, vitest.config.ts

REGRAS ESPECÍFICAS DESTA FASE:
   - Core é JS/TS puro — ZERO imports de Vue, React, Nuxt
   - Core tem ZERO dependências de runtime — não instalar nada novo
   - O adapter NUNCA transforma valor (1→"Ativo") — isso é do Data Engine
   - O adapter NUNCA aplica máscara ou formatação visual
   - fetch() sempre retorna Promise (simula comportamento assíncrono de servidor)
   - Se algo não estiver claro nos documentos, PERGUNTE antes de decidir

PONTOS CRÍTICOS — NÃO IGNORE:

    1. O CONTRATO DO ADAPTER É TESTADO DE VERDADE AGORA: a Fase 1 definiu a interface
       DataAdapter. A Fase 2 implementa ela com dados reais. Se a interface tiver algum
       buraco (ex: Query não cobre um operador, FetchResult não é prático), VAI APARECER
       AQUI. Se o adapter precisar de algo que a interface não prevê, a correção é na
       INTERFACE (Fase 1), NUNCA uma gambiarra no adapter. Avise se encontrar buracos.

    2. O ADAPTER NUNCA FAZ O TRABALHO DO DATA ENGINE: o LocalAdapter filtra, ordena e
       pagina o array — mas NUNCA transforma valor. A transformação (1→"Ativo", máscara
       R$, formatação de data) é exclusiva do Data Engine. Se o adapter começar a aplicar
       transform(), mask, ou mapear valores, está ERRADO. O adapter entrega o dado BRUTO.

    3. O ADAPTER SIMULA UM SERVIDOR, NÃO É UM ATALHO LOCAL: mesmo sendo array em memória,
       o LocalAdapter se comporta COMO SE FOSSE REMOTO. Recebe Query, processa, devolve
       FetchResult com rows + total. A RsTable NÃO SABE a diferença entre local e remoto.
       fetch() SEMPRE retorna Promise<FetchResult>, nunca um array síncrono.

    4. TESTES DE INTEGRAÇÃO, NÃO SÓ UNITÁRIOS: a Fase 1 testou RsTable com mock. A Fase 2
       precisa testar RsTable + LocalAdapter JUNTOS — cenários de ponta a ponta. Criar
       tabela → conectar adapter → filtrar → ordenar → paginar → verificar .getLinhas() e
       .getTotal(). Se só existirem testes unitários do adapter isolado, está INCOMPLETO.

    5. CASOS DE BORDA REAIS: tabela vazia (array []), filtro sem resultado, página além
       do total, ordenação com dados repetidos, filtro + ordenação + paginação combinados,
       Falhe Alto com dado inválido vindo do adapter. Se o Falhe Alto não disparar com
       dado inválido fluindo do adapter, a cadeia está quebrada.

EXPORTS (atualizar packages/core/src/index.ts):
   - Exportar LocalAdapter
   - Exportar funções de filtro, ordenação e paginação (se forem públicas)

TESTES (packages/core/test/):
   - Testar LocalAdapter isolado: fetch com filtro, ordenação, paginação
   - Testar LocalAdapter.fetchAll (retorna todas as linhas, sem paginação)
   - Testar LocalAdapter.fetchFilterOptions (valores únicos por coluna)
   - Testar INTEGRAÇÃO: RsTable + LocalAdapter — fluxo completo
   - Testar cada operador de filtro com dados reais
   - Testar ordenação com cada tipo de coluna
   - Testar paginação: primeira, última, meio, além do total
   - Testar Falhe Alto: dado inválido no array → evento 'erro' disparado
   - Casos de borda: array vazio, filtro sem match, página 0 ou negativa

CRITÉRIO DE CONCLUSÃO:
   - npm test passa com TODOS os cenários acima
   - npm run build compila sem erros
   - Nenhum import de Vue/React/Nuxt em packages/core/
   - Nenhuma dependência nova em packages/core/package.json
   - LocalAdapter implementa exatamente a interface DataAdapter
   - Testes de integração RsTable + LocalAdapter cobrem o fluxo completo

AO FINAL:
   - Atualize docs/CURRENT_PHASE.md (marque Fase 2 como ✅, inicie Fase 3)
   - Liste quaisquer decisões técnicas tomadas
    - Reporte qualquer dificuldade ou buraco encontrado na interface do Adapter
```

---

## KICKOFF DA FASE 3

> Gerado após conclusão da Fase 2. A Fase 3 é um divisor de águas: a RSdata ganha rosto.
> Até agora tudo foi terminal. Aqui a primeira tabela aparece no navegador.
> Mas com HTML vem o maior risco: contaminar o Core — exatamente o erro do PowerGrid.

```
Você é um desenvolvedor trabalhando no projeto RSdata.

ANTES DE COMEÇAR, leia estes arquivos na ordem:
1. .ai/BRAIN.md
2. docs/CURRENT_PHASE.md
3. docs/ARCHITECTURE.md — seções "Camada 3 — Render Engine (Casca)", "Headless",
   "Camada 4 — Theme (Pele)", e "Estrutura do Repositório" (packages/nuxt/)
4. docs/ROADMAP.md — seção "Fase 3"
5. docs/FEATURES.md — seção "Fase 3 — Render Engine Nuxt + Theme Default"
6. docs/PRINCIPLES.md — foco nos princípios #2 (nunca força gambiarra),
   #4 (híbrido), #5 (customização sem parede), #6 (explícito > mágico)
7. docs/PROJECT_RULES.md
8. .ai/AI_GUIDE.md

TAREFA: Implementar a Fase 3 — Render Engine Nuxt + Theme Default.

Esta é a PRIMEIRA fase que mexe em packages/nuxt/. O packages/core/ está pronto
e NÃO deve ser alterado. A Fase 3 é a prova real da arquitetura headless: se
funcionar, o sonho "cérebro JS puro + casca Nuxt" está provado.

O QUE IMPLEMENTAR (em packages/nuxt/src/):

1. COMPOSABLE useRsTable() (composables/useRsTable.ts):
   - ÚNICO ponto de contato entre o Core e o Vue
   - Recebe uma instância RsTable (do Core) como parâmetro
   - Escuta eventos do Core ('dados:carregados', 'erro', 'estado:alterado')
     e traduz para a reatividade do Vue (ref, reactive, computed)
   - Expõe estado reativo: linhas, total, paginaAtual, totalPaginas,
     ordenacao, filtros, colunas, loading, erro
   - Expõe métodos reativos que delegam ao Core: filtrar(), ordenar(),
     irParaPagina(), esconderColuna(), mostrarColuna(), reordenarColunas()
   - NENHUM componente Vue importa o Core diretamente — sempre via useRsTable()

2. COMPONENTE <RsTable> (components/RsTable.vue):
   - Componente principal que renderiza a tabela completa
   - Props: tabela (instância RsTable) ou columns + adapter (modo rápido)
   - Usa useRsTable() internamente
   - Renderiza: cabeçalho + corpo + controles de paginação
   - Estrutura HTML semântica: <table>, <thead>, <tbody>, <tr>, <th>, <td>

3. COMPONENTE <RsThead> (components/RsThead.vue):
   - Renderiza a linha de cabeçalho com os nomes das colunas visíveis
   - Cabeçalho CLICÁVEL: ao clicar, chama ordenar() do useRsTable()
   - Indicador visual de ordenação (seta ↑↓ ou classe CSS) conforme estado
   - Respeita colunas escondidas (não renderiza)

4. COMPONENTE <RsTbody> (components/RsTbody.vue):
   - Renderiza as linhas e células do corpo da tabela
   - Cada célula exibe o valor de EXIBIÇÃO (display) vindo do Core
   - Linhas vazias: se getLinhas() retornar [], mostra "Nenhum registro"
   - Estado de loading: spinner ou texto "Carregando..." enquanto fetch

5. CONTROLES DE PAGINAÇÃO (components/RsPagination.vue):
   - Botões: Anterior, números de página (ou resumo), Próximo
   - Mostra "Página X de Y — Total: N registros"
   - Desabilita Anterior na página 1, Próximo na última página

6. FILTROS VISUAIS (components/RsFilters.vue):
   - Inputs/dropdowns renderizados por tipo de coluna
   - Texto: <input> com placeholder "Filtrar..."
   - Número: dois <input> (mínimo e máximo)
   - Data: dois <input type="date"> (início e fim)
   - Seleção: <select> com opções do fetchFilterOptions()
   - Booleano: <select> com Sim/Não
   - Ao mudar valor: chama filtrar() do useRsTable()

7. THEME DEFAULT (theme/default.css):
   - CSS puro próprio — ZERO dependências de Tailwind, Bootstrap, etc.
   - Estilização mínima funcional: bordas, espaçamento, cores básicas,
     hover nas linhas, destaque no cabeçalho, paginação alinhada
   - Estrutura de classes PREVISÍVEL: .rs-table, .rs-thead, .rs-tbody,
     .rs-row, .rs-cell, .rs-pagination, .rs-filters, .rs-loading, .rs-empty
   - Fácil de sobrescrever: classes bem nomeadas, sem !important abusivo
   - NENHUM `@import` de lib externa — é CSS nosso, cru

8. PLUGIN NUXT (index.ts):
   - Instalação via app.use(): registra os componentes globalmente
   - Auto-import dos componentes (se possível no ecossistema Nuxt)
   - Exporta useRsTable para uso programático

9. EXPORTS (index.ts):
   - Exportar: useRsTable, RsTable, RsThead, RsTbody, RsPagination, RsFilters
   - Exportar caminho do CSS para import: 'import @rsdata/nuxt/theme/default.css'

ARQUIVOS QUE NÃO DEVEM SER ALTERADOS:
   - packages/core/ (NENHUMA alteração — o Core está pronto)
   - build.config.ts, tsconfig.json, vitest.config.ts

REGRAS ESPECÍFICAS DESTA FASE:
   - NUNCA instalar Tailwind, Bootstrap ou qualquer framework CSS
   - O Render NUNCA faz lógica de dado — tudo é delegado ao Core via useRsTable()
   - O Render NUNCA transforma valor, aplica máscara ou formata dados
   - Componentes são BURROS: perguntam pro Core, o Core responde, o Render desenha
   - Classes CSS seguem o padrão .rs-* para namespacing
   - Se algo não estiver claro nos documentos, PERGUNTE antes de decidir

PONTOS CRÍTICOS — NÃO IGNORE:

    1. A PONTE Core ↔ Vue É O CORAÇÃO DA FASE 3 (e o maior risco): o useRsTable()
       escuta eventos do Core (JS puro) e traduz para reatividade do Vue. Se essa
       ponte falhar: dados não atualizam, re-renderizacão descontrolada, estado
       dessincronizado. useRsTable() deve ser o ÚNICO ponto de contato — nenhum
       componente .vue importa o Core diretamente.

    2. O RENDER NUNCA FAZ LÓGICA DE DADO: filtro, ordenação, transformação
       (1→"Ativo"), validação — tudo já existe no Core. O Render só exibe o que
       getLinhas() entrega e captura intenção do usuário (clique) para chamar o
       Core. Se o Render começar a filtrar array, formatar valor, ou aplicar
       máscara própria, é um ERRO GRAVE — o mesmo acoplamento do PowerGrid.

    3. THEME EM CSS PURO PRÓPRIO — NADA de framework externo: o CSS é escrito à mão,
       sem Tailwind, Bootstrap, ou qualquer dependência. Se você sentir vontade de
       npm install qualquer coisa de CSS, PARE. O CSS é funcional e minimalista —
       fácil de sobrescrever. Classes previsíveis, sem !important abusivo.

    4. @rsdata/core PERMANECE INTOCÁVEL: a Fase 3 mexe SOMENTE em packages/nuxt/.
       git diff packages/core/ deve mostrar ZERO alterações ao final. Se você
       modificar o Core para "facilitar o Render", está ERRADO.

    5. A PRIMEIRA TABELA VISÍVEL É O TESTE DE FOGO DO HEADLESS: se new RsTable() +
       LocalAdapter + useRsTable() + <RsTable> funcionar no navegador, a promessa
       "cérebro JS puro + casca Nuxt" está PROVADA. Se não funcionar, é sinal de
       buraco no Core ou nos eventos — corrija no Core, não com gambiarra no Render.

TESTES (packages/nuxt/test/):
    - Testar useRsTable(): conecta ao Core, expõe estado reativo, reage a eventos
    - Testar componentes com mount do Vue Test Utils (se disponível):
      * RsTable renderiza dados corretamente
      * Cabeçalho clicável chama ordenar()
      * Paginação navega entre páginas
      * Filtros disparam filtrar()
    - Testar estado de loading e empty
    - Testar integração: RsTable + LocalAdapter + useRsTable (fluxo completo)
    - Se Vue Test Utils não funcionar no Nuxt: testar useRsTable() isolado
      com mock da RsTable

CRITÉRIO DE CONCLUSÃO:
    - npm test passa em TODOS os cenários
    - npm run build compila sem erros
    - NENHUMA dependência nova de CSS ou framework instalada
    - git diff packages/core/ não mostra alterações
    - Tabela renderiza dados corretamente no navegador
    - Cabeçalho clicável ordena, paginação navega, filtros funcionam
    - CSS é puro, previsível, sem framework externo
    - Theme default funcional e estilizável (classes nomeadas)

AO FINAL:
    - Atualize docs/CURRENT_PHASE.md (marque Fase 3 como ✅, inicie Fase 4)
    - Liste quaisquer decisões técnicas tomadas
    - Reporte se o Core precisou de ajuste (é sinal de buraco no contrato)
```

---

## REFINAMENTO DA FASE 3: Identidade Visual (Theme Default)

> Aplicado após aprovação da Fase 3. Substitui o visual básico por um design moderno
> com identidade visual própria. Nenhuma lógica ou estrutura é alterada — só CSS.

```
Você é um designer de UI/UX trabalhando no Theme default da RSdata.

A Fase 3 já foi implementada e aprovada — a tabela funciona perfeitamente no
navegador. Sua tarefa é APENAS refinar o visual. NADA de lógica. NADA de
estrutura. SÓ CSS e componentes visuais.

ANTES DE COMEÇAR, leia:
1. packages/nuxt/src/theme/default.css — o CSS atual que você vai substituir
2. packages/nuxt/src/components/RsDataTable.ts — entenda a estrutura HTML
3. packages/nuxt/src/components/RsThead.ts — classes do cabeçalho
4. packages/nuxt/src/components/RsTbody.ts — classes do corpo
5. packages/nuxt/src/components/RsPagination.ts — classes da paginação
6. packages/nuxt/src/components/RsFilters.ts — classes dos filtros

TAREFA: Redesenhar o Theme default do RSdata com identidade visual moderna.
APENAS CSS e ajustes de classe nos componentes. ZERO lógica nova.

IDENTIDADE VISUAL (cores da marca RSdata):

    Azul escuro (fundo principal, cabeçalho):  #1c203f
    Verde água (ações, links, destaque):       #65ba88
    Azul claro (hover, linhas alternadas):      #cde9f2
    Verde claro (sucesso, confirmado):          #66b32e

DIREÇÃO DE DESIGN — referências do mercado (AG Grid, TanStack Table, Linear,
Vercel Design):

    1. CABEÇALHO: fundo azul escuro (#1c203f), texto branco, borda inferior
       sutil (verde água #65ba88 2px). Fonte bold, tracking ligeiro. Ícone
       de ordenação (↑↓) visível e com transição suave.

    2. CORPO: linhas com altura confortável (44-48px). Borda inferior sutil
       (cinza claro) entre linhas, sem bordas verticais (visual limpo).
       Linhas alternadas (zebra-striping): fundo azul claro (#cde9f2) com
       8% opacidade nas linhas pares. Hover: fundo azul claro (#cde9f2) com
       20% opacidade, transição suave de 150ms.

    3. PAGINAÇÃO: alinhada à direita, altura compacta. Botões com borda sutil,
       cantos arredondados (6px), hover com verde água (#65ba88). Página ativa
       com fundo azul escuro (#1c203f) e texto branco. Texto "Página X de Y"
       discreto, cinza médio.

    4. FILTROS: inputs com borda cinza claro padrão, foco com borda verde água
       (#65ba88). Placeholder cinza claro. Altura consistente (36-40px).
       Labels sutis acima de cada input.

    5. ESTADOS:
       - Loading: spinner centralizado ou skeleton com pulso sutil
       - Empty: ícone simples + "Nenhum registro encontrado" centralizado,
         texto cinza médio
       - Erro (Falhe Alto): célula com fundo vermelho claro (#fef2f2) e
         borda vermelha sutil, tooltip com detalhes

    6. TIPOGRAFIA: font-family system stack nativa (-apple-system, BlinkMacSystemFont,
       'Segoe UI', Roboto, sans-serif). Tamanho base 14px. Cabeçalho 13px bold.

    7. GERAL: bordas sutis (1px, cinza claro #e2e8f0). Cantos arredondados
       onde apropriado (tabela: 8px no container, inputs: 6px). Sombras
       suaves (box-shadow: 0 1px 3px rgba(0,0,0,0.06) no container).
       Espaçamento interno das células: 12px horizontal, 10px vertical.

REGRAS:
    - CSS puro — ZERO Tailwind, Bootstrap, ou qualquer framework
    - NENHUM @import de lib externa
    - Classes seguem o padrão .rs-* existente
    - NENHUM !important (a não ser em caso extremo justificado)
    - Variáveis CSS (custom properties) para as cores no :root, ex:
      --rs-primary: #1c203f;
      --rs-accent: #65ba88;
      --rs-light: #cde9f2;
      --rs-success: #66b32e;
    - O CSS deve ser SOBRESCREVÍVEL — usuário troca as variáveis no :root
    - NENHUMA alteração em packages/core/
    - NENHUMA lógica nova nos componentes — só ajuste de classes CSS se necessário
    - Se um componente precisar de uma classe nova para o design funcionar,
      adicione APENAS a classe, sem lógica

ARQUIVOS QUE VOCÊ PODE ALTERAR:
    - packages/nuxt/src/theme/default.css (principal — reescrever)
    - packages/nuxt/src/components/*.ts (APENAS classes CSS — sem lógica)

CRITÉRIO DE CONCLUSÃO:
    - npm test continua passando 242+
    - npm run build compila sem erros
    - git diff packages/core/ mostra ZERO alterações
    - O Theme default aplica as 4 cores da identidade visual
    - A tabela está visualmente moderna e limpa (referência: AG Grid, Linear)
    - Variáveis CSS expostas no :root para sobrescrita fácil
    - ZERO dependências novas
    - Playground exibe o novo visual sem quebras

AO FINAL:
    - Não commitar
    - Liste o que foi alterado (arquivos e resumo)
```

---

## KICKOFF DA FASE 4

> Gerado após conclusão da Fase 3. A Fase 4 fecha o ciclo de interação: o usuário
> AGE sobre os dados (actions) e a RSdata DENUNCIA dados ruins (Falhe Alto visual).
> O Core permanece intocado — tudo é consumo de eventos e renderização.

```
Você é um desenvolvedor trabalhando no projeto RSdata.

ANTES DE COMEÇAR, leia estes arquivos na ordem:
1. .ai/BRAIN.md
2. docs/CURRENT_PHASE.md
3. docs/ARCHITECTURE.md — seções "Actions (botão gatilho)" e "Valor: dois aspectos
   separados", além do fluxo completo das 4 camadas
4. docs/ROADMAP.md — seção "Fase 4"
5. docs/FEATURES.md — seção "Fase 4 — Actions + Falhe Alto integrado"
6. docs/PRINCIPLES.md — foco nos princípios #2, #5, #6, #7
7. docs/PROJECT_RULES.md
8. .ai/AI_GUIDE.md

TAREFA: Implementar a Fase 4 — Actions + Falhe Alto integrado.

A Fase 4 fecha o ciclo de interação. Até agora a tabela mostra dados e responde
a filtro/ordenação/paginação. Aqui o usuário AGE sobre os dados (actions) e a
RSdata DENUNCIA dados ruins (Falhe Alto visual no navegador).
O Core NÃO será alterado — tudo é consumo do que já existe desde a Fase 1.

O QUE IMPLEMENTAR:

1. ACTIONS — COLUNA TIPO 'acao' NO RENDER (packages/nuxt/src/components/):

   a. Botão de ação única (components/RsAction.vue OU em RsTbody.ts):
      - Coluna do tipo 'acao' renderiza botão por linha
      - Define action via col.options.actions: [{ key, label, danger? }]
      - Ao clicar: emite evento 'action' com { key, row } (Princípio read-only —
        a RSdata é o transportador, o usuário traz a arma)
      - O evento NÃO executa nada — apenas notifica o pai

   b. Múltiplas actions → Menu ⋯ (ADIADO DA FASE 3):
      - Se col.options.actions tem 1 item: renderiza botão direto
      - Se tem 2+ itens: renderiza ícone ⋯ (tres-pontos) que abre dropdown
      - Dropdown: card branco, borda sutil, sombra, animação 150ms ease-out
      - Cada item do dropdown: padding 8px 16px, hover fundo slate-50
      - Ação danger (danger: true): texto vermelho, hover fundo red-50
      - Clique fora OU tecla Escape fecha o dropdown
      - Menu fecha após clique em uma ação
      - HTML do dropdown renderizado no corpo (teleport/append-to-body ou portal)

   c. Callback de ação no useRsTable():
      - Tabela expõe .on('action', ({ key, row }) => { ... })
      - useRsTable() propaga o evento para o consumidor Vue

2. FALHE ALTO — VISUAL (packages/nuxt/src/components/):

   a. Consumir evento 'erro' do Core:
      - useRsTable() já escuta 'erro' e expõe erros[] como ref reativo
      - Cada erro contém: { column, row, expected, received }

   b. Modo DEV (grita alto):
      - Célula com erro: fundo #fef2f2 (red-50), borda esquerda 3px vermelha
      - Banner/tooltip visível com: "Coluna `preco`, linha 42, esperava `number`,
        recebeu `null`"
      - O banner pode ser um elemento abaixo da toolbar ou tooltip na célula
      - Controle via prop: :debug="true" OU detecta import.meta.env.DEV

   c. Modo PRODUÇÃO (seguro):
      - Célula com erro: ícone ⚠ sutil + fundo levemente alterado
      - NÃO derruba a tela — resto da tabela funciona normalmente
      - NÃO expõe detalhes internos para o usuário final
      - Controle via prop: :debug="false" (padrão em produção)

   d. Erro e action NA MESMA LINHA:
      - O cenário mais delicado: uma linha tem célula com erro E botão de action
      - Layout não quebra — coluna de erro mostra indicador, coluna de action
        mostra botão/menu. Ambos convivem sem se sobrepor

3. PREFERÊNCIAS PERSISTENTES (useRsTable.ts):
   - Salvar em localStorage: colunas visíveis, ordem de colunas, pageSize
   - Ao montar: restaurar preferências salvas (ou usar defaults)
   - Menu "Colunas" na toolbar: dropdown com checkboxes mostrar/esconder colunas
   - Lógica 100% no composable, zero no Core

ARQUIVOS QUE VOCÊ PODE ALTERAR:
    - packages/nuxt/src/components/RsTbody.ts (renderização de actions e erros)
    - packages/nuxt/src/components/RsThead.ts (menu colunas)
    - packages/nuxt/src/components/RsDataTable.ts (toolbar, banner de erros)
    - packages/nuxt/src/components/RsPagination.ts (ajustes visuais se necessário)
    - packages/nuxt/src/components/RsFilters.ts (menu colunas integrado)
    - packages/nuxt/src/composables/useRsTable.ts (actions, erros, preferências)
    - packages/nuxt/src/theme/default.css (estilos de erro, dropdown, badges)
    - packages/nuxt/src/index.ts (novos exports se necessário)

ARQUIVOS QUE NÃO DEVEM SER ALTERADOS:
    - packages/core/ (NENHUMA alteração — Core intocado desde a Fase 1)
    - build.config.ts, tsconfig.json, vitest.config.ts

REGRAS ESPECÍFICAS DESTA FASE:
    - Core NÃO é alterado — git diff packages/core/ = VAZIO
    - Actions são GATILHOS, nunca executores (read-only — Princípio)
    - Falhe Alto no Render é CONSUMIDOR de eventos do Core, nunca produtor
    - ZERO novas dependências
    - ZERO lógica de validação nova — o Core já valida desde a Fase 1
    - Todo comportamento visível no código de uso (Princípio #6)
    - Se algo não estiver claro, PERGUNTE antes de decidir

PONTOS CRÍTICOS — NÃO IGNORE:

    1. ACTIONS SÃO GATILHOS, NUNCA EXECUTORES: o Core já trata a coluna tipo
       'acao'. No Render, cada botão EMITE um evento com { key, row }. A lógica
       do que acontece depois (chamar API, excluir, redirecionar) é 100% DO
       USUÁRIO. Se o componente tentar fazer fetch() ou axios.delete() dentro
       do botão, está ERRADO. A RSdata é o transportador; o usuário traz a arma.

    2. FALHE ALTO: MODO DEV vs MODO PRODUÇÃO: o Core já emite 'erro' com
       { column, row, expected, received }. No Render: DEV grita (badge
       vermelho, localização exata visível). PRODUÇÃO é seguro (ícone sutil,
       sem expor detalhes, resto da tabela funciona). O modo é controlado
       por prop :debug="true|false" ou import.meta.env.DEV como default.

    3. ACTIONS E ERRO CONVIVEM NA MESMA LINHA: o cenário mais delicado. Uma
       linha pode ter célula com Falhe Alto E botão de action simultaneamente.
       Layout não quebra. Coluna de erro: indicador visual. Coluna de action:
       botão/menu. Ambos independentes, sem sobreposição.

    4. CORE PERMANECE INTOCADO: a validação já existe desde a Fase 1. O sistema
       de eventos também. A Fase 4 NÃO adiciona nada ao Core. Só consome.
       git diff packages/core/ deve mostrar ZERO alterações. Se o Falhe Alto
       não tiver todas as informações que o Render precisa, AVISE — já deveriam
       estar lá desde a Fase 1.

    5. MENU ⋯ (ADIADO DA FASE 3): múltiplas actions → dropdown com três pontos.
       Dropdown: card branco, sombra, animação. Click fora ou ESC fecha.
       Uma action só? Botão direto (sem dropdown desnecessário).

TESTES (packages/nuxt/test/):
    - Testar coluna 'acao' com 1 ação: botão renderiza, clique emite evento
    - Testar coluna 'acao' com 3 ações: menu ⋯ renderiza, dropdown abre/fecha
    - Testar ação danger: destaque visual (classe CSS)
    - Testar Falhe Alto visual: célula com erro tem classe .rs-cell--error
    - Testar banner de erros no modo debug
    - Testar modo produção: sem banner, indicador sutil apenas
    - Testar ação + erro na mesma linha: layout não quebra
    - Testar preferências: salvar/restaurar localStorage
    - Testar menu colunas: checkboxes mostram/escondem colunas

CRITÉRIO DE CONCLUSÃO:
    - npm test passa com TODOS os cenários acima
    - npm run build compila sem erros
    - git diff packages/core/ mostra ZERO alterações
    - Actions emitem eventos, NÃO executam lógica
    - Falhe Alto visual funciona em modo dev e produção
    - Menu ⋯ funcional com clique fora e ESC para fechar
    - Preferências persistem em localStorage
    - ZERO dependências novas

AO FINAL:
    - Atualize docs/CURRENT_PHASE.md (marque Fase 4 como ✅, inicie Fase 5)
    - Liste quaisquer decisões técnicas tomadas
    - NÃO commitar
```

---

## KICKOFF DA FASE 5

> Gerado após conclusão da Fase 4. A Fase 5 é a prova de fogo: a RSdata substitui
> o PowerGrid no projeto DDD real. Não é mais array local — é HTTP, latência,
> erro de rede e dados de verdade vindos do servidor Laravel.

```
Você é um desenvolvedor trabalhando no projeto RSdata.

ANTES DE COMEÇAR, leia estes arquivos na ordem:
1. .ai/BRAIN.md
2. docs/CURRENT_PHASE.md
3. docs/ARCHITECTURE.md — seções "Camada 1 — Data Source (Adapter)",
   "Servidor-side por padrão", "Contrato do Adapter (interface)",
   "Dado sempre plano (flat)"
4. docs/ROADMAP.md — seção "Fase 5"
5. docs/FEATURES.md — seção "Fase 5 — Adapter Server-side (Laravel)"
6. docs/PRINCIPLES.md — foco nos princípios #2, #3, #5, #7
7. docs/PROJECT_RULES.md
8. .ai/AI_GUIDE.md

TAREFA: Implementar a Fase 5 — Adapter Server-side (Laravel).

A Fase 5 é a PROVA DE FOGO. Até agora a RSdata foi testada com dados locais
(array em memória). Aqui ela se conecta ao backend Laravel do projeto DDD real.
É o momento em que a arquitetura headless prova seu valor: trocar LocalAdapter
por LaravelAdapter NÃO exige mudar nada no Core nem no Render.

O QUE IMPLEMENTAR:

1. LARAVEL ADAPTER (packages/core/src/adapter/laravel.ts):
   - Classe LaravelAdapter que implementa DataAdapter (mesma interface do LocalAdapter)
   - Construtor recebe: baseUrl (string) e opcionalmente headers/fetchOptions
   - fetch(query): traduz Query → query params Laravel → faz fetch → parse response
   - fetchAll(query): mesmo que fetch mas sem paginação (pageSize grande ou endpoint separado)
   - fetchFilterOptions(column): faz request para endpoint de opções do Laravel
   - fetch() sempre retorna Promise<FetchResult> (assíncrono — rede)

2. TRADUÇÃO Query → LARAVEL (packages/core/src/adapter/laravel.ts):
   - Filtros → query params no formato Laravel: filter[coluna][operador]=valor
     Ex: Query { filters: [{ column: 'preco', operator: 'gt', value: 50 }] }
     → ?filter[preco][gt]=50
   - Ordenação → ?sort=nome (asc) ou ?sort=-nome (desc)
   - Paginação → ?page=3&per_page=20
   - Múltiplos filtros → &filter[preco][gt]=50&filter[status][eq]=Ativo
   - Busca global → ?search=termo (se suportado)

3. PARSING RESPONSE LARAVEL → FetchResult:
   - Esperado do Laravel: { data: [...], meta: { current_page, total, per_page } }
     OU { data: [...], total: 100 } (formato simplificado)
   - Extrair rows de 'data', total de 'meta.total' (com fallback para 'total' raiz)
   - Garantir que rows é sempre um array (defensivo)
   - Se o formato for inesperado: emitir erro, não quebrar

4. TRATAMENTO DE ERROS DE REDE:
   - Timeout: configurável (default 30s), emite evento 'erro' com mensagem clara
   - HTTP 4xx/5xx: emite 'erro' com status code e body
   - Resposta não-JSON: emite 'erro' com detalhes
   - Rede offline: emite 'erro' amigável
   - O adapter NUNCA quebra — todo erro vira evento, a RsTable continua viva
   - Faz 1 tentativa apenas (sem retry automático — isso é política do usuário)

5. CONTRATO DO BACKEND LARAVEL (documentado no adapter):
   - Documentar (em comentários JSDoc no código ou README do adapter) o formato
     exato que o Laravel precisa seguir para o adapter funcionar
   - Exemplo de request: GET /api/produtos?filter[preco][gt]=50&sort=nome&page=1&per_page=20
   - Exemplo de response: { "data": [...], "meta": { "current_page": 1, "total": 100 } }
   - Isso é CONTRATO PÚBLICO — o usuário precisa saber como configurar o Laravel

6. EXPORTS (atualizar packages/core/src/index.ts):
   - Exportar LaravelAdapter

ARQUIVOS QUE VOCÊ PODE ALTERAR:
    - packages/core/src/adapter/laravel.ts (NOVO — principal)
    - packages/core/src/adapter/index.ts (se precisar re-exportar)
    - packages/core/src/index.ts (export público)

ARQUIVOS QUE NÃO DEVEM SER ALTERADOS:
    - packages/core/src/engine/ (RsTable NÃO muda)
    - packages/core/src/columns/ (colunas NÃO mudam)
    - packages/core/src/events/ (eventos NÃO mudam)
    - packages/core/src/validation/ (Falhe Alto NÃO muda)
    - packages/nuxt/ (NENHUMA alteração — o Render já funciona)
    - build.config.ts, tsconfig.json, vitest.config.ts

REGRAS ESPECÍFICAS DESTA FASE:
    - LaravelAdapter implementa a MESMA interface DataAdapter do LocalAdapter
    - Core NÃO sabe a diferença entre local e remoto (transparente)
    - ZERO dependências novas — fetch() é nativo do Node 18+ e navegadores
    - Se fetch nativo não estiver disponível no ambiente de teste, usar polyfill
      mínimo ou mock
    - Dado que chega do servidor é PLANO — se vier aninhado, o adapter achata
    - O adapter NUNCA transforma valor (1→"Ativo") — isso é Data Engine
    - NADA de axios, ky, got ou qualquer lib HTTP — fetch nativo basta
    - Se algo não estiver claro, PERGUNTE antes de decidir

PONTOS CRÍTICOS — NÃO IGNORE:

    1. O ADAPTER É SÓ MAIS UM ADAPTER — O CORE NÃO SABE A DIFERENÇA: o
       LaravelAdapter implementa a MESMA interface que o LocalAdapter. Para a
       RsTable, é transparente — ela chama adapter.fetch(query) e recebe
       { rows, total }. Trocar de LocalAdapter para LaravelAdapter NÃO exige
       mudar NADA no Core nem no Render. Se algo quebrar, a arquitetura furou —
       a culpa é do contrato, não do adapter.

    2. TRADUÇÃO Query → LARAVEL É A ALMA DO ADAPTER: o Core envia Query
       (filtros, ordenação, página) num formato agnóstico. O adapter traduz
       para query params Laravel. Se a tradução estiver errada, o servidor
       não entende o pedido. O formato precisa ser documentado para o usuário
       saber como configurar o backend dele.

    3. DADO DO SERVIDOR PODE VIR SUJO — FALHE ALTO EM AÇÃO: diferente do
       LocalAdapter (dados controlados), o servidor pode mandar null onde
       esperava number, data em formato errado, campo faltando. O Falhe Alto
       (Fase 1) PRECISA funcionar com dados reais. Teste: servidor retorna
       { preco: "grátis" } numa coluna numero → Falhe Alto denuncia → Render
       exibe erro (Fase 4). Circuito completo: Adapter → Engine → Render.

    4. TRATAMENTO DE ERROS HTTP — A REDE FALHA: diferentemente do LocalAdapter,
       o adapter server-side lida com timeout, 4xx/5xx, resposta malformada,
       rede offline. O adapter traduz falhas de rede em eventos que o Core
       entende. A RsTable não sabe o que é HTTP 500 — mas sabe o que é um
       evento 'erro'. O adapter é a fronteira que converte falha HTTP em
       evento do Core. NUNCA quebrar — todo erro vira evento.

    5. O CONTRATO DO BACKEND É DOCUMENTAÇÃO PÚBLICA: o LaravelAdapter pressupõe
       um formato de request e response. Esse formato é CONTRATO PÚBLICO da
       RSdata. Documente via JSDoc no código do adapter: qual URL o adapter
       chama, quais query params envia, qual JSON espera de volta. O usuário
       precisa saber como configurar o Laravel dele para o adapter funcionar.

TESTES (packages/core/test/):
    - Testar LaravelAdapter isolado com mock de fetch (vitest.fn)
    - Testar tradução Query → query params Laravel (todos os operadores)
    - Testar parsing response Laravel → FetchResult
    - Testar erros HTTP: 400, 404, 500 → evento 'erro' emitido
    - Testar timeout → evento 'erro' emitido
    - Testar resposta malformada → não quebra, emite erro
    - Testar rede offline → erro amigável
    - Testar INTEGRAÇÃO: RsTable + LaravelAdapter (com mock de fetch)
      — o mesmo teste de integração da Fase 2, mas com LaravelAdapter
    - Testar Falhe Alto com dados sujos vindos do servidor (mock simula
      resposta com dado inválido → RsTable detecta → evento 'erro')

CRITÉRIO DE CONCLUSÃO:
    - npm test passa com TODOS os cenários acima
    - npm run build compila sem erros
    - LaravelAdapter implementa exatamente a interface DataAdapter
    - git diff packages/nuxt/ mostra ZERO alterações
    - ZERO dependências novas (fetch nativo, sem axios/ky/got)
    - Tradução Query → Laravel cobre todos os operadores da Fase 1
    - Erros de rede não quebram — viram eventos
    - Contrato do backend documentado via JSDoc

AO FINAL:
    - Atualize docs/CURRENT_PHASE.md (marque Fase 5 como ✅, Fase 6 opcional)
    - Liste quaisquer decisões técnicas tomadas
    - Reporte qualquer dificuldade com o contrato do Adapter
    - NÃO commitar
```
