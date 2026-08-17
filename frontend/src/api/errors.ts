import type { components } from './schema'

/** Любая из схем ошибок контракта: `Error`, `SlotAlreadyBookedError`, `SlotNotAvailableError`. */
export type ErrorBody =
  | components['schemas']['Error']
  | components['schemas']['SlotAlreadyBookedError']
  | components['schemas']['SlotNotAvailableError']

/** Разновидность ошибки API, распознанная по полю `code` в теле ответа. */
export type ApiErrorKind = 'slot_already_booked' | 'slot_not_available' | 'unknown'

/**
 * Нормализованная ошибка API — единая обёртка поверх разных схем ошибок
 * контракта, чтобы UI мог обрабатывать их одним способом (`err.kind`),
 * не зная деталей конкретного эндпоинта.
 */
export class ApiError extends Error {
  /** HTTP-статус ответа. */
  readonly status: number
  /** Сырое значение поля `code` из тела ответа (число или строковый enum). */
  readonly code: string | number
  /** Распознанная разновидность ошибки для ветвления в UI. */
  readonly kind: ApiErrorKind

  constructor(status: number, body: ErrorBody | undefined) {
    super(body?.message ?? `Запрос завершился с ошибкой (HTTP ${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = body?.code ?? status
    this.kind = toApiErrorKind(body?.code)
  }
}

function toApiErrorKind(code: string | number | undefined): ApiErrorKind {
  if (code === 'slot_already_booked') return 'slot_already_booked'
  if (code === 'slot_not_available') return 'slot_not_available'
  return 'unknown'
}

/** Ошибка сети/недоступности сервера (запрос не дошёл до бэкенда). */
export class NetworkError extends Error {
  /** Таймаут ответа сервера (отдельный текст от «нет соединения»). */
  readonly timeout: boolean
  /** API не настроен (`VITE_API_BASE_URL` не задан) — UI показывает баннер. */
  readonly notConfigured: boolean

  constructor(cause: unknown, options: { timeout?: boolean; notConfigured?: boolean } = {}) {
    super('Не удалось подключиться к серверу. Проверьте соединение и попробуйте снова.')
    this.name = 'NetworkError'
    this.cause = cause
    this.timeout = options.timeout ?? isTimeoutError(cause)
    this.notConfigured = options.notConfigured ?? false
  }
}

/**
 * Определяет, что запрос прерван по таймауту `AbortSignal.timeout`
 * (а не отменён вызывающей стороной — при размонтировании экрана).
 */
function isTimeoutError(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'TimeoutError'
}

type ApiResult<T, E extends ErrorBody = ErrorBody> = {
  data?: T
  error?: E
  response: Response
}

/**
 * Разворачивает результат вызова `openapi-fetch` в данные ответа либо
 * бросает нормализованную ошибку (`ApiError` для ответов с ошибкой,
 * `NetworkError` при сбое самого запроса).
 */
export async function unwrap<T, E extends ErrorBody = ErrorBody>(
  promise: Promise<ApiResult<T, E>>,
): Promise<T> {
  let result: ApiResult<T, E>
  try {
    result = await promise
  } catch (cause) {
    // Fetch-враппер может уже бросить NetworkError (fail-fast без настроенной
    // базы) — не оборачиваем его повторно, чтобы сохранить флаги.
    if (cause instanceof NetworkError) throw cause
    throw new NetworkError(cause)
  }

  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(result.response.status, result.error)
  }

  return result.data as T
}
