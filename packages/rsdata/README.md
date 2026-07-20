# RSdata

> Data Grid framework for Nuxt 3. One install, everything you need.

## Install

```bash
npm install rsdata
```

This installs both `@rosiumdata/core` (headless engine) and `@rosiumdata/nuxt` (Vue renderer).

## Quick start

```ts
// plugins/rsdata.ts
import { RsData } from '@rosiumdata/nuxt'
import '@rosiumdata/nuxt/theme/default.css'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(RsData)
})
```

```vue
<template>
  <RsTable :columns="columns" :adapter="adapter" />
</template>

<script setup>
import { column, LocalAdapter } from '@rosiumdata/core'

const columns = [
  column('id',   { type: 'number', label: 'ID' }),
  column('name', { type: 'text',   label: 'Name' }),
]

const adapter = new LocalAdapter([
  { id: 1, name: 'Coca-Cola' },
  { id: 2, name: 'Pepsi' },
])
</script>
```

## Documentation

- [Full usage guide](https://github.com/Rosembergg/RSdata/blob/main/docs/USAGE.md)
- [Theming guide](https://github.com/Rosembergg/RSdata/blob/main/docs/THEMING.md)
- [Architecture](https://github.com/Rosembergg/RSdata/blob/main/docs/ARCHITECTURE.md)
