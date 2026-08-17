import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

/** Ключ дня в формате `yyyy-MM-dd` — используется для группировки слотов и сравнения дат. */
export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Ключ месяца в формате `yyyy-MM` — используется для сравнения границ окна записи. */
export function monthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

/** Название месяца и год, например «март 2026 г.». */
export function formatMonthTitle(date: Date): string {
  return format(date, 'LLLL yyyy г.', { locale: ru })
}

/** Полная дата для сводки выбора, например «вторник, 31 марта». */
export function formatFullDate(date: Date): string {
  return format(date, 'EEEE, d MMMM', { locale: ru })
}

/** Дата с годом для списков, например «31 марта 2026». */
export function formatDate(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: ru })
}

/** Компактные дата и время, например «31.03.2026, 09:00». */
export function formatDateTime(date: Date): string {
  return format(date, 'dd.MM.yyyy, HH:mm')
}

/** Время в формате `HH:mm`. */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm')
}

/** Диапазон времени слота, например «09:00–09:15». */
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)}–${formatTime(end)}`
}
