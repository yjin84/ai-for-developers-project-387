import { setupWorker } from 'msw/browser'
import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from './base'
import { handlers } from './handlers'
import { resetState, state } from './state'

/**
 * MSW-воркер для Playwright E2E (service worker в браузере).
 *
 * Тянет те же handlers, что и Node-сервер Vitest (`server.ts`), поэтому набор
 * сценариев один, а окружение разное. Запускается до первого рендера — см.
 * условный импорт в `src/main.tsx` при `VITE_ENABLE_MSW === 'true'`.
 *
 * Плюс тестовые эндпоинты `__test/*` — способ детерминированно управлять
 * состоянием мока из сценария (сброс, занятие слота «за спиной» пользователя,
 * падение сети), без них 409/ошибку сети в E2E не воспроизвести.
 *
 * Эндпоинты регистрируются на `API_BASE_URL` (кросс-ориджин `http://api.test`),
 * а не на `location.origin`: MSW-воркер надёжно перехватывает кросс-ориджин
 * запросы, а same-origin `/__test/*` не попадал в SW и уходил в vite-preview
 * (404). Поэтому из сценариев ходим по absolute URL.
 */
export const worker = setupWorker(
  ...handlers,

  // Сброс состояния мока — в `beforeEach` каждого сценария.
  http.post(`${API_BASE_URL}/__test/reset`, () => {
    resetState()
    return HttpResponse.json({ ok: true })
  }),

  // Занять слот «за спиной» пользователя (другой гость бронирует то же время)
  // — после этого `POST <API>/bookings` отдаёт 409 `slot_already_booked`.
  http.post(`${API_BASE_URL}/__test/book`, async ({ request }) => {
    const body = (await request.json()) as { start: string }
    state.bookedStarts.add(body.start)
    return HttpResponse.json({ ok: true })
  }),

  // Включить/выключить имитацию сетевого сбоя (см. `state.networkDown`).
  http.post(`${API_BASE_URL}/__test/network`, async ({ request }) => {
    const body = (await request.json()) as { down: boolean }
    state.networkDown = body.down
    return HttpResponse.json({ ok: true })
  }),

  // Маркер готовности воркера и текущее состояние сети: сценарий крутит GET
  // до `ok`, прежде чем управлять состоянием мока, и подтверждает, что флаг
  // реально применён. Без этого первый `POST /__test/network` сразу после
  // `goto` может уйти в сеть (воркер ещё встаёт) и флаг не выставится.
  http.get(`${API_BASE_URL}/__test/state`, () => {
    return HttpResponse.json({ ok: true, networkDown: state.networkDown })
  }),
)

/** Стартует воркер и дожидается готовности, прежде чем рендерить приложение. */
export async function startMockWorker(): Promise<void> {
  resetState()
  await worker.start({ onUnhandledRequest: 'error' })
}
