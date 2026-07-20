import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@rosiumdata/core': resolve(__dirname, '../packages/core/src/index.ts'),
      '@rosiumdata/nuxt/theme/default.css': resolve(
        __dirname,
        '../packages/nuxt/src/theme/default.css',
      ),
      '@rosiumdata/nuxt': resolve(__dirname, '../packages/nuxt/src/index.ts'),
    },
  },
})
