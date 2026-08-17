import { apiClient } from './client'
import { unwrap } from './errors'
import type { components } from './schema'

export type EventType = components['schemas']['EventType']
export type EventTypeCreate = components['schemas']['EventTypeCreate']

/** Список типов событий (`GET /event-types`). */
export function list(): Promise<EventType[]> {
  return unwrap(apiClient.GET('/event-types'))
}

/** Один тип события по идентификатору (`GET /event-types/{id}`). */
export function get(id: string): Promise<EventType> {
  return unwrap(apiClient.GET('/event-types/{id}', { params: { path: { id } } }))
}

/** Создать тип события (`POST /event-types`). */
export function create(body: EventTypeCreate): Promise<EventType> {
  return unwrap(apiClient.POST('/event-types', { body }))
}
