import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** Node-сервер MSW для Vitest (проект `unit`). */
export const mockServer = setupServer(...handlers)

/** Последние перехваченные запросы — для проверки метода и пути в API-тестах. */
export const capturedRequests: Request[] = []

mockServer.events.on('request:start', ({ request }) => {
  capturedRequests.push(request)
})

/** Очищает лог перехваченных запросов — вызывается в `beforeEach`. */
export function resetCapturedRequests(): void {
  capturedRequests.length = 0
}

/**
 * Включает перехват с жёстким `onUnhandledRequest: 'error'` — незамоканный
 * запрос валит тест, а не уходит в реальную сеть.
 */
export function startMockServer(): void {
  mockServer.listen({ onUnhandledRequest: 'error' })
}

export function stopMockServer(): void {
  mockServer.close()
}
