import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from './base'
import { createBooking, freeSlotsFor, state } from './state'

/**
 * MSW-хендлеры всех пяти операций контракта.
 *
 * Зарегистрированы на абсолютный URL из `VITE_API_BASE_URL` (см. `base.ts`) —
 * в конфиге Vitest он задаётся явно, в E2E — через `.env.test`.
 * `onUnhandledRequest: 'error'` (сервер/воркер) валит тест на незамоканный
 * запрос, а не отпускает его в реальную сеть.
 */
export const handlers = [
  http.get(`${API_BASE_URL}/event-types`, () => {
    if (state.networkDown) return HttpResponse.error()
    return HttpResponse.json(state.eventTypes)
  }),

  http.get(`${API_BASE_URL}/event-types/:id`, ({ params }) => {
    if (state.networkDown) return HttpResponse.error()
    const eventType = state.eventTypes.find((e) => e.id === params.id)
    if (!eventType) {
      return HttpResponse.json({ code: 404, message: 'Тип события не найден' }, { status: 404 })
    }
    return HttpResponse.json(eventType)
  }),

  http.post(`${API_BASE_URL}/event-types`, async ({ request }) => {
    if (state.networkDown) return HttpResponse.error()
    const body = (await request.json()) as {
      id: string
      name: string
      description: string
      durationMinutes: number
    }
    if (state.eventTypes.some((e) => e.id === body.id)) {
      return HttpResponse.json(
        { code: 409, message: 'Тип события с таким идентификатором уже существует' },
        { status: 409 },
      )
    }
    const created = { ...body }
    state.eventTypes.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.get(`${API_BASE_URL}/event-types/:eventTypeId/slots`, ({ params }) => {
    if (state.networkDown) return HttpResponse.error()
    const eventTypeId = params.eventTypeId as string
    if (!state.eventTypes.some((e) => e.id === eventTypeId)) {
      return HttpResponse.json({ code: 404, message: 'Тип события не найден' }, { status: 404 })
    }
    return HttpResponse.json(freeSlotsFor(eventTypeId))
  }),

  http.get(`${API_BASE_URL}/bookings`, () => {
    if (state.networkDown) return HttpResponse.error()
    return HttpResponse.json(state.bookings)
  }),

  http.post(`${API_BASE_URL}/bookings`, async ({ request }) => {
    if (state.networkDown) return HttpResponse.error()
    const body = (await request.json()) as { eventTypeId: string; start: string }
    const result = createBooking(body)
    if (!result.ok) {
      return HttpResponse.json(result.body, { status: result.status })
    }
    return HttpResponse.json(result.booking, { status: 201 })
  }),
]
