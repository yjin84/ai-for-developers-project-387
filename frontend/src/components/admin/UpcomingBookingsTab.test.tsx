import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { resetCapturedRequests, startMockServer, stopMockServer } from '@/test/server'
import { resetState } from '@/test/state'
import { UpcomingBookingsTab } from './UpcomingBookingsTab'

/**
 * Клиентская сортировка по `start` на неотсортированной фикстуре:
 * контракт не гарантирует порядок, поэтому ближайшая встреча должна быть
 * сверху независимо от порядка в ответе API.
 */
describe('UpcomingBookingsTab', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
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

  it('рендерит таблицу со встречами, отсортированными по времени', async () => {
    renderWithProviders(<UpcomingBookingsTab />)

    const rows = await screen.findAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)

    // Сортировка идёт по полной дате+времени (встречи в фикстуре на разных
    // днях), поэтому сравниваем пары «дата | время» из ячеек таблицы.
    const dateTimes = rows.slice(1).map((row) => {
      const cells = within(row).getAllByRole('cell')
      const date = cells[1]!.textContent!
      const time = cells[2]!.textContent!
      return `${date} ${time}`
    })

    const sorted = [...dateTimes].sort()
    expect(dateTimes).toEqual(sorted)
  })
})
