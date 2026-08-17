import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError, unwrap } from './errors'

/** Подставной ответ, экономящий реальную сеть. */
function result<T>(overrides: { data?: T; error?: unknown; status: number }) {
  const response = new Response(JSON.stringify(overrides.error ?? null), {
    status: overrides.status,
  })
  return {
    data: overrides.data,
    error: overrides.error as never,
    response,
  }
}

describe('unwrap', () => {
  it('возвращает данные при успешном ответе', async () => {
    await expect(
      unwrap(Promise.resolve(result({ data: { id: 1 }, status: 200 }))),
    ).resolves.toEqual({ id: 1 })
  })

  it('бросает ApiError с полем code и распознанным kind', async () => {
    const error = (await unwrap(
      Promise.resolve(
        result({
          error: { code: 'slot_already_booked', message: 'Слот занят' },
          status: 409,
        }),
      ),
    ).catch((e) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.code).toBe('slot_already_booked')
    expect(error.kind).toBe('slot_already_booked')
    expect(error.message).toBe('Слот занят')
  })

  it('бросает ApiError с дефолтным сообщением, когда ok=false и тела нет', async () => {
    const error = (await unwrap(
      Promise.resolve(result({ data: undefined, error: undefined, status: 500 })),
    ).catch((e) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(500)
    expect(error.message).toContain('500')
  })

  it('бросает NetworkError при отклонённом промисе с сохранением cause', async () => {
    const cause = new TypeError('Failed to fetch')
    const error = (await unwrap(Promise.reject(cause)).catch((e) => e)) as NetworkError

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.cause).toBe(cause)
  })

  it('не оборачивает повторно уже брошенный NetworkError', async () => {
    const networkError = new NetworkError(new Error('не настроено'), { notConfigured: true })
    const error = (await unwrap(Promise.reject(networkError)).catch((e) => e)) as NetworkError

    expect(error).toBe(networkError)
    expect(error.notConfigured).toBe(true)
  })

  it('нормализует прерывание по таймауту в NetworkError с флагом timeout', async () => {
    const timeoutCause = new Error('The operation was aborted due to timeout')
    timeoutCause.name = 'TimeoutError'
    const error = (await unwrap(Promise.reject(timeoutCause)).catch((e) => e)) as NetworkError

    expect(error).toBeInstanceOf(NetworkError)
    expect(error.timeout).toBe(true)
  })
})
