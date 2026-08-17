import type { AvailableSlot } from '@/api/slots'
import { dayKey } from './datetime'

/** Слоты, сгруппированные по дню (ключ — `yyyy-MM-dd`), время внутри дня отсортировано. */
export type SlotsByDay = Map<string, AvailableSlot[]>

/**
 * Группирует свободные слоты по дню начала (в локальном часовом поясе браузера)
 * — используется, чтобы построить календарь и список времени выбранного дня.
 */
export function groupSlotsByDay(slots: AvailableSlot[]): SlotsByDay {
  const byDay: SlotsByDay = new Map()

  for (const slot of slots) {
    const key = dayKey(new Date(slot.start))
    const dayList = byDay.get(key)
    if (dayList) {
      dayList.push(slot)
    } else {
      byDay.set(key, [slot])
    }
  }

  for (const dayList of byDay.values()) {
    dayList.sort((a, b) => a.start.localeCompare(b.start))
  }

  return byDay
}

/** Первый (ближайший по времени) день, для которого есть свободные слоты. */
export function firstAvailableDay(byDay: SlotsByDay): string | undefined {
  return [...byDay.keys()].sort().at(0)
}
