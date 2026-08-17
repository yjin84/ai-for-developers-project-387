import { expect, test } from '@playwright/test'
import { occupySlot, slotStartToday, TODAY } from './helpers'
import { messages } from '../src/lib/messages'

/**
 * Гостевой happy path (критерий готовности этапа 3) + конфликт 409
 * (обработка `slot_already_booked`).
 *
 * Работаем с моком через MSW: день по умолчанию — «сегодня» (первый день
 * со слотами), времена слотов берём из фикстуры, строки — из `messages`.
 */
test.describe('гостевой флоу', () => {
  test.beforeEach(async ({ page }) => {
    // Каждый тест — свежая страница: `startMockWorker` уже сидит состояние
    // (типы событий и слоты), отдельный сброс не нужен.
    await page.clock.setFixedTime(TODAY)
    await page.goto('/')
  })

  test('выбор типа события → слот → подтверждение', async ({ page }) => {
    // Лендинг → список типов событий (CTA и nav-ссылка имеют одинаковый текст,
    // обе ведут на /book — берём первую).
    await page.getByRole('link', { name: messages.landing.cta }).first().click()
    await expect(page).toHaveURL(/\/book$/)

    // Открываем «Консультацию».
    await page.getByRole('link', { name: /Консультация/ }).click()
    await expect(page).toHaveURL(/\/book\/consultation-30$/)

    // «Сегодня» выбрано по умолчанию → три слота (09:00, 10:00, 11:00).
    await expect(page.getByRole('radio', { name: /09:00/ })).toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(3)

    // Сводка показывается в радиогруппе после выбора слота.
    const confirm = page.getByRole('button', { name: messages.common.confirm })
    await expect(confirm).toBeDisabled()
    await page.getByRole('radio', { name: /09:00/ }).click()
    await expect(confirm).toBeEnabled()

    // Подтверждаем → экран подтверждения.
    await confirm.click()
    await expect(page.getByRole('link', { name: messages.booking.confirmedAgain })).toBeVisible()
    await expect(page.getByText(messages.booking.confirmedTitle).first()).toBeVisible()

    // «Записаться ещё раз» возвращает на список типов событий.
    // (Занятость слота проверяется отдельно в тесте на 409 — там на
    // инвалидации кэша слот пропадает из списка. Перезагрузка страницы
    // сбросила бы состояние MSW, поэтому не используем её для проверки.)
    await page.getByRole('link', { name: messages.booking.confirmedAgain }).click()
    await expect(page).toHaveURL(/\/book$/)
    await expect(page.getByRole('link', { name: /Консультация/ }).first()).toBeVisible()
  })

  test('конфликт 409: слот занят другим гостем — сообщение и сброс выбора', async ({ page }) => {
    await page.getByRole('link', { name: messages.landing.cta }).first().click()
    await page.getByRole('link', { name: /Консультация/ }).click()
    await expect(page).toHaveURL(/\/book\/consultation-30$/)

    // «За спиной» пользователя тот же слот занимает другой гость.
    const occupied = await slotStartToday(page, 'consultation-30', 9)
    await occupySlot(page, occupied)

    await page.getByRole('radio', { name: /09:00/ }).click()
    await page.getByRole('button', { name: messages.common.confirm }).click()

    // Сообщение об ошибке (серверный message), выбор сброшен, кнопка снова
    // заблокирована, и слот исчез из списка (инвалидация кэша).
    await expect(page.getByText(messages.errors.slotAlreadyBookedTitle)).toBeVisible()
    await expect(page.getByRole('button', { name: messages.common.confirm })).toBeDisabled()
    await expect(page.getByRole('radio', { name: /09:00/ })).not.toBeVisible()
    await expect(page.getByRole('radio')).toHaveCount(2)
  })
})
