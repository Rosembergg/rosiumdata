import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@rsdata/core': resolve(__dirname, '../packages/core/src/index.ts'),
      '@rsdata/nuxt/theme/default.css': resolve(
        __dirname,
        '../packages/nuxt/src/theme/default.css',
      ),
      '@rsdata/nuxt': resolve(__dirname, '../packages/nuxt/src/index.ts'),
    },
  },
})
