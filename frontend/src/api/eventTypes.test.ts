import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors'
import * as eventTypes from './eventTypes'
import { eventTypes as fixtures } from '@/test/fixtures'
import {
  capturedRequests,
  resetCapturedRequests,
  startMockServer,
  stopMockServer,
} from '@/test/server'
import { resetState } from '@/test/state'

describe('api/eventTypes', () => {
  beforeAll(() => {
    vi.setSystemTime(new Date(2026, 7, 5, 0, 0, 0))
    startMockServer()
  })

  afterAll(() => {
    stopMockServer()
    vi.useRealTimers()
  })

  beforeEach(() => {
    resetState()
    resetCapturedRequests()
  })

  it('GET /event-types — метод GET, список из состояния', async () => {
    const list = await eventTypes.list()
    expect(list).toEqual(fixtures)
    expect(capturedRequests.at(-1)?.method).toBe('GET')
    expect(new URL(capturedRequests.at(-1)!.url).pathname).toBe('/event-types')
  })

  it('GET /event-types/{id} — подставляет id в путь', async () => {
    const found = await eventTypes.get('consultation-30')
    expect(found.id).toBe('consultation-30')
    expect(new URL(capturedRequests.at(-1)!.url).pathname).toBe('/event-types/consultation-30')
  })

  it('GET /event-types/{id} — 404 бросает ApiError с kind unknown', async () => {
    const error = (await eventTypes.get('no-such-type').catch((e) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.kind).toBe('unknown')
  })

  it('POST /event-types — тело разобрано: созданный тип сразу в списке', async () => {
    const body = {
      id: 'brand-new-60',
      name: 'Новый тип',
      description: 'Описан в тесте.',
      durationMinutes: 60,
    }
    const created = await eventTypes.create(body)
    expect(created.id).toBe(body.id)
    expect(capturedRequests.at(-1)?.method).toBe('POST')
    expect(capturedRequests.at(-1)?.url).toContain('/event-types')

    const list = await eventTypes.list()
    expect(list.some((e) => e.id === 'brand-new-60')).toBe(true)
  })

  it('POST /event-types — дубликат id бросает ApiError 409', async () => {
    const body = {
      id: 'consultation-30',
      name: 'Дубль',
      description: 'Дубль.',
      durationMinutes: 30,
    }
    const error = (await eventTypes.create(body).catch((e) => e)) as ApiError
    expect(error.status).toBe(409)
  })
})
