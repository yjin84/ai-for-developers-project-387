import { type Page } from '@playwright/test'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

/**
 * Фиксированное «сегодня» для E2E — тот же момент, от которого MSW-фикстуры
 * считают дни (`src/test/fixtures.ts`), фиксируется через `page.clock`.
 *
 * Задаём в UTC, а не через локальный конструктор `new Date(y,m,d)`: машина,
 * где крутится тест, может жить в любом часовом поясе (например +07), и
 * «сегодня» в браузере (Europe/Moscow) может уехать на день назад. Слоты
 * фикстур (09:00–11:00 «сегодня») должны быть в будущем относительно
 * зафиксированного времени, иначе бронь падает как `slot_not_available`.
 */
export const TODAY = new Date('2026-08-05T00:00:00Z') // 5 августа 2026, 03:00 МСК

/**
 * aria-label кнопки дня в react-day-picker — полная дата (`PPPP`, локаль ru):
 * «среда, 5 августа 2026 г.». Слоты и дни ищем по этим именам, а не по
 * номеру ячейки — тест не ломается при смене месяца/дня недели.
 */
export const dayLabel = (date: Date) => format(date, 'PPPP', { locale: ru })

/**
 * Абсолютный адрес мок-API для тестовых эндпоинтов. MSW-воркер надёжно
 * перехватывает кросс-ориджин запросы на `API_BASE_URL` (`http://api.test`).
 * Держим здесь же отдельно, чтобы helpers не зависел от структуры приложения.
 */
export const TEST_API = 'http://api.test'

/** Сброс состояния мока (используется в редких случаях; обычно не нужен). */
export async function resetMock(page: Page): Promise<void> {
  await waitForMockReady(page)
  await page.evaluate((base) => fetch(`${base}/__test/reset`, { method: 'POST' }), TEST_API)
}

/** «Занять» слот за спиной пользователя (даёт 409 при повторной брони). */
export async function occupySlot(page: Page, start: string): Promise<void> {
  await waitForMockReady(page)
  await page.evaluate(
    (args) =>
      fetch(`${args.base}/__test/book`, {
        method: 'POST',
        body: JSON.stringify({ start: args.start }),
      }),
    { base: TEST_API, start },
  )
}

/**
 * Дождаться, пока MSW-воркер реально начнёт перехватывать запросы
 * (`GET /__test/state` отвечает). Сразу после `goto` воркер может ещё не
 * встать, и первый управляющий запрос уйдёт в реальную сеть.
 */
export async function waitForMockReady(page: Page): Promise<void> {
  await page.waitForFunction(async (base) => {
    try {
      const res = await fetch(`${base}/__test/state`)
      return res.ok
    } catch {
      return false
    }
  }, TEST_API)
}

/**
 * Включить/выключить имитацию сетевого сбоя в MSW.
 *
 * Сначала дожидаемся готовности воркера, потом переключаем флаг и
 * подтверждаем чтением `/__test/state`, что он реально применён. Без ожидания
 * первый `POST /__test/network` сразу после `goto` может уйти в сеть или
 * поймать 503 (воркер ещё встаёт), флаг не выставится, и приложение продолжит
 * получать данные (это и был баг `network.spec`).
 */
export async function setNetworkDown(page: Page, down: boolean): Promise<void> {
  await waitForMockReady(page)
  await page.waitForFunction(
    async (args) => {
      try {
        const res = await fetch(`${args.base}/__test/network`, {
          method: 'POST',
          body: JSON.stringify({ down: args.down }),
        })
        if (!res.ok) return false
        const state = (await fetch(`${args.base}/__test/state`).then((r) => r.json())) as {
          networkDown: boolean
        }
        return state.networkDown === args.down
      } catch {
        return false
      }
    },
    { base: TEST_API, down },
  )
}

/**
 * ISO-старт слота «сегодня, в указанный час» — берём его прямо из мока
 * внутри страницы, чтобы не зависеть от часового пояса, в котором запущен
 * Node-процесс теста (в браузере время фиксировано `page.clock` и TZ Moscow).
 */
export async function slotStartToday(
  page: Page,
  eventTypeId: string,
  hour: number,
): Promise<string> {
  const start = await page.evaluate(
    async ({ base, id, h }) => {
      const res = await fetch(`${base}/event-types/${id}/slots`)
      const slots = (await res.json()) as Array<{ start: string }>
      const now = new Date()
      const slot = slots.find((s) => {
        const d = new Date(s.start)
        return (
          d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getHours() === h
        )
      })
      return slot?.start
    },
    { base: TEST_API, id: eventTypeId, h: hour },
  )
  if (!start) throw new Error(`Нет слота на сегодня в ${hour}:00 для ${eventTypeId}`)
  return start
}
