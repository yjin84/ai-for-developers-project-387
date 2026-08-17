/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '@': path.resolve(import.meta.dirname, './src'),
          },
        },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        resolve: {
          alias: {
            '@': path.resolve(import.meta.dirname, './src'),
          },
        },
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
    ],
    // TZ критичен: groupSlotsByDay группирует по локальному дню, formatTime
    // печатает локальное время. Без фиксации тесты дадут разный результат
    // локально и в CI (там UTC). Это не перестраховка, а прямое следствие
    // того, как написан `src/lib/slots.ts`.
    //
    // VITE_API_BASE_URL задаётся явно, чтобы API-тесты не зависели от
    // локального `.env` и шли на мок-адрес программно (см. `src/test/handlers`).
    env: { TZ: 'Europe/Moscow', VITE_API_BASE_URL: 'http://api.test' },
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'src/components/ui/**',
        'src/test/**',
        'src/api/schema.d.ts',
        'src/main.tsx',
        '**/*.d.ts',
      ],
      thresholds: {
        // Жёсткие пороги только для чистых утилит и API-слоя; глобального
        // порога нет — остальной код покрывается тестами выборочно.
        'src/lib/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
        'src/api/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
      },
    },
  },
})
