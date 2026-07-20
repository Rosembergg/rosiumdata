<p align="center">
  <h1 align="center">RosiumData</h1>
  <p align="center">
    Data Grid framework. Separate your data from your UI — finally.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.0.1-blue" alt="Version">
  <img src="https://img.shields.io/badge/tests-376%20passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/core%20deps-zero-success" alt="Zero dependencies">
  <img src="https://img.shields.io/badge/status-v1.0%20MVP-orange" alt="Status">
  <img src="https://img.shields.io/badge/license-MTI-lightgrey" alt="License">
</p>

---

## What is RosiumData?

RosiumData is a **Data Grid framework** built for developers who need more than a pretty table. It separates data, logic, rendering, and theming into independent layers — so changing your visual identity never corrupts your data, and filtering never breaks your export.

Built for **Nuxt 3** today. Designed for **any framework** tomorrow.

```
Data Source  →  Data Engine  →  Render Engine  →  Theme
   Adapter         Core              Nuxt            CSS
```

---

## Why it exists

Most Data Grid libraries couple everything together: fetch, filter, style, and export all live in the same place. Every new feature becomes a hack stacked on the last one. The worst symptom: **visual styling leaks into your Excel exports**, corrupting data.

RosiumData fixes this at the architectural level. **Same data serves your screen, your filters, and your exports — zero style contamination.**

---

## Quick start

### 1. Install

```bash
npm install rosiumdata
```

This installs `@rosiumdata/core` (headless engine) + `@rosiumdata/nuxt` (Vue renderer) in a single command.

```
npm install
```

### 2. Register the plugin

```ts
// plugins/RosiumData.ts
import { RosiumData } from '@rosiumdata/nuxt'
import '@rosiumdata/nuxt/theme/default.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RosiumData)
})
```

### 3. Create your first table

```vue
<template>
  <RosiumTable :columns="columns" :adapter="adapter" />
</template>

<script setup>
import { column, LocalAdapter } from '@rosiumdata/core'

const columns = [
  column('id',     { type: 'number',  label: 'ID' }),
  column('name',   { type: 'text',    label: 'Name' }),
  column('price',  { type: 'number',  label: 'Price', mask: '$ #,##0.00' }),
  column('status', { type: 'select',  label: 'Status', options: {
    entries: { 1: 'Active', 2: 'Inactive' }
  }}),
  column('actions', { type: 'action', options: { actions: [
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete', danger: true },
  ]}}),
]

const adapter = new LocalAdapter([
  { id: 1, name: 'Coca-Cola',  price: 5.99, status: 1 },
  { id: 2, name: 'Pepsi',      price: 4.99, status: 2 },
  { id: 3, name: 'Guaraná',    price: 3.50, status: 1 },
])
</script>
```

**That's it.** Filters, sorting, pagination, and action buttons — all working. Zero configuration.

---

## Key features

### 🧠 Headless architecture
The Core (`@rosiumdata/core`) is pure TypeScript — zero framework dependencies. It runs anywhere. The Nuxt package is just a "skin" that renders the brain. Port to React tomorrow: new skin, same brain.

### 🔴 The Sacred Line
**Data transformation** (e.g. `1 → "Active"`, `$100.00`) lives in the Data Engine and goes to exports. **Visual presentation** (green, bold, centered) lives in the Theme and **never** touches your data. Export is always clean, always calculable.

### 🎨 Theme it your way
70+ CSS custom properties. Change 5 variables and the entire table matches your brand. Or write your own CSS from scratch — the components always emit the same HTML with the same `.rs-*` classes. [Full theming guide →](docs/THEMING.md)

### 🔌 Adapters: one contract, any backend
Same interface whether your data comes from an array, a REST API, or a Laravel backend. Swap adapters without touching your table code.

```ts
// Prototype
const adapter = new LocalAdapter(data)

// Production
const adapter = new LaravelAdapter('https://api.example.com/products', {
  headers: { Authorization: `Bearer ${token}` }
})
```

### 🚨 Fail Loud
Invalid data (e.g. `null` where a number was expected) is never silently swallowed. In dev mode, RosiumData points exactly at the broken cell with column, row, expected type, and received value. In production, a subtle indicator keeps the table alive without exposing internals.

### ⚡ Zero dependencies in the Core
`@rosiumdata/core` has **zero runtime dependencies**. Literally `"dependencies": {}`. Every dependency lives in isolated plugins or adapters. If a library dies, RosiumData doesn't.

### 🌐 Locale-aware formatting (default pt-BR)
Numbers, dates, and currencies are formatted via the native `Intl` API — zero dependencies. Default is Brazilian Portuguese (`R$ 1.000,00`, `DD/MM/YYYY`). Change with one line: `new RosiumTable({ columns, locale: 'en-US' })`. Per-column override for multi-currency tables. [Full guide →](docs/USAGE.md#10-locale--formatting)

---

## Quick comparison

| | RosiumData | TanStack Table | AG Grid | PowerGrid |
|---|---|---|---|---|
| **Paradigm** | Headless + batteries included | Headless | Full-featured | Laravel-coupled |
| **Core deps** | 0 | 0 | 0 | Laravel |
| **Framework** | Nuxt first, any later | Any | Any | Laravel only |
| **Data ↔ Style separation** | Architecture-level (4 layers) | User's responsibility | Config-based | Mixed |
| **Export without style contamination** | Guaranteed | Depends on setup | Configurable | No |
| **Server-side by default** | ✅ | Configurable | ✅ | ✅ |
| **Custom theming** | CSS variables + full CSS | CSS only | Themes + CSS | Limited |

---

## Architecture

| Layer | Package | Responsibility | Never |
|---|---|---|---|
| **Data Source** | `@rosiumdata/core` | Adapter: translates the outside world (API, array, DB) into flat data | Never writes data (read-only) |
| **Data Engine** | `@rosiumdata/core` | Brain: state, filters, sorting, pagination, data transformation, validation | Never draws, never knows where data comes from |
| **Render Engine** | `@rosiumdata/nuxt` | Skin: Vue components that draw the skeleton. The only layer that knows the framework | Never touches data |
| **Theme** | CSS file | Skin: colors, fonts, spacing. Pure CSS, zero framework deps | Never alters structure |

---

## Documentation

| Document | What it covers |
|---|---|
| [USAGE.md](docs/USAGE.md) | Installation, configuration, all features with code examples |
| [THEMING.md](docs/THEMING.md) | Complete visual customization — variables, classes, from-scratch themes |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full architecture, contracts, rules, and design decisions |
| [BRAIN.md](.ai/BRAIN.md) | Project index — read this first |
| [VISION.md](VISION.md) | Why we exist, where we're going |
| [PRINCIPLES.md](docs/PRINCIPLES.md) | The 7 principles every decision must pass |
| [ROADMAP.md](docs/ROADMAP.md) | Phases from zero to v1.0 and beyond |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

---

## Tech stack

| Tool | Purpose |
|---|---|
| **TypeScript** | Language — strict mode |
| **npm** | Package manager — workspaces |
| **unbuild** | Build — CJS + ESM + types |
| **Vitest** | Tests — 376 passing |
| **Nuxt 3 / Vue 3** | Render Engine |
| **CSS puro** | Theme — zero dependencies |

---

## Roadmap

| Phase | What | Status |
|---|---|---|
| 0 | Setup: monorepo, TS, build, tests | ✅ |
| 1 | Data Engine + Column types (7 types) | ✅ |
| 2 | Local adapter (in-memory array) | ✅ |
| 3 | Render Engine Nuxt + Theme default | ✅ |
| 4 | Actions + Fail Loud (visual) | ✅ |
| 5 | Server-side adapter (Laravel) | ✅ |
| **v1.0** | **MVP complete — 376 tests passing** | ✅ |
| Post-1.0 | Export (CSV/Excel), row selection, cache | Backlog |

---

## Contributing


RosiumData is in the *dogfooding* phase—created primarily to address an internal need. Contributions, questions, and feedback are welcome.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built for developers who need to handle real data — from the simplest case to the most complex — without hacks and without style leaking into Excel.</sub>
</p>
