# THEMING.md — Guia de Estilização da RSdata

> Como personalizar completamente o visual da tabela. Do simples (mudar cores)
> ao extremo (CSS próprio do zero). A RSdata foi desenhada para que você nunca
> precise mexer no código da lib para aplicar SUA identidade visual.

---

## ÍNDICE

1. [Como funciona](#1-como-funciona)
2. [Nível 1: Variáveis CSS (cores e formas)](#2-nível-1-variáveis-css-cores-e-formas)
3. [Nível 2: Classes CSS (elementos específicos)](#3-nível-2-classes-css-elementos-específicos)
4. [Nível 3: Tema próprio do zero](#4-nível-3-tema-próprio-do-zero)
5. [Galeria de exemplos](#5-galeria-de-exemplos)
6. [Classes CSS de referência](#6-classes-css-de-referência)
7. [FAQ](#7-faq)

---

## 1. COMO FUNCIONA

Os componentes Vue da RSdata geram HTML com classes CSS **fixas e previsíveis** — sempre `.rs-table`, `.rs-row`, `.rs-cell`, etc. O que muda de um projeto para outro é o **CSS** que estiliza essas classes.

O tema padrão vem com **70+ variáveis CSS** que controlam cores, fontes, espaçamentos, bordas e animações. Você não precisa reescrever CSS — basta **sobrescrever as variáveis** no seu próprio arquivo CSS.

```
Componentes RSdata  →  HTML com classes .rs-*  →  SEU CSS estiliza
   (nunca mudam)           (sempre igual)            (você controla)
```

---

## 2. NÍVEL 1: VARIÁVEIS CSS (CORES E FORMAS)

O jeito mais rápido: crie um arquivo CSS no seu projeto e sobrescreva as variáveis que quiser mudar.

### Passo a passo

**1. Crie** `assets/tema-rsdata.css` no seu frontend:

```css
:root {
  /* Cores da sua marca */
  --rs-primary: #6d28d9;
  --rs-accent:  #f59e0b;
  --rs-light:   #f3e8ff;
  --rs-success: #10b981;

  /* Tom da página */
  --rs-page-bg: #faf5ff;
  --rs-surface: #ffffff;
  --rs-border: #e9d5ff;
  --rs-text: #4c1d95;
  --rs-text-muted: #7c3aed;

  /* Tipografia */
  --rs-font: 'Inter', sans-serif;
  --rs-row-height: 48px;

  /* Cantos */
  --rs-radius-lg: 4px;
  --rs-radius: 4px;
  --rs-radius-sm: 4px;
}
```

**2. Importe no plugin** em vez do `default.css`:

```ts
// plugins/rsdata.ts
import { RsData } from '@rsdata/nuxt'
import '~/assets/tema-rsdata.css'      // ← seu tema

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RsData)
})
```

**3. Recarregue.** A tabela agora tem sua identidade visual. Zero código de componente alterado.

### Todas as variáveis disponíveis

| Categoria | Variável | Controla |
|---|---|---|
| **Identidade** | `--rs-primary` | Cor principal (destaque, página ativa) |
| | `--rs-accent` | Cor de ação (foco, links, interações) |
| | `--rs-light` | Cor clara (superfícies, hover) |
| | `--rs-success` | Cor de sucesso (badges positivos) |
| **Superfície** | `--rs-page-bg` | Fundo da página |
| | `--rs-surface` | Fundo do card da tabela |
| | `--rs-surface-alt` | Fundo alternativo (cabeçalho) |
| | `--rs-border` | Cor da borda principal |
| | `--rs-border-soft` | Cor da borda sutil (entre linhas) |
| **Texto** | `--rs-text` | Cor do texto principal |
| | `--rs-text-muted` | Cor do texto secundário |
| | `--rs-text-subtle` | Cor do texto terciário |
| **Interação** | `--rs-row-hover` | Cor do hover nas linhas |
| | `--rs-focus-ring` | Cor do anel de foco |
| | `--rs-accent-soft` | Cor de fundo sutil para ações |
| **Badges** | `--rs-badge-bg` | Fundo do badge padrão |
| | `--rs-badge-text` | Texto do badge padrão |
| | `--rs-badge-success-bg` | Fundo do badge de sucesso |
| | `--rs-badge-success-text` | Texto do badge de sucesso |
| | `--rs-badge-neutral-bg` | Fundo do badge neutro |
| | `--rs-badge-neutral-text` | Texto do badge neutro |
| | `--rs-badge-warning-bg` | Fundo do badge de aviso |
| | `--rs-badge-warning-text` | Texto do badge de aviso |
| **Erro** | `--rs-error-bg` | Fundo da célula com erro |
| | `--rs-error-border` | Borda da célula com erro |
| | `--rs-error-text` | Texto do erro |
| | `--rs-danger` | Cor de ação destrutiva |
| | `--rs-danger-soft` | Fundo de ação destrutiva |
| **Skeleton** | `--rs-skeleton-a` | Cor A do shimmer (loading) |
| | `--rs-skeleton-b` | Cor B do shimmer (loading) |
| **Paginação** | `--rs-page-current-bg` | Fundo da página ativa |
| | `--rs-page-current-text` | Texto da página ativa |
| **Forma** | `--rs-radius-lg` | Raio de borda do card (12px) |
| | `--rs-radius` | Raio de borda médio (8px) |
| | `--rs-radius-sm` | Raio de borda pequeno (6px) |
| | `--rs-shadow-card` | Sombra do card |
| | `--rs-shadow-menu` | Sombra do dropdown |
| **Movimento** | `--rs-transition` | Transição rápida (150ms) |
| | `--rs-transition-slow` | Transição lenta (200ms) |
| **Tipografia** | `--rs-font` | Fonte da tabela |
| **Densidade** | `--rs-row-height` | Altura da linha (52px) |
| | `--rs-header-height` | Altura do cabeçalho (40px) |
| | `--rs-cell-x` | Padding horizontal da célula (16px) |

---

## 3. NÍVEL 2: CLASSES CSS (ELEMENTOS ESPECÍFICOS)

Se variáveis não forem suficientes (ex: "quero gradiente no cabeçalho, não cor sólida"), use as classes CSS diretamente.

```css
/* Cabeçalho com gradiente */
.rs-thead th {
  background: linear-gradient(135deg, #1e3a5f, #2d6a4f);
  color: white;
  text-transform: none;
  font-size: 14px;
  letter-spacing: 0.02em;
  border-bottom: 3px solid #65ba88;
}

/* Linhas alternadas manualmente (zebra customizado) */
.rs-row:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
}

/* Células de número alinhadas à direita com fonte monospace */
.rs-cell[data-align="right"] {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  letter-spacing: -0.02em;
}

/* Paginação minimalista */
.rs-pagination {
  border-top: 1px solid var(--rs-border);
  padding: 12px 0;
  justify-content: center;
}
.rs-pagination button {
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--rs-text-muted);
  padding: 6px 12px;
}
.rs-pagination button:hover {
  color: var(--rs-accent);
}

/* Badges customizados */
.rs-badge {
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
  font-weight: 700;
}
```

---

## 4. NÍVEL 3: TEMA PRÓPRIO DO ZERO

Para controle total, **não importe** o `default.css`. Crie seu próprio CSS do zero, estilizando cada classe `.rs-*` como quiser.

O contrato é: os componentes sempre geram o mesmo HTML com as mesmas classes. Você decide o visual de cada uma.

### Estrutura HTML que os componentes geram

```html
<div class="rs-table">
  <!-- Filtros -->
  <div class="rs-filters">
    <input class="rs-filter-input" />
    <select class="rs-filter-select" />
  </div>

  <!-- Tabela -->
  <table>
    <thead class="rs-thead">
      <tr>
        <th class="rs-th" data-sort="asc">
          Nome <span class="rs-sort-icon">▲</span>
        </th>
      </tr>
    </thead>
    <tbody class="rs-tbody">
      <tr class="rs-row">
        <td class="rs-cell">Coca-Cola</td>
        <td class="rs-cell rs-cell--error" data-rs-error="...">⚠</td>
        <td class="rs-cell"><span class="rs-badge rs-badge--success">Ativo</span></td>
        <td class="rs-cell rs-actions">
          <button class="rs-action-btn">⋯</button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Estados -->
  <div class="rs-loading">Carregando...</div>
  <div class="rs-empty">Nenhum registro encontrado</div>

  <!-- Paginação -->
  <div class="rs-pagination">
    <button class="rs-page-btn rs-page-btn--prev">Anterior</button>
    <span class="rs-page-current">1</span>
    <button class="rs-page-btn rs-page-btn--next">Próximo</button>
  </div>
</div>
```

### Exemplo: tema mínimo (50 linhas)

```css
/* Arquivo: assets/meu-tema.css */

/* Variáveis */
:root {
  --cor-fundo: #f5f5f5;
  --cor-card: #ffffff;
  --cor-texto: #1a1a1a;
  --cor-destaque: #2563eb;
  --cor-borda: #e5e5e5;
  --fonte: system-ui, sans-serif;
}

/* Card */
.rs-table {
  background: var(--cor-card);
  border: 1px solid var(--cor-borda);
  border-radius: 8px;
  font-family: var(--fonte);
  font-size: 14px;
  color: var(--cor-texto);
  overflow: hidden;
}

/* Cabeçalho */
.rs-thead th {
  background: var(--cor-fundo);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  border-bottom: 1px solid var(--cor-borda);
  cursor: pointer;
  user-select: none;
}

.rs-thead th:hover {
  color: var(--cor-destaque);
}

/* Corpo */
.rs-row {
  transition: background 0.15s;
}

.rs-row:hover {
  background: rgba(37, 99, 235, 0.04);
}

.rs-cell {
  padding: 14px 16px;
  border-bottom: 1px solid var(--cor-borda);
}

/* Paginação */
.rs-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border-top: 1px solid var(--cor-borda);
}

.rs-pagination button {
  border: 1px solid var(--cor-borda);
  background: var(--cor-card);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.rs-pagination button:hover {
  border-color: var(--cor-destaque);
  color: var(--cor-destaque);
}

/* Filtros */
.rs-filters {
  padding: 16px;
  border-bottom: 1px solid var(--cor-borda);
}

.rs-filter-input {
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  width: 200px;
}

.rs-filter-input:focus {
  outline: none;
  border-color: var(--cor-destaque);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* Loading */
.rs-loading {
  text-align: center;
  padding: 48px;
  color: #999;
}

/* Empty */
.rs-empty {
  text-align: center;
  padding: 64px 24px;
  color: #999;
  font-size: 14px;
}
```

---

## 5. GALERIA DE EXEMPLOS

### Exemplo A — Corporativo (tons de azul)

```css
:root {
  --rs-primary: #1e40af;
  --rs-accent: #3b82f6;
  --rs-light: #dbeafe;
  --rs-success: #22c55e;
  --rs-page-bg: #f1f5f9;
  --rs-text: #1e293b;
  --rs-font: 'Segoe UI', system-ui, sans-serif;
  --rs-radius-lg: 6px;
  --rs-radius: 4px;
  --rs-row-height: 48px;
}
```

### Exemplo B — Minimalista (preto e branco)

```css
:root {
  --rs-primary: #000000;
  --rs-accent: #555555;
  --rs-light: #f5f5f5;
  --rs-success: #000000;
  --rs-page-bg: #ffffff;
  --rs-surface: #ffffff;
  --rs-border: #e5e5e5;
  --rs-text: #111111;
  --rs-text-muted: #777777;
  --rs-font: 'Inter', -apple-system, sans-serif;
  --rs-radius-lg: 0px;
  --rs-radius: 0px;
  --rs-radius-sm: 0px;
  --rs-shadow-card: none;
  --rs-row-height: 44px;
}
```

### Exemplo C — Dark mode sempre ativo

```css
:root {
  --rs-page-bg: #0f172a;
  --rs-surface: #1e293b;
  --rs-surface-alt: #334155;
  --rs-border: #334155;
  --rs-border-soft: #1e293b;
  --rs-text: #f1f5f9;
  --rs-text-muted: #94a3b8;
  --rs-text-subtle: #64748b;
  --rs-primary: #38bdf8;
  --rs-accent: #818cf8;
  --rs-light: rgba(56, 189, 248, 0.1);
  --rs-success: #34d399;
  --rs-row-hover: rgba(56, 189, 248, 0.06);
  --rs-shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

### Exemplo D — Colorido e vibrante

```css
:root {
  --rs-primary: #ec4899;
  --rs-accent: #f97316;
  --rs-light: #fce7f3;
  --rs-success: #84cc16;
  --rs-page-bg: #fdf2f8;
  --rs-surface: #ffffff;
  --rs-border: #fbcfe8;
  --rs-text: #831843;
  --rs-text-muted: #be185d;
  --rs-font: 'Poppins', sans-serif;
  --rs-radius-lg: 16px;
  --rs-radius: 12px;
  --rs-row-height: 56px;
}
```

---

## 6. CLASSES CSS DE REFERÊNCIA

Todas as classes que os componentes emitem. Use-as no Nível 2 e 3.

| Classe | Elemento |
|---|---|
| `.rs-table` | Container principal |
| `.rs-filters` | Barra de filtros |
| `.rs-filter-input` | Input de filtro (texto) |
| `.rs-filter-select` | Select de filtro (dropdown) |
| `.rs-thead` | Cabeçalho da tabela |
| `.rs-th` | Célula do cabeçalho |
| `.rs-sort-icon` | Ícone de ordenação |
| `.rs-tbody` | Corpo da tabela |
| `.rs-row` | Linha |
| `.rs-cell` | Célula |
| `.rs-cell--error` | Célula com erro (produção) |
| `.rs-cell--error-debug` | Célula com erro (dev) |
| `.rs-badge` | Badge de status |
| `.rs-badge--success` | Badge verde |
| `.rs-badge--neutral` | Badge neutro |
| `.rs-badge--warning` | Badge amarelo |
| `.rs-actions` | Container de ações |
| `.rs-action-btn` | Botão de ação |
| `.rs-action-menu` | Dropdown de ações |
| `.rs-pagination` | Barra de paginação |
| `.rs-page-btn` | Botão de página |
| `.rs-page-btn--prev` | Botão Anterior |
| `.rs-page-btn--next` | Botão Próximo |
| `.rs-page-current` | Página atual |
| `.rs-loading` | Estado de carregamento |
| `.rs-empty` | Estado vazio |

---

## 7. FAQ

### Como aplico o tema só em UMA tabela, sem afetar as outras?

Envolva a tabela num container com uma classe própria e use escopo CSS:

```css
.minha-tabela-especial {
  --rs-primary: #dc2626;
  --rs-accent: #f97316;
}
```

```vue
<div class="minha-tabela-especial">
  <RsTable :columns="colunas" :adapter="adapter" />
</div>
```

As variáveis CSS respeitam o escopo do container — só afetam a tabela dentro dele.

### Como funciona o modo escuro?

O tema padrão detecta automaticamente `prefers-color-scheme: dark` do sistema operacional. Para forçar dark mode sempre, sobrescreva as variáveis de superfície e texto (veja Exemplo C). Para desabilitar, remova o bloco `@media (prefers-color-scheme: dark)` do seu CSS.

### Preciso manter as classes `.rs-*`? Posso usar Tailwind?

As classes `.rs-*` são o **contrato** entre os componentes e o CSS. Você não pode renomeá-las (os componentes as emitem no HTML), mas pode estilizá-las com qualquer ferramenta — CSS puro, Tailwind `@apply`, SCSS, o que preferir.

### Como mudo a fonte de uma coluna específica?

```css
/* Coluna de preço com fonte monospace */
.rs-cell[data-column="preco"] {
  font-family: 'JetBrains Mono', monospace;
}
```

O atributo `data-column` contém a `key` da coluna.

---

> **Documentos relacionados:** `USAGE.md` (como usar a tabela), `ARCHITECTURE.md` (camada Theme).