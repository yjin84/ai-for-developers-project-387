import { expect, test } from '@playwright/test'
import { TODAY } from './helpers'
import { format, messages } from '../src/lib/messages'

/**
 * Админский флоу (критерий готовности этапа 4): создание типа события через
 * диалог, валидация формы, появление нового типа на странице записи,
 * сортировка предстоящих встреч.
 */
test.describe('админский флоу', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(TODAY)
    await page.goto('/admin')
  })

  test('валидация формы создания при пустом сабмите', async ({ page }) => {
    // Открываем диалог создания.
    await page.getByRole('button', { name: messages.admin.createDialog.trigger }).click()
    await page.getByRole('dialog').waitFor({ state: 'visible' })

    // Пустой сабмит → сообщения валидации для всех полей, запрос не уходит.
    await page.getByRole('button', { name: messages.common.create }).click()
    await expect(page.getByText(messages.validation.idRequired)).toBeVisible()
    await expect(page.getByText(messages.validation.nameRequired)).toBeVisible()
    await expect(page.getByText(messages.validation.descriptionRequired)).toBeVisible()
    await expect(page.getByText(messages.validation.durationRequired)).toBeVisible()

    // Диалог остаётся открытым (создание не прошло), закрываем через «Отмена».
    await page.getByRole('dialog').waitFor({ state: 'visible' })
    await page.getByRole('button', { name: messages.common.cancel }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Список типов событий не изменился — в админке по-прежнему фикстуры.
    await expect(page.getByRole('link', { name: /Консультация/ }).first()).toBeVisible()
  })

  test('создание типа события и появление его на странице записи', async ({ page }) => {
    const id = 'team-call-30'
    const name = 'Командный созвон'

    await page.getByRole('button', { name: messages.admin.createDialog.trigger }).click()
    await page.getByRole('dialog').waitFor({ state: 'visible' })

    await page.getByLabel(messages.admin.form.idLabel).fill(id)
    await page.getByLabel(messages.admin.form.nameLabel).fill(name)
    await page
      .getByLabel(messages.admin.form.descriptionLabel)
      .fill('Регулярный командный созвон по статусу.')
    await page.getByLabel(messages.admin.form.durationLabel).fill('30')

    await page.getByRole('button', { name: messages.common.create }).click()

    // Диалог закрылся, тост о создании показан, новый тип есть в списке админки.
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(
      page.getByText(format(messages.admin.createDialog.createdToast, { name })),
    ).toBeVisible()
    await expect(page.getByRole('link', { name })).toBeVisible()

    // На странице записи новый тип тоже доступен. Навигация SPA (нав-ссылка),
    // а не `page.goto`: перезагрузка страницы пересоздала бы MSW-состояние
    // и «потеряла» созданный тип. У кастомного типа нет фикстуры слотов,
    // поэтому проверяем только открытие страницы и заголовок типа.
    await page.getByRole('link', { name: messages.nav.book }).click()
    await page.getByRole('link', { name }).click()
    await expect(page).toHaveURL(/\/book\/team-call-30$/)
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
  })

  test('предстоящие встречи отсортированы от ближайшей', async ({ page }) => {
    // Вкладка «Предстоящие встречи» — встречи из фикстуры отсортированы по
    // времени начала: ближайшая (завтра, «Быстрый звонок») первой строкой.
    await page.getByRole('tab', { name: messages.admin.tabBookings }).click()
    const table = page.getByRole('table')
    await expect(table).toBeVisible()
    const firstDataRow = table.getByRole('row').nth(1)
    await expect(firstDataRow).toContainText('Быстрый звонок')
    await expect(firstDataRow).not.toContainText('Консультация')
  })
})
