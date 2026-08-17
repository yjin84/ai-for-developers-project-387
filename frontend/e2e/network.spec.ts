import { expect, test } from '@playwright/test'
import { setNetworkDown } from './helpers'
import { messages } from '../src/lib/messages'

/**
 * Устойчивость к сбоям сети (критерий готовности этапа 3): при недоступности
 * API показывается состояние ошибки с кнопкой «Повторить», а после
 * восстановления связи повторная попытка загружает данные.
 *
 * Сбой имитируется самим MSW (`__test/network` → `HttpResponse.error()`),
 * потому что `page.route` не перехватывает запросы, уже обработанные
 * service worker'ом MSW.
 *
 * Заметка о «зафиксированном времени»: сетевой сбой — ошибка запроса, и
 * react-query повторяет такие (`NetworkError`) дважды с задержкой через
 * «резерв». `page.clock.setFixedTime` заморозил бы эти таймеры, и состояние
 * ошибки никогда бы не наступило. Спека не выбирает слоты по времени, поэтому
 * фиксация времени здесь не нужна — таймеры работают реально.
 */
test.describe('сбои сети', () => {
  test('ошибка загрузки списка типов и повтор после восстановления сети', async ({ page }) => {
    // С лендинга (запросов нет) глушим сеть и идём на страницу типов событий.
    await page.goto('/')
    // Дождаться реального рендера: bootstrap рендерит приложение ТОЛЬКО после
    // `await startMockWorker()` (см. `src/main.tsx`). Пока заголовок не появился,
    // воркер MSW может ещё не перехватывать — toggle уйдёт впустую и приложение
    // потом получит данные (это и был флаки-баг `network.spec`).
    await expect(
      page.getByRole('heading', { name: messages.landing.title, exact: true }),
    ).toBeVisible()
    await setNetworkDown(page, true)

    await page.getByRole('link', { name: messages.nav.book }).first().click()
    // Ошибка наступает после исчерпания ретраев react-query (две задержки),
    // поэтому таймаут ассерта держим с запасом.
    await expect(page.getByText(messages.errors.networkTitle)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: messages.common.retry })).toBeVisible()

    // Восстанавливаем сеть и жмём «Повторить» — список типов загружается.
    // (Здесь одна зависимая загрузка — список типов, поэтому достаточно
    // одного ретрая; на странице слота их две — тип и слоты.)
    await setNetworkDown(page, false)
    await page.getByRole('button', { name: messages.common.retry }).click()
    await expect(page.getByRole('link', { name: /Консультация/ }).first()).toBeVisible()
  })
})
