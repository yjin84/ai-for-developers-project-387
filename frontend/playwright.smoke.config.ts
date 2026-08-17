import { defineConfig, devices } from '@playwright/test'

/**
 * Prism-smoke: приложение без MSW против реального `openapi.yaml`.
 *
 * Prism поднимается на 4010 (`npm run mock:api`), приложение — обычная
 * прод-сборка (`npm run build`), которая по `.env` смотрит на Prism.
 * Проверяет, что приложение рисует список типов событий на данных контракта.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /smoke\.spec\.ts/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    timezoneId: 'Europe/Moscow',
  },
  webServer: [
    {
      command: 'npm run mock:api',
      // Health-check Playwright требует 200, а Prism на `/`/`/index.html` отвечает
      // 404 (NO_PATH_MATCHED). Пингуем реальный маршрут контракта.
      url: 'http://127.0.0.1:4010/event-types',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run build && npm run preview:smoke',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
