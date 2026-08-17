import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors'
import * as slots from './slots'
import * as bookings from './bookings'
import { availableSlotsFor } from '@/test/fixtures'
import {
  capturedRequests,
  resetCapturedRequests,
  startMockServer,
  stopMockServer,
} from '@/test/server'
import { resetState } from '@/test/state'

describe('api/slots', () => {
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

  it('GET /event-types/{eventTypeId}/slots — метод GET и корректный путь', async () => {
    const result = await slots.list('consultation-30')
    expect(result).toEqual(availableSlotsFor('consultation-30'))
    const last = capturedRequests.at(-1)!
    expect(last.method).toBe('GET')
    expect(new URL(last.url).pathname).toBe('/event-types/consultation-30/slots')
  })

  it('бросает ApiError 404, когда тип события не существует', async () => {
    const error = (await slots.list('no-such-type').catch((e) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.kind).toBe('unknown')
  })

  it('занятый слот пропадает из каталога после бронирования', async () => {
    const free = await slots.list('consultation-30')
    const target = availableSlotsFor('consultation-30').find(
      (s) => s.start >= new Date().toISOString(),
    )
    expect(target).toBeDefined()

    const created = await bookings.create({ eventTypeId: 'consultation-30', start: target!.start })
    expect(created.start).toBe(target!.start)

    const after = await slots.list('consultation-30')
    expect(after).not.toContainEqual(target)
    expect(after.length).toBe(free.length - 1)
  })
})
