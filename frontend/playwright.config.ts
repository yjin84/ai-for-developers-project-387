import { defineConfig, devices } from '@playwright/test'

/**
 * E2E против MSW-мока (desktop/mobile).
 *
 * Подаём ту же сборку, что уедет в прод (`npm run build && npm run preview`),
 * но с включённым MSW: `build:e2e` собирает `--mode test` (`.env.test`),
 * а `preview:e2e` отдаёт её на порту 4173. Все запросы API перехватывает
 * service worker (`src/test/browser.ts`) — реальный бэкенд не нужен.
 *
 * Смоук против Prism вынесен в отдельный конфиг `playwright.smoke.config.ts`,
 * чтобы не поднимать Prism и вторую сборку при обычном прогоне.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  // Prism-smoke и интеграция против реального бэкенда живут в отдельных
  // конфигах (`playwright.smoke.config.ts`, `playwright.integration.config.ts`)
  // — против отдельной сборки и сервера. Из обычного прогона их исключаем.
  testIgnore: [/smoke\.spec\.ts/, /integration\.spec\.ts/],
  fullyParallel: true,
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  // TZ критичен: фикстуры считают дни от локального «сегодня» (`new Date()`),
  // разбор времени слотов зависит от таймзоны. Без фиксации тесты дадут
  // разный результат локально и в CI.
  use: {
    baseURL: 'http://127.0.0.1:4173',
    timezoneId: 'Europe/Moscow',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build:e2e && npm run preview:e2e',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: /adaptive\.spec\.ts/,
    },
  ],
})
