/**
 * API-слой фронтенда: типобезопасные методы 1-в-1 к интерфейсам TypeSpec
 * (`EventTypes`, `Slots`, `Bookings`), сгенерированные типы контракта и
 * нормализованная обработка ошибок.
 */
export * as eventTypes from './eventTypes'
export * as slots from './slots'
export * as bookings from './bookings'
export { apiBaseUrl, isApiConfigured } from './config'
export { apiClient } from './client'
export { ApiError, NetworkError, type ApiErrorKind } from './errors'
export { queryClient } from './queryClient'
export { queryKeys } from './queryKeys'
