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
