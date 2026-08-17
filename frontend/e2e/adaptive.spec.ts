import { expect, test, type Page } from '@playwright/test'
import { TODAY } from './helpers'
import { messages } from '../src/lib/messages'

/**
 * Адаптивность (критерий готовности этапа 1): на мобильном вьюпорте ни одна
 * из ключевых страниц не должна иметь горизонтального скролла. Таблицы на
 * `md+` превращаются в карточки (см. `EventTypesTab`, `UpcomingBookingsTab`),
 * поэтому `<body>` не должен переполняться по горизонтали.
 *
 * Прогоняется только в проекте `mobile` (Pixel 5) — см. `testMatch`
 * в `playwright.config.ts`.
 */
test.describe('адаптивность mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(TODAY)
  })

  const expectNoHorizontalScroll = async (page: Page) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, 'нет горизонтального скролла на мобильном').toBeLessThanOrEqual(1)
  }

  test('лендинг не прокручивается горизонтально', async ({ page }) => {
    await page.goto('/')
    await expectNoHorizontalScroll(page)
  })

  test('список типов событий не прокручивается горизонтально', async ({ page }) => {
    await page.goto('/book')
    await expect(page.getByRole('link', { name: /Консультация/ }).first()).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('выбор слота не прокручивается горизонтально', async ({ page }) => {
    await page.goto('/book/consultation-30')
    await expect(page.getByRole('radio', { name: /09:00/ })).toBeVisible()
    await expectNoHorizontalScroll(page)
  })

  test('админка не прокручивается горизонтально', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('tab', { name: messages.admin.tabEventTypes })).toBeVisible()
    await expectNoHorizontalScroll(page)
  })
})
