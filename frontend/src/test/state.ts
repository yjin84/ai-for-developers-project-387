import type { Booking, BookingWithEventType } from '@/api/bookings'
import type { EventType } from '@/api/eventTypes'
import { availableSlotsFor, eventTypes, seedBookings } from './fixtures'

/**
 * Минимальное состояние мок-бэкенда в памяти.
 *
 * Нужно, чтобы воспроизвести 409 (созданный тип с дублирующим id, занятый
 * слот) и «созданный тип сразу виден в списке» — статичного Prism-примера
 * на это не хватает. `resetState()` вызывается в `beforeEach` каждого теста.
 */
export const state = {
  eventTypes: [] as EventType[],
  bookings: [] as BookingWithEventType[],
  /** Время занятых слотов (`Booking.start`) — по ним отсеиваются слоты из каталога. */
  bookedStarts: new Set<string>(),
  /**
   * Имитация сетевого сбоя для E2E (`/__test/network`): при `true` ответы на
   * все запросы падают как недоступность сети. Так Playwright-сценарий может
   * проверять состояние ошибки и кнопку «Повторить», не полагаясь на
   * `page.route` (тот не перехватывает запросы, уже обработанные SW MSW).
   */
  networkDown: false,
}

/** Две недели от текущего момента — окно записи контракта, в миллисекундах. */
export const BOOKING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

/** Восстанавливает состояние из фикстур (заполняет каталог и занятые слоты). */
export function resetState(): void {
  state.eventTypes = eventTypes.map((e) => ({ ...e }))
  state.bookings = seedBookings()
  state.bookedStarts = new Set(state.bookings.map((b) => b.start))
}

/** Каталог слотов типа события за вычетом уже занятых. */
export function freeSlotsFor(eventTypeId: string): { start: string; end: string }[] {
  return availableSlotsFor(eventTypeId).filter((slot) => !state.bookedStarts.has(slot.start))
}

/** Результат создания брони: либо готовая бронь, либо ошибка с HTTP-статусом. */
export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; status: 409; body: { code: 'slot_already_booked'; message: string } }
  | { ok: false; status: 400; body: { code: 'slot_not_available'; message: string } }

/** Создаёт бронь по запросу гостя, проверяя занятость и окно записи. */
export function createBooking(body: { eventTypeId: string; start: string }): CreateBookingResult {
  if (state.bookedStarts.has(body.start)) {
    return {
      ok: false,
      status: 409,
      body: { code: 'slot_already_booked', message: 'Слот уже занят' },
    }
  }

  const startMs = new Date(body.start).getTime()
  const nowMs = Date.now()
  const withinWindow = startMs >= nowMs - 1000 && startMs <= nowMs + BOOKING_WINDOW_MS + 1000
  const eventType = state.eventTypes.find((e) => e.id === body.eventTypeId)

  if (!withinWindow || !eventType) {
    return {
      ok: false,
      status: 400,
      body: { code: 'slot_not_available', message: 'Слот вне окна записи' },
    }
  }

  const booking: Booking = {
    id: `booking-${state.bookings.length + 1}`,
    eventTypeId: body.eventTypeId,
    start: body.start,
    end: new Date(startMs + eventType.durationMinutes * 60_000).toISOString(),
    createdAt: new Date().toISOString(),
  }

  state.bookedStarts.add(body.start)
  state.bookings.push({
    id: booking.id,
    eventType,
    start: booking.start,
    end: booking.end,
    createdAt: booking.createdAt,
  })

  return { ok: true, booking }
}
