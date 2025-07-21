import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@dadgic/shared': resolve(__dirname, './packages/shared/src'),
      '@dadgic/database': resolve(__dirname, './packages/database/src')
    }
  }
})
