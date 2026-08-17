import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { dayLabel } from './helpers'
import { messages } from '../src/lib/messages'

/**
 * Интеграционные E2E против реального бэкенда (Spring Boot на 4010,
 * прогон `playwright.integration.config.ts`). Бэкенд стартует пустым
 * (H2 in-memory), тип события создаётся через API в `beforeAll`.
 *
 * Время слотов нельзя вычислять в Node-процессе теста — таймзона машины
 * может отличаться от принудительной `Europe/Moscow` в браузере. Поэтому
 * слоты и ключи дней берём из API внутри страницы (`page.evaluate`), как
 * `slotStartToday` в `helpers.ts`.
 */
const API_BASE = 'http://127.0.0.1:4010'
const EVENT_TYPE_NAME = 'Интеграционный тест'

async function createEventType(request: APIRequestContext, id: string): Promise<void> {
  const res = await request.post(`${API_BASE}/event-types`, {
    data: {
      id,
      name: EVENT_TYPE_NAME,
      description: 'Тип события, созданный интеграционным E2E-тестом.',
      durationMinutes: 30,
    },
  })
  expect(res.status()).toBe(201)
}

async function getSlots(
  request: APIRequestContext,
  id: string,
): Promise<Array<{ start: string; end: string }>> {
  const res = await request.get(`${API_BASE}/event-types/${id}/slots`)
  expect(res.status()).toBe(200)
  return res.json()
}

async function createBooking(
  request: APIRequestContext,
  eventTypeId: string,
  start: string,
): Promise<void> {
  const res = await request.post(`${API_BASE}/bookings`, {
    data: { eventTypeId, start },
  })
  expect(res.status()).toBe(201)
}

async function getBookings(
  request: APIRequestContext,
): Promise<Array<{ eventType: { id: string }; start: string }>> {
  const res = await request.get(`${API_BASE}/bookings`)
  expect(res.status()).toBe(200)
  return res.json()
}

/**
 * Свободные слоты типа события, сгруппированные по локальному дню браузера
 * (код тот же, что в `groupSlotsByDay`). Возвращает первый (ближайший) день
 * и его первый по времени слот — в браузере, чтобы не зависеть от таймзоны
 * Node-процесса.
 */
async function firstDayInfo(
  page: Page,
  eventTypeId: string,
): Promise<{ firstDayKey: string; firstStart: string }> {
  return page.evaluate(
    async (args: {
      base: string
      id: string
    }): Promise<{ firstDayKey: string; firstStart: string }> => {
      const res = await fetch(`${args.base}/event-types/${args.id}/slots`)
      const slots = (await res.json()) as Array<{ start: string }>
      const dayKey = (iso: string): string => {
        const d = new Date(iso)
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${d.getFullYear()}-${mm}-${dd}`
      }
      const byDay = new Map<string, string[]>()
      for (const slot of slots) {
        const key = dayKey(slot.start)
        const list = byDay.get(key)
        if (list) list.push(slot.start)
        else byDay.set(key, [slot.start])
      }
      for (const list of byDay.values()) list.sort((a, b) => a.localeCompare(b))
      const firstDayKey = [...byDay.keys()].sort()[0]!
      const firstStart = byDay.get(firstDayKey)![0]!
      return { firstDayKey, firstStart }
    },
    { base: API_BASE, id: eventTypeId },
  )
}

test.describe('интеграция против реального бэкенда', () => {
  test.describe.configure({ mode: 'serial' })

  let createdId = ''

  test.beforeAll(async ({ request }) => {
    createdId = `e2e-${Date.now()}`
    await createEventType(request, createdId)
    // Слоты реально считаются — иначе дальше нечего выбирать.
    const slots = await getSlots(request, createdId)
    expect(slots.length).toBeGreaterThan(0)
  })

  test('гостевой флоу: выбор слота, подтверждение и бронь в API', async ({ page, request }) => {
    // Лендинг → список типов событий → карточка созданного типа.
    await page.goto('/')
    await page.getByRole('link', { name: messages.landing.cta }).first().click()
    await expect(page).toHaveURL(/\/book$/)
    await page.getByRole('link', { name: new RegExp(EVENT_TYPE_NAME) }).click()
    await expect(page).toHaveURL(new RegExp(`/book/${createdId}$`))

    // Первый (ближайший) день и его первый слот — из API внутри браузера.
    const { firstDayKey, firstStart } = await firstDayInfo(page, createdId)

    // Клик по кнопке дня идемпотентен: авто-выбор «первый день» уже мог
    // сработать — мягкая проверка, что день остался выбранным.
    const dayButton = page.getByRole('button', {
      name: dayLabel(new Date(`${firstDayKey}T00:00:00`)),
    })
    await dayButton.click()
    await expect.soft(dayButton).toHaveAttribute('data-selected-single', 'true')

    // Первый радио выбранного дня — тот же слот, что `firstStart`
    // (время внутри дня отсортировано). Подтверждаем бронь.
    await page.getByRole('radio').first().click()
    const confirm = page.getByRole('button', { name: messages.common.confirm })
    await expect(confirm).toBeEnabled()
    await confirm.click()

    // Экран подтверждения.
    await expect(page.getByRole('link', { name: messages.booking.confirmedAgain })).toBeVisible()
    await expect(page.getByText(messages.booking.confirmedTitle).first()).toBeVisible()

    // Бронь реально появилась в API с тем же стартом.
    const bookings = await getBookings(request)
    const mine = bookings.find((b) => b.eventType.id === createdId && b.start === firstStart)
    expect(mine).toBeTruthy()
  })

  test('409: слот занят другим гостем — сообщение и сброс выбора', async ({ page, request }) => {
    // Лендинг → список типов событий → карточка. Страница загружает слоты
    // ДО того, как API займёт один из них.
    await page.goto('/')
    await page.getByRole('link', { name: messages.landing.cta }).first().click()
    await page.getByRole('link', { name: new RegExp(EVENT_TYPE_NAME) }).click()
    await expect(page).toHaveURL(new RegExp(`/book/${createdId}$`))

    const { firstDayKey, firstStart } = await firstDayInfo(page, createdId)
    const dayButton = page.getByRole('button', {
      name: dayLabel(new Date(`${firstDayKey}T00:00:00`)),
    })
    await dayButton.click()

    // Дожидаемся радио (список слотов реально отрисован) и только потом
    // «другой гость» занимает первый слот выбранного дня через API.
    const radios = page.getByRole('radio')
    await expect(radios.first()).toBeVisible()
    const countBefore = await radios.count()
    const occupiedName = (await radios.first().getAttribute('aria-label')) ?? ''
    await createBooking(request, createdId, firstStart)

    // UI ещё показывает занятый слот из кэша — выбираем и подтверждаем.
    await radios.first().click()
    const confirm = page.getByRole('button', { name: messages.common.confirm })
    await expect(confirm).toBeEnabled()
    await confirm.click()

    // Серверный message «Слот уже занят» в aria-live, выбор сброшен, кнопка
    // снова заблокирована, занятый слот исчез после инвалидации кэша.
    await expect(page.getByText(messages.errors.slotAlreadyBookedTitle)).toBeVisible()
    await expect(confirm).toBeDisabled()
    await expect(page.getByRole('radio', { name: occupiedName })).toHaveCount(0)
    await expect(radios).toHaveCount(countBefore - 1)
  })
})
