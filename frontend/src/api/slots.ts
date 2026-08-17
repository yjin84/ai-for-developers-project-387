import { apiClient } from './client'
import { unwrap } from './errors'
import type { components } from './schema'

export type AvailableSlot = components['schemas']['AvailableSlot']

/**
 * Список свободных слотов типа события на ближайшие 14 дней
 * (`GET /event-types/{eventTypeId}/slots`).
 */
export function list(eventTypeId: string): Promise<AvailableSlot[]> {
  return unwrap(
    apiClient.GET('/event-types/{eventTypeId}/slots', {
      params: { path: { eventTypeId } },
    }),
  )
}
