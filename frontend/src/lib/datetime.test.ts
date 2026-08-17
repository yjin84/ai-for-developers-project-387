import { describe, expect, it } from 'vitest'
import {
  dayKey,
  formatDate,
  formatDateTime,
  formatFullDate,
  formatMonthTitle,
  formatTime,
  formatTimeRange,
  monthKey,
} from './datetime'

describe('dayKey', () => {
  it('форматирует день в yyyy-MM-dd', () => {
    expect(dayKey(new Date(2026, 7, 6, 10, 30))).toBe('2026-08-06')
  })

  it('добавляет ведущий ноль дню и месяцу', () => {
    expect(dayKey(new Date(2026, 2, 4))).toBe('2026-03-04')
  })
})

describe('monthKey', () => {
  it('форматирует месяц в yyyy-MM', () => {
    expect(monthKey(new Date(2026, 2, 4))).toBe('2026-03')
    expect(monthKey(new Date(2026, 11, 31))).toBe('2026-12')
  })
})

describe('formatMonthTitle', () => {
  it('выводит русское название месяца с годом', () => {
    expect(formatMonthTitle(new Date(2026, 2, 4))).toBe('март 2026 г.')
    expect(formatMonthTitle(new Date(2026, 11, 1))).toBe('декабрь 2026 г.')
  })
})

describe('formatFullDate', () => {
  it('выводит день недели и число', () => {
    // 2026-08-06 — четверг.
    expect(formatFullDate(new Date(2026, 7, 6))).toBe('четверг, 6 августа')
  })
})

describe('formatTime', () => {
  it('выводит HH:mm', () => {
    expect(formatTime(new Date(2026, 7, 6, 9, 5))).toBe('09:05')
  })
})

describe('formatTimeRange', () => {
  it('соединяет начало и конец дефисом', () => {
    const start = new Date(2026, 7, 6, 9, 0)
    const end = new Date(2026, 7, 6, 9, 15)
    expect(formatTimeRange(start, end)).toBe('09:00–09:15')
  })
})

describe('formatDate', () => {
  it('выводит «число месяц год»', () => {
    expect(formatDate(new Date(2026, 2, 31))).toBe('31 марта 2026')
  })
})

describe('formatDateTime', () => {
  it('выводит компактные дату и время', () => {
    expect(formatDateTime(new Date(2026, 2, 31, 9, 0))).toBe('31.03.2026, 09:00')
  })
})
