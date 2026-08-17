import { defineConfig, devices } from '@playwright/test'

/**
 * Интеграционные E2E против реального бэкенда (Spring Boot на 4010).
 *
 * Приложение собрано обычной прод-сборкой (`npm run build`) и по `.env`
 * смотрит на реальный бэкенд. Бэкенд поднимается `./gradlew bootRun`
 * из `backend/` (H2 in-memory, стартует пустым). Этап A плана 260814.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /integration\.spec\.ts/,
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    timezoneId: 'Europe/Moscow',
  },
  webServer: [
    {
      command: './gradlew bootRun',
      cwd: '../backend',
      url: 'http://127.0.0.1:4010/event-types',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: 'npm run build && npm run preview:integration',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'integration',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
