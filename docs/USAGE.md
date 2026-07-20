# USAGE.md — RSdata Usage Guide

> How to install, configure, and use RSdata in your Nuxt 3 project. From the
> simplest case to the most complex. All examples are based on the real code.

---

## INDEX

1. [Installation](#1-installation)
2. [First table (3 lines)](#2-first-table-3-lines)
3. [Columns and Types](#3-columns-and-types)
4. [Filters](#4-filters)
5. [Sorting](#5-sorting)
6. [Pagination](#6-pagination)
7. [Actions](#7-actions)
8. [Adapters (where data comes from)](#8-adapters-where-data-comes-from)
9. [Fail Loud (data validation)](#9-fail-loud-data-validation)
10. [Locale & Formatting](#10-locale--formatting)
11. [Theme & Styling](#11-theme--styling)
12. [Persistent Preferences](#12-persistent-preferences)
13. [Complete API](#13-complete-api)

---

## 1. INSTALLATION

### Local usage (before npm publication)

While RSdata is not published on the npm registry, use a local path in your Nuxt frontend `package.json`:

```json
{
  "dependencies": {
    "@rsdata/core": "file:../RStable/packages/core",
    "@rsdata/nuxt": "file:../RStable/packages/nuxt"
  }
}
```

Adjust `../RStable/` to the real path between your `frontend/` and the `RStable/` folder. Then:

```bash
cd frontend
npm install
```

> **Important:** RSdata must be built first. Run `npm run build` in the RSdata root to generate the `dist/` folder in both packages. Without it, the import fails.

### When published on npm (future)

```bash
npm install @rsdata/core @rsdata/nuxt
```

### Registering in Nuxt

Create a plugin file at `plugins/rsdata.ts`:

```ts
// frontend/plugins/rsdata.ts
import { RsData } from '@rsdata/nuxt'
import '@rsdata/nuxt/theme/default.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RsData)
})
```

> **Note:** `RsData` is a **Vue Plugin**, not a Nuxt Module. It is registered via `plugins/`, not in `modules` in `nuxt.config.ts`.

---

## 2. FIRST TABLE (3 LINES)

The simplest case: local data, no server. Just `columns` + `adapter` as props — the component handles everything.

```vue
<template>
  <RsTable :columns="columns" :adapter="adapter" />
</template>

<script setup>
import { column, LocalAdapter } from '@rsdata/core'

const columns = [
  column('id',     { type: 'number',  label: 'ID' }),
  column('name',   { type: 'text',    label: 'Name' }),
  column('price',  { type: 'number',  label: 'Price', mask: 'R$ #,##0.00' }),
  column('status', { type: 'select',  label: 'Status', options: { 1: 'Active', 2: 'Inactive' } }),
]

const adapter = new LocalAdapter([
  { id: 1, name: 'Coca-Cola', price: 5.99, status: 1 },
  { id: 2, name: 'Pepsi',     price: 4.99, status: 2 },
  { id: 3, name: 'Guaraná',   price: 3.50, status: 1 },
])
</script>
```

**Result:** a table with 4 columns, 3 rows, filters, sorting, and pagination — all working. Zero configuration beyond this.

---

## 3. COLUMNS AND TYPES

### `column(key, config)`

Creates a column definition:

```ts
import { column } from '@rsdata/core'

column('field_name', {
  type: 'text',          // required — defines the behavior
  label: 'Name',         // optional — header text (default: key)
  mask: 'R$ #,##0.00',   // optional — display mask (number, date)
  locale: 'pt-BR',       // optional — locale override for this column
  currency: 'BRL',       // optional — currency ISO code
  transform: fn,         // optional — custom value transformation
  options: {},           // optional — depends on type
  sortable: true,        // optional — allows sorting (default: true, except 'action')
  filterable: true,      // optional — allows filtering (default: true, except 'action')
  visible: true,         // optional — visible in the table (default: true)
  alignment: 'right',    // optional — alignment (default: by type)
  exportAsFormatted: false, // optional — export as formatted text instead of raw value
})
```

### Available types

| Type | Default filter | Sorting | Alignment | `options` |
|---|---|---|---|---|
| `'text'` | contains | Alphabetical | Left | — |
| `'number'` | `=` | Numeric | Right | — |
| `'date'` | between (range) | Chronological | Center | — |
| `'datetime'` | between (range) | Chronological | Center | — |
| `'boolean'` | equals (dropdown Yes/No) | No < Yes | Center | — (displays `Yes`/`No`; use `transform` to customize) |
| `'select'` | equals (dropdown) | By raw value | Left | `{ value: 'Label' }` (flat map) |
| `'action'` | — | — | Center | `{ actions: ActionDefinition[] }` (use `actionColumn()`) |

### Examples

```ts
// Text
column('name', { type: 'text', label: 'Product Name' })

// Number with mask (locale-aware)
column('price', { type: 'number', label: 'Price', mask: 'R$ #,##0.00' })

// Date (locale-aware — pt-BR shows DD/MM/YYYY by default)
column('createdAt', { type: 'date', label: 'Created at' })

// Select (enum) — flat map value → label
column('status', {
  type: 'select',
  label: 'Status',
  options: { 1: 'Active', 2: 'Inactive', 3: 'Pending' }
})

// Boolean (displays "Yes"/"No" by default; customize with transform)
column('active', {
  type: 'boolean',
  label: 'Active',
  transform: (v) => (v ? 'Enabled' : 'Disabled')  // optional
})

// Number with US locale on a Brazilian table
column('price_usd', {
  type: 'number',
  label: 'Price (USD)',
  locale: 'en-US',
  currency: 'USD',
  mask: '$ #,##0.00'
})
```

---

## 4. FILTERS

Each column type has automatic filter operators. Inputs are rendered by `<RsFilters>` inside the table.

### Operators by type

The first in the list is the default used by `<RsFilters>` inputs.

| Type | Operators |
|---|---|
| `text` | `contains`, `equals`, `startsWith`, `endsWith` |
| `number` | `=`, `>`, `<`, `>=`, `<=`, `between` |
| `date` / `datetime` | `between`, `before`, `after`, `equals` |
| `boolean` | `equals` |
| `select` | `equals` |

> **Note:** when using `LaravelAdapter`, these operators are automatically translated into URL query params: `contains`→`like`, `equals`/`=`→`eq`, `>`→`gt`, `<`→`lt`, `>=`→`gte`, `<=`→`lte`, `between`→`between`, `before`→`before`, `after`→`after`, `startsWith`→`starts_with`, `endsWith`→`ends_with`.

### Programmatic API

```ts
import { RsTable } from '@rsdata/core'
import { useRsTable } from '@rsdata/nuxt'

const table = new RsTable({ columns })
table.useAdapter(adapter)

const { filter } = useRsTable(table)

filter({ column: 'name', operator: 'contains', value: 'coke' })
filter({ column: 'price', operator: '>', value: 10 })
filter({ column: 'status', operator: 'equals', value: 1 }) // raw value, not label

// Remove filter: empty or null value
filter({ column: 'name', operator: 'contains', value: '' })
```

---

## 5. SORTING

The table header is clickable. Each click toggles between `asc`, `desc`, and no sort.

### Programmatic API

```ts
const { sort } = useRsTable(table)

sort('name', 'asc')
sort('price', 'desc')
```

---

## 6. PAGINATION

Controlled by Previous/Next buttons in the table footer. Default: 20 items per page.

### Programmatic API

```ts
const { goToPage, setPageSize, getState } = useRsTable(table)

goToPage(3)
setPageSize(50)

const state = getState()
// { page: 3, pageSize: 50, total: 200, totalPages: 4, rows: [...], locale: 'pt-BR', ... }
```

---

## 7. ACTIONS

Columns of type `'action'` render buttons per row. RSdata emits an event with `{ key, row }` — execution logic is 100% yours. *"RSdata is the messenger; you bring the weapon."*

### Defining actions

```ts
import { column } from '@rsdata/core'
import { actionColumn } from '@rsdata/nuxt'

const columns = [
  column('id', { type: 'number', label: 'ID' }),
  column('name', { type: 'text', label: 'Name' }),
  actionColumn('actions', [
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete', danger: true },
  ]),
]
```

### Capturing the click

```vue
<template>
  <RsTable :columns="columns" :adapter="adapter" @action="handleAction" />
</template>

<script setup>
function handleAction(event) {
  const { key, row } = event
  // row.raw contains the raw data for the entire row

  if (key === 'edit') {
    router.push(`/products/${row.raw.id}/edit`)
  } else if (key === 'delete') {
    confirmDeletion(row.raw.id)
  }
}
</script>
```

### Visual

- **1 action:** direct button on the row
- **2+ actions:** ⋯ icon that opens a dropdown with options
- **`danger: true` action:** red text in the dropdown

---

## 8. ADAPTERS (WHERE DATA COMES FROM)

### 8.1 LocalAdapter (in-memory array)

For prototypes, tests, or data already in the frontend.

```ts
import { LocalAdapter } from '@rsdata/core'

const adapter = new LocalAdapter([
  { id: 1, name: 'Coca-Cola', price: 5.99 },
  { id: 2, name: 'Pepsi',     price: 4.99 },
])

<RsTable :columns="columns" :adapter="adapter" />
```

Filters, sorts, and paginates in the browser. Ideal for up to ~500 rows.

### 8.2 LaravelAdapter (server)

For production: the server filters, sorts, and paginates. The browser only displays.

```ts
import { LaravelAdapter } from '@rsdata/core'

const adapter = new LaravelAdapter('https://api.example.com/api/products', {
  headers: { Authorization: 'Bearer your-token' },
})
```

#### What the adapter sends (request)

```
GET /api/products?filter[price][gt]=50&sort=name&page=1&per_page=20
```

#### What the backend needs to return

```json
{
  "data": [
    { "id": 1, "name": "Coca-Cola", "price": 5.99, "status": 1 }
  ],
  "meta": {
    "current_page": 1,
    "total": 100,
    "per_page": 20
  }
}
```

- `data` (required): array of rows
- `meta.total` (required): total records. If absent, looks for `total` at root level

#### Example Laravel controller

```php
// app/Http/Controllers/ProductController.php
public function index(Request $request)
{
    $query = Product::query();

    // Filters
    foreach ($request->input('filter', []) as $column => $operators) {
        foreach ($operators as $operator => $value) {
            match ($operator) {
                'gt'      => $query->where($column, '>', $value),
                'gte'     => $query->where($column, '>=', $value),
                'lt'      => $query->where($column, '<', $value),
                'lte'     => $query->where($column, '<=', $value),
                'eq'      => $query->where($column, $value),
                'like'    => $query->where($column, 'like', "%{$value}%"),
                'between' => $query->whereBetween($column, $value),
                default   => null,
            };
        }
    }

    // Sorting
    if ($sort = $request->input('sort')) {
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');
        $query->orderBy($column, $direction);
    }

    return $query->paginate($request->input('per_page', 20));
}
```

### 8.3 Creating your own adapter

Implement the `DataAdapter` interface:

```ts
import type { DataAdapter, Query, FetchResult, Row, FilterOption } from '@rsdata/core'

class MyAdapter implements DataAdapter {
  async fetch(query: Query): Promise<FetchResult> {
    // Receives Query, returns { rows, total }
  }

  async fetchAll(query: Query): Promise<Row[]> {
    // Same as fetch, but without pagination
  }

  async fetchFilterOptions?(column: string): Promise<FilterOption[]> {
    // Optional: returns dropdown options for the column
  }
}
```

---

## 9. FAIL LOUD (DATA VALIDATION)

RSdata automatically detects invalid data based on the column type. E.g. `price: "free"` where the type is `number`.

### DEV mode (`:debug="true"`)

The table shows the exact error location. Useful during development.

```vue
<RsTable :columns="columns" :adapter="adapter" :debug="true" />
```

Displays: ``Column `price`, row 42, expected `number`, received `"free"` ``.

### PRODUCTION mode (`:debug="false"` — default)

Subtle ⚠ icon in the cell. The end user sees no internal details. The table keeps working.

### Capturing errors via code

```ts
const table = new RsTable({ columns })
table.on('error', (err) => {
  // err: { column, rowIndex, expected, received }
  console.error(`Error: column ${err.column}, row ${err.rowIndex}, expected ${err.expected}`)
})
```

---

## 10. LOCALE & FORMATTING

RSdata uses locale-aware formatting via the native `Intl` API (zero dependencies). The default locale is `'pt-BR'` (Brazilian Portuguese: `R$ 1.000,00`, `DD/MM/YYYY`).

### Setting a global locale

```ts
// Brazilian (default — no config needed)
const table = new RsTable({ columns })

// US English
const table = new RsTable({ columns, locale: 'en-US' })
// → $1,000.00 | 12/25/2024

// German
const table = new RsTable({ columns, locale: 'de-DE' })
// → 1.000,00 € | 25.12.2024

// Japanese
const table = new RsTable({ columns, locale: 'ja-JP' })
// → ￥1,000 | 2024/12/25
```

### Per-column override

A specific column can use a different locale or currency from the table default:

```ts
const table = new RsTable({ columns, locale: 'pt-BR' })

const columns = [
  // This column uses the table's locale (pt-BR → R$)
  column('price_brl', { type: 'number', label: 'Price (BRL)' }),

  // This column overrides locale and currency
  column('price_usd', {
    type: 'number',
    label: 'Price (USD)',
    locale: 'en-US',
    currency: 'USD',
    mask: '$ #,##0.00'
  }),
]
```

### Locale-aware sorting

Text sorting uses `String.localeCompare()` with the configured locale, so accented characters sort correctly:

- `pt-BR`: `água` < `bebida` (accent-insensitive)
- `en-US`: `água` > `bebida` (accent treated as different character)

---

## 11. THEME & STYLING

### Default theme

The default CSS is imported in the plugin:

```ts
// plugins/rsdata.ts
import '@rsdata/nuxt/theme/default.css'
```

### Quick customization (colors)

```css
:root {
  --rs-primary: #1c203f;   /* dark blue */
  --rs-accent:  #65ba88;   /* water green */
  --rs-light:   #cde9f2;   /* light blue */
  --rs-success: #66b32e;   /* light green */
}
```

> **Complete theming guide:** `THEMING.md` — 3 customization levels, 70+ CSS variables, 4 ready-to-use examples, from-scratch themes, dark mode.

### Dark mode

Two mechanisms, both supported:

1. **OS preference:** auto-detects `prefers-color-scheme: dark`
2. **`.dark` class on `<html>`:** compatible with Tailwind `darkMode: 'class'`

---

## 12. PERSISTENT PREFERENCES

The `persistence` prop saves to `localStorage`:

```vue
<RsTable :columns="columns" :adapter="adapter" persistence="my-table" />
```

What is saved: column order, visible columns, page size.

**Explicit opt-in** — without the prop, nothing is saved. Each table should have a unique key.

---

## 13. COMPLETE API

### `@rsdata/core` — main exports

| Export | Type | Description |
|---|---|---|
| `RsTable` | Class | Live Data Engine instance |
| `column(key, config)` | Function | Create column definition |
| `LocalAdapter` | Class | In-memory array adapter |
| `LaravelAdapter` | Class | Laravel backend adapter |
| `EventEmitter` | Class | Pure JS event system |
| `applyFilters` | Function | Apply filters to an array |
| `sortArray` | Function | Sort array |
| `paginateArray` | Function | Paginate array |
| `calculateTotalPages` | Function | Math.ceil(total / pageSize) |
| `formatDefaultValue` | Function | Format value by column type |
| `validateRow` / `validateRows` | Function | Validate data (Fail Loud) |

### `RsTable` — public methods

| Method | Description |
|---|---|
| `new RsTable({ columns, pageSize?, locale? })` | Create instance |
| `.useAdapter(adapter)` | Connect data source |
| `.filter({ column, operator, value })` | Apply filter |
| `.sort(column, direction)` | Sort by column |
| `.goToPage(n)` | Navigate to page |
| `.setPageSize(n)` | Change items per page |
| `.getRows()` | Current page rows (transformed) |
| `.getTotal()` | Total records |
| `.getState()` | Full state snapshot |
| `.hideColumn(key)` | Hide column |
| `.showColumn(key)` | Show column |
| `.reorderColumns([...keys])` | Reorder visible columns |
| `.getFilterOptions(column)` | Dropdown options from adapter |
| `.on('data:loaded', fn)` | Event: data loaded |
| `.on('error', fn)` | Event: error (Fail Loud) |
| `.on('state:changed', fn)` | Event: state changed |

### `@rsdata/nuxt` — main exports

| Export | Type | Description |
|---|---|---|
| `RsData` | Vue Plugin | `app.use(RsData)` |
| `useRsTable(table)` | Composable | Core ↔ Vue bridge |
| `RsDataTable` | Component | Main component (`<RsTable>`) |
| `RsThead` | Component | Clickable header |
| `RsTbody` | Component | Table body |
| `RsActions` | Component | Action buttons |
| `RsPagination` | Component | Pagination controls |
| `RsFilters` | Component | Filter inputs |
| `actionColumn()` | Function | Helper for action column |
| `readPreferences()` | Function | Restore preferences from localStorage |
| `savePreferences()` | Function | Persist preferences to localStorage |

### `<RsTable>` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `ColumnDefinition[]` | — | Column definitions |
| `adapter` | `DataAdapter` | — | Data source |
| `table` | `RsTable` | — | Pre-configured instance (control mode) |
| `pageSize` | `number` | `20` | Items per page |
| `debug` | `boolean` | `import.meta.env.DEV` | Fail Loud dev mode |
| `persistence` | `string` | — | localStorage key (opt-in) |

### `<RsTable>` events

The component emits a **single event**:

| Event | Payload | When |
|---|---|---|
| `@action` | `{ key: string, row: TransformedRow }` | Action clicked |

Other events are on the **Core instance** (`RsTable`), via `table.on(...)`:

| Event (Core) | Payload | When |
|---|---|---|
| `data:loaded` | `TransformedRow[]` | Data loaded |
| `error` | `ValidationError` | Fail Loud |
| `state:changed` | `RsTableState` | State changed |

---

## FULL EXAMPLE (PRODUCTION)

```vue
<template>
  <RsTable
    :columns="columns"
    :adapter="adapter"
    :pageSize="25"
    persistence="products"
    @action="handleAction"
  />
</template>

<script setup>
import { column, LaravelAdapter } from '@rsdata/core'
import { actionColumn } from '@rsdata/nuxt'

const columns = [
  column('id',       { type: 'number',  label: 'ID' }),
  column('name',     { type: 'text',    label: 'Product' }),
  column('category', { type: 'select',  label: 'Category', options: { 1: 'Beverages', 2: 'Food', 3: 'Hygiene', 4: 'Cleaning' } }),
  column('price',    { type: 'number',  label: 'Price', mask: 'R$ #,##0.00' }),
  column('stock',    { type: 'number',  label: 'Stock' }),
  column('status',   { type: 'select',  label: 'Status', options: { 1: 'Active', 2: 'Inactive', 3: 'Pending' } }),
  column('created_at', { type: 'date',  label: 'Date' }),
  actionColumn('actions', [
    { key: 'edit',   label: 'Edit' },
    { key: 'delete', label: 'Delete', danger: true },
  ]),
]

const adapter = new LaravelAdapter('https://api.example.com/api/products', {
  headers: { Authorization: `Bearer ${token}` }
})

function handleAction({ key, row }) {
  if (key === 'edit')   router.push(`/products/${row.raw.id}`)
  if (key === 'delete') confirmDeletion(row.raw.id)
}
</script>
```

---

> **Related documents:** `ARCHITECTURE.md` (internal structure), `THEMING.md` (visual customization), `FEATURES.md` (features by phase), `GLOSSARY.md` (terminology).
