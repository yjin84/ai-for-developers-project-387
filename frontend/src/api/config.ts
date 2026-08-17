/**
 * Конфигурация API-слоя.
 *
 * `VITE_API_BASE_URL` — единственная точка подключения бэкенда. Если
 * переменная не задана (или пустая), запросы уходить на origin фронтенда
 * не должны: SPA вернула бы `index.html`, и сбой выглядел бы как ошибка
 * парсинга. Поэтому база становится `undefined`, запросы прерываются
 * коротким замыканием, а `RootLayout` показывает баннер-подсказку.
 */
// Семантика same-origin: `VITE_API_BASE_URL=/` (прод-деплой, один контейнер
// «SPA + API» на одном origin) после срезания слэшей даёт пустую строку —
// `apiBaseUrl === ""`, `isApiConfigured === true`. openapi-fetch собирает URL
// как `baseUrl + path`, поэтому запросы уходят относительными на тот же origin
// и баннер «API не настроен» не появляется.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

/** Базовый URL API без завершающего слэша, либо `undefined` — API не настроен. */
export const apiBaseUrl: string | undefined = rawBaseUrl
  ? rawBaseUrl.replace(/\/+$/, '')
  : undefined

/** Настроен ли API (`VITE_API_BASE_URL` задан и непустой). */
export const isApiConfigured = apiBaseUrl !== undefined
