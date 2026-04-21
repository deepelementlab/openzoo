import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setup-tests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/setup-tests.ts'],
    },
  },
  resolve: {
    alias: {
      '@openzoo/ui': path.resolve(__dirname, '../../ui/src'),
      '@openzoo/core': path.resolve(__dirname, '../../core/src'),
    },
  },
})
