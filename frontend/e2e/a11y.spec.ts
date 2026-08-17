import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { TODAY } from './helpers'

/**
 * Скринридерная доступность (критерий готовности этапа 2): на ключевых
 * страницах нет критических и серьёзных нарушений axe. Лёгкие/умеренные
 * предупреждения не валят пайплайн — план фиксирует только «0 serious/critical».
 *
 * Страницы проверяются в состоянии с данными (мок загружен), чтобы аудит
 * покрывал календарь, радиогруппу времени, таблицы и диалог формы.
 */
test.describe('a11y (axe)', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(TODAY)
  })

  const audit = async (page: import('@playwright/test').Page) => {
    const results = await new AxeBuilder({ page }).analyze()
    const severe = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(severe, JSON.stringify(severe, null, 2)).toEqual([])
  }

  test('лендинг без critical/serious нарушений', async ({ page }) => {
    await page.goto('/')
    await audit(page)
  })

  test('выбор слота без critical/serious нарушений', async ({ page }) => {
    await page.goto('/book/consultation-30')
    await expect(page.getByRole('radio', { name: /09:00/ })).toBeVisible()
    await page.getByRole('radio', { name: /09:00/ }).click()
    await audit(page)
  })

  test('админка (типы событий) без critical/serious нарушений', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('button', { name: 'Новый тип события' })).toBeVisible()
    await audit(page)
  })

  test('диалог создания типа события без critical/serious нарушений', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('button', { name: 'Новый тип события' }).click()
    await page.getByRole('dialog').waitFor({ state: 'visible' })
    await audit(page)
  })
})
