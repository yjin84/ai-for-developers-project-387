import { apiClient } from './client'
import { unwrap } from './errors'
import type { components } from './schema'

export type Booking = components['schemas']['Booking']
export type BookingCreate = components['schemas']['BookingCreate']
export type BookingWithEventType = components['schemas']['BookingWithEventType']

/** Список предстоящих встреч владельца календаря (`GET /bookings`). */
export function listUpcoming(): Promise<BookingWithEventType[]> {
  return unwrap(apiClient.GET('/bookings'))
}

/**
 * Создать бронирование на выбранный слот (`POST /bookings`).
 *
 * При ошибке бросает `ApiError` с `kind`:
 * - `'slot_not_available'` — слот вне окна записи или не существует (400)
 * - `'slot_already_booked'` — слот уже занят другим бронированием (409)
 */
export function create(body: BookingCreate): Promise<Booking> {
  return unwrap(apiClient.POST('/bookings', { body }))
}
