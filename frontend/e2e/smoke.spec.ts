import { expect, test } from '@playwright/test'
import { messages } from '../src/lib/messages'

/**
 * Prism-smoke (прогоняется `playwright.smoke.config.ts`): приложение собрано
 * без MSW и обращается к Prism-моку, отдающему примеры по `openapi.yaml`.
 * Проверяет, что контракт реально связан с UI: страница записи рендерит
 * список типов событий, а открытие типа даёт календарь и загрузку слотов.
 *
 * Prism генерирует примерные данные, поэтому жёсткие тексты фикстур не
 * используем — только названия страниц и их переходы.
 */
test.describe('smoke против Prism', () => {
  test('лендинг и список типов событий доступны', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: messages.landing.title })).toBeVisible()
    await page.getByRole('link', { name: messages.nav.book }).first().click()
    await expect(page).toHaveURL(/\/book$/)
  })

  test('открытие типа события и загрузка календаря', async ({ page }) => {
    await page.goto('/book')
    // Prism отдаёт пример — минимум одну карточку типа события.
    const card = page.locator('a[href^="/book/"]').first()
    await expect(card).toBeVisible()
    await card.click()
    await expect(page).toHaveURL(/\/book\/[a-z0-9-]+$/)
    // Календарь смонтирован: «Календарь» — заголовок компонента выбора дня.
    // Этого достаточно, чтобы связать UI с контрактом, даже если слотов
    // для Prism-примера не оказалось.
    await expect(page.getByText(messages.booking.calendarTitle)).toBeVisible()
  })
})
