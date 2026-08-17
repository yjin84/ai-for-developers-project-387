import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors'
import * as bookings from './bookings'
import { availableSlotsFor } from '@/test/fixtures'
import {
  capturedRequests,
  resetCapturedRequests,
  startMockServer,
  stopMockServer,
} from '@/test/server'
import { resetState } from '@/test/state'

describe('api/bookings', () => {
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

  it('GET /bookings — метод GET, сортировка по start делает список предсказуемым', async () => {
    const list = await bookings.listUpcoming()
    expect(list.length).toBeGreaterThan(0)
    expect(capturedRequests.at(-1)?.method).toBe('GET')
    expect(new URL(capturedRequests.at(-1)!.url).pathname).toBe('/bookings')
  })

  it('POST /bookings — шаблон пути, тело и ответ 201', async () => {
    const free = availableSlotsFor('consultation-30')
    const target = free.find((s) => s.start >= new Date().toISOString())
    expect(target).toBeDefined()
    const created = await bookings.create({
      eventTypeId: 'consultation-30',
      start: target!.start,
    })

    expect(created.id).toBeTruthy()
    expect(created.eventTypeId).toBe('consultation-30')
    expect(created.start).toBe(target!.start)
    expect(new Date(created.end).getTime()).toBeGreaterThan(new Date(created.start).getTime())

    const last = capturedRequests.at(-1)!
    expect(last.method).toBe('POST')
    expect(new URL(last.url).pathname).toBe('/bookings')
  })

  it('созданная бронь сразу видна в списке (консистентность состояния)', async () => {
    const target = availableSlotsFor('quick-call-15').find(
      (s) => s.start >= new Date().toISOString(),
    )!
    await bookings.create({ eventTypeId: 'quick-call-15', start: target.start })

    const list = await bookings.listUpcoming()
    expect(list.some((b) => b.start === target.start)).toBe(true)
  })

  it('409 — повторное бронирование слота бросает ApiError со kind slot_already_booked', async () => {
    const free = availableSlotsFor('consultation-30')
    const target = free.find((s) => s.start >= new Date().toISOString())!
    await bookings.create({ eventTypeId: 'consultation-30', start: target.start })

    const error = (await bookings
      .create({ eventTypeId: 'consultation-30', start: target.start })
      .catch((e) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(409)
    expect(error.kind).toBe('slot_already_booked')
  })

  it('400. слот вне окна записи даёт kind slot_not_available', async () => {
    const outOfWindow = '2024-01-01T09:00:00.000Z'
    const error = (await bookings
      .create({ eventTypeId: 'consultation-30', start: outOfWindow })
      .catch((e) => e)) as ApiError

    expect(error.status).toBe(400)
    expect(error.kind).toBe('slot_not_available')
  })
})
