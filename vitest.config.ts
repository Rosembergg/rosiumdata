import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@rsdata/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@rsdata/nuxt': resolve(__dirname, 'packages/nuxt/src/index.ts'),
    },
  },
  test: {
    globals: true,
    include: ['packages/*/test/**/*.test.ts'],
  },
})
