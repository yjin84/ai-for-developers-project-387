import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import Ajv from 'ajv'
import type { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { load } from 'js-yaml'
import * as bookings from '@/api/bookings'
import * as eventTypesApi from '@/api/eventTypes'
import * as slotsApi from '@/api/slots'
import type { AvailableSlot } from '@/api/slots'
import { bookingAtTodayNine, eventTypes } from './fixtures'
import { startMockServer, stopMockServer } from './server'
import { resetState } from './state'

/**
 * Контрактная проверка ответов хендлеров по реальному `openapi.yaml`
 * (источник истины). Именно это не даёт моку разойтись с контрактом и
 * оправдывает отказ от Prism в тестах: Prism отдаёт один статичный пример
 * на маршрут и не хранит состояние, а здесь проверяется живо отвечающий
 * сервер по схеме.
 *
 * `typespec/tsp-output/` в `.gitignore`, поэтому при отсутствии файла тесты
 * пропускаются со внятным сообщением (в CI контракт генерируется явным
 * шагом до тестов).
 */
const OPENAPI_PATH = path.resolve(process.cwd(), '../typespec/tsp-output/schema/openapi.yaml')

const doc: Record<string, unknown> | null = fs.existsSync(OPENAPI_PATH)
  ? (load(fs.readFileSync(OPENAPI_PATH, 'utf8')) as Record<string, unknown>)
  : null

if (!doc) {
  console.warn(
    'openapi.yaml не найден — попасть на тесты контракта можно только после генерации контракта.',
  )
}

const describeContract = doc ? describe : describe.skip

describeContract('контракт мока (openapi.yaml)', () => {
  const firstEventType = eventTypes[0] as (typeof eventTypes)[number]

  function assertMatches<T>(data: T, schemaName: string): void {
    const ajv = new Ajv({ allErrors: true, strict: false })
    addFormats(ajv)
    ajv.addSchema(doc as object, 'oas')
    const validate = ajv.compile({
      $ref: `oas#/components/schemas/${schemaName}`,
    }) as ValidateFunction<T>
    const valid = validate(data)
    if (!valid) {
      throw new Error(
        `Данные не соответствуют схеме ${schemaName} контракта: ${JSON.stringify(validate.errors)}`,
      )
    }
    expect(valid).toBe(true)
  }

  beforeAll(() => {
    // Фиксируем «сегодня» (утро), иначе слот «сегодня, 09:00» станет прошлым
    // при прогоне после 09:00 и бронирование уйдёт в 400 (вне окна записи).
    vi.setSystemTime(new Date(2026, 7, 5, 0, 0, 0))
    startMockServer()
  })

  afterAll(() => {
    stopMockServer()
    vi.useRealTimers()
  })

  beforeEach(() => {
    resetState()
  })

  it('GET /event-types — список соответствует схеме EventType', async () => {
    const list = await eventTypesApi.list()
    expect(list).toHaveLength(eventTypes.length)
    for (const eventType of list) {
      assertMatches(eventType, 'EventType')
    }
  })

  it('GET /event-types/{id} — существующий и несуществующий', async () => {
    const found = await eventTypesApi.get(firstEventType.id)
    assertMatches(found, 'EventType')

    await expect(eventTypesApi.get('no-such-type')).rejects.toThrow(/не найден/)
  })

  it('POST /event-types — 201 с EventType, дубликат id — 409', async () => {
    const created = await eventTypesApi.create({
      id: 'new-type-45',
      name: 'Новый тип',
      description: 'Создано в контрактном тесте.',
      durationMinutes: 45,
    })
    assertMatches(created, 'EventType')

    const error = (await eventTypesApi
      .create({
        id: 'new-type-45',
        name: 'Дубликат',
        description: 'Тот же id, что уже создан.',
        durationMinutes: 45,
      })
      .catch((e) => e)) as { status: number }
    expect(error.status).toBe(409)
  })

  it('GET /event-types/{id}/slots — массив AvailableSlot', async () => {
    const slots = await slotsApi.list(firstEventType.id)
    expect(slots.length).toBeGreaterThan(0)
    for (const slot of slots) {
      assertMatches<AvailableSlot>(slot, 'AvailableSlot')
    }
  })

  it('POST /bookings — 201 с Booking на свободный слот', async () => {
    const { start } = bookingAtTodayNine(firstEventType.id)
    const booking = await bookings.create({ eventTypeId: firstEventType.id, start })
    expect(booking.eventTypeId).toBe(firstEventType.id)
    assertMatches(booking, 'Booking')
  })

  it('POST /bookings — 409 slot_already_booked на занятый слот', async () => {
    const { start } = bookingAtTodayNine(firstEventType.id)
    await bookings.create({ eventTypeId: firstEventType.id, start })
    const error = (await bookings
      .create({ eventTypeId: firstEventType.id, start })
      .catch((e) => e)) as { status: number; kind: string }
    expect(error.status).toBe(409)
    expect(error.kind).toBe('slot_already_booked')
  })

  it('GET /bookings — массив BookingWithEventType', async () => {
    const list = await bookings.listUpcoming()
    expect(list.length).toBeGreaterThan(0)
    for (const booking of list) {
      assertMatches(booking, 'BookingWithEventType')
    }
  })
})
