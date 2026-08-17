import createClient from 'openapi-fetch'
import { apiBaseUrl, isApiConfigured } from './config'
import { NetworkError } from './errors'
import type { paths } from './schema'

/** Сколько ждать ответ сервера, прежде чем считать запрос потерянным. */
const REQUEST_TIMEOUT_MS = 15_000

/**
 * Обёртка над глобальным `fetch`: добавляет таймаут через
 * `AbortSignal.timeout` и объединяет его с сигналом отмены вызывающей
 * стороны (`react-query` прерывает запрос при размонтировании экрана).
 * Таймаут прокидывается в `errors.ts` и нормализуется в `NetworkError`.
 *
 * Fail-fast: без настроенной базы запрос пошёл бы на origin фронтенда, SPA
 * вернула бы `index.html`, и сбой выглядел бы как ошибка парсинга. Проверка
 * здесь (а не в `unwrap`) — потому что `apiClient.GET()` начинает запрос
 * раньше, чем `unwrap` получает его результат.
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!isApiConfigured) {
    throw new NetworkError(new Error('VITE_API_BASE_URL не задан'), { notConfigured: true })
  }

  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = init?.signal ? AbortSignal.any([init.signal, timeoutSignal]) : timeoutSignal
  return fetch(input, { ...init, signal })
}

/**
 * Плейсхолдер базы, когда API не настроен. openapi-fetch строит URL
 * строкой (`baseUrl + path`) и создаёт `new Request()` раньше, чем вызвал бы
 * наш `fetch`. С `undefined` базы строка вышла бы неотносительной и запрос
 * упал бы с `TypeError: Failed to parse URL` вне нашей обработки. Маскируем
 * реальный адрес плейсхолдером, чтобы запрос дошёл до `fetchWithTimeout` и там
 * был короткозамкнут в `NetworkError` с флагом `notConfigured` (см. ниже).
 */
const PLACEHOLDER_BASE_URL = 'http://api-not-configured.local'

/** Типобезопасный HTTP-клиент, сгенерированный из контракта OpenAPI
 * (`typespec/tsp-output/schema/openapi.yaml` → `src/api/schema.d.ts`).
 *
 * Базовый URL берётся из переменной окружения `VITE_API_BASE_URL` —
 * переключение между Prism-моком и реальным бэкендом происходит только
 * через `.env`, без изменения кода. Если переменная не задана, запросы
 * прерываются в `errors.ts` (см. `isApiConfigured`), а UI показывает баннер.
 */
export const apiClient = createClient<paths>({
  baseUrl: apiBaseUrl ?? PLACEHOLDER_BASE_URL,
  fetch: fetchWithTimeout,
})
