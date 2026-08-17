import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { screen, waitFor } from '@testing-library/react'
import { renderRoute } from '@/test/render'
import { resetCapturedRequests, startMockServer, stopMockServer } from '@/test/server'
import { resetState, state } from '@/test/state'
import { availableSlotsFor } from '@/test/fixtures'
import { messages } from '@/lib/messages'

/** «Сегодня» в тестах — фиксированная дата, от которой считаются фикстуры. */
const TODAY = new Date(2026, 7, 5, 0, 0, 0)

/** aria-label дня в react-day-picker: полная дата (`PPPP`, локаль ru). */
const dayLabel = (date: Date) => format(date, 'PPPP', { locale: ru })

describe('BookSlotPage', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(TODAY)
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

  it('выбор слота и подтверждение приводят к карточке подтверждения', async () => {
    const { user } = renderRoute('/book/consultation-30')

    // «Сегодня» выбрано по умолчанию → на сегодня три временных слота.
    await screen.findByRole('radio', { name: /09:00/ })
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByText(messages.booking.selectedTimeEmpty)).toBeInTheDocument()

    // Выбираем время → сводка показывает диапазон, кнопка активна.
    const confirm = screen.getByRole('button', { name: 'Подтвердить' })
    expect(confirm).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: /09:00/ }))
    // Выбранный диапазон отображается в сводке выбора (под подписью «Время»).
    const timeLabel = screen.getByText(messages.booking.selectedTimeLabel)
    await waitFor(() => expect(timeLabel.nextElementSibling).toHaveTextContent('09:00–09:30'))
    expect(confirm).toBeEnabled()

    // Подтверждаем → экран подтверждения (заголовок также дублируется
    // тостом, поэтому ищем по ссылке действий подтверждённой встречи).
    await user.click(confirm)
    expect(
      await screen.findByRole('link', { name: messages.booking.confirmedAgain }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(messages.booking.confirmedTitle).length).toBeGreaterThan(0)
  })

  it('выбор другого дня меняет список доступного времени', async () => {
    const { user } = renderRoute('/book/consultation-30')
    await screen.findByRole('radio', { name: /09:00/ })

    // «Завтра» — два слота (09:00, 10:00).
    const tomorrow = new Date(2026, 7, 6, 0, 0, 0)
    await user.click(screen.getByRole('button', { name: dayLabel(tomorrow) }))

    await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(2))
    expect(screen.getByRole('radio', { name: /10:00/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /11:00/ })).not.toBeInTheDocument()
  })

  it('409 сбрасывает выбор и перезапрашивает слоты (слот исчезает из DOM)', async () => {
    const { user } = renderRoute('/book/consultation-30')
    const radio = await screen.findByRole('radio', { name: /09:00/ })
    await user.click(radio)

    // Между выбором и подтверждением кто-то успел занять слот.
    const target = availableSlotsFor('consultation-30').find(
      (s) => new Date(s.start).getHours() === 9,
    )!
    state.bookedStarts.add(target.start)

    await user.click(screen.getByRole('button', { name: 'Подтвердить' }))

    // Показывается сообщение об ошибке и слот пропал из списка (инвалидация).
    // Для slot_already_booked describeError показывает серверный message
    // («Слот уже занят»), а не общий текст описания.
    expect(await screen.findByText('Слот уже занят')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('radio', { name: /09:00/ })).not.toBeInTheDocument(),
    )
  })

  it('кнопка «предыдущий месяц» блокируется на первом месяце данных', async () => {
    renderRoute('/book/consultation-30')
    await screen.findByRole('radio', { name: /09:00/ })
    // react-day-picker помечает недоступную навигацию aria-disabled, а не
    // атрибутом disabled.
    const prev = screen.getByRole('button', { name: /previous month/i })
    expect(prev).toHaveAttribute('aria-disabled', 'true')
  })
})
