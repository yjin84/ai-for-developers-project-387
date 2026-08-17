import { describe, expect, it } from 'vitest'
import type { AvailableSlot } from '@/api/slots'
import { firstAvailableDay, groupSlotsByDay } from './slots'

function slot(start: string): AvailableSlot {
  const startDate = new Date(start)
  return {
    start,
    end: new Date(startDate.getTime() + 15 * 60_000).toISOString(),
  }
}

describe('groupSlotsByDay', () => {
  it('группирует слоты по локальному дню (TZ Europe/Moscow)', () => {
    const byDay = groupSlotsByDay([
      slot('2026-08-06T07:00:00Z'),
      slot('2026-08-06T09:00:00Z'),
      slot('2026-08-07T07:00:00Z'),
    ])

    expect([...byDay.keys()]).toEqual(['2026-08-06', '2026-08-07'])
    expect(byDay.get('2026-08-06')).toHaveLength(2)
    expect(byDay.get('2026-08-07')).toHaveLength(1)
  })

  it('сортирует время внутри дня при перемешанном входе', () => {
    const byDay = groupSlotsByDay([
      slot('2026-08-06T09:00:00Z'),
      slot('2026-08-06T07:00:00Z'),
      slot('2026-08-06T08:00:00Z'),
    ])

    const times = byDay.get('2026-08-06')!.map((s) => s.start)
    expect(times).toEqual(['2026-08-06T07:00:00Z', '2026-08-06T08:00:00Z', '2026-08-06T09:00:00Z'])
  })

  it('возвращает пустую карту для пустого входа', () => {
    expect(groupSlotsByDay([]).size).toBe(0)
  })

  it('слот с UTC-временем попадает в следующий день по локальному времени', () => {
    // 2026-08-06T22:00:00Z → 2026-08-07T01:00:00+03:00
    const byDay = groupSlotsByDay([slot('2026-08-06T22:00:00Z')])

    expect([...byDay.keys()]).toEqual(['2026-08-07'])
    expect(byDay.get('2026-08-06')).toBeUndefined()
  })

  it('не смешивает слоты одного UTC-дня, попадающие в разные локальные дни', () => {
    // 22:00Z и 01:00Z одного UTC-дня — это разные локальные дни в Москве.
    const byDay = groupSlotsByDay([slot('2026-08-06T22:00:00Z'), slot('2026-08-06T01:00:00Z')])

    expect([...byDay.keys()].sort()).toEqual(['2026-08-06', '2026-08-07'])
  })
})

describe('firstAvailableDay', () => {
  it('возвращает ближайший по дате день', () => {
    const byDay = groupSlotsByDay([slot('2026-08-07T07:00:00Z'), slot('2026-08-06T07:00:00Z')])
    expect(firstAvailableDay(byDay)).toBe('2026-08-06')
  })

  it('возвращает undefined для пустой карты', () => {
    expect(firstAvailableDay(new Map())).toBeUndefined()
  })
})
