import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import { renderRoute } from '@/test/render'
import { API_BASE_URL } from '@/test/base'
import { mockServer, resetCapturedRequests, startMockServer, stopMockServer } from '@/test/server'
import { resetState, state } from '@/test/state'
import { messages } from '@/lib/messages'

describe('BookEventTypesPage', () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 5, 0, 0, 0))
    startMockServer()
  })

  afterAll(() => {
    mockServer.resetHandlers()
    stopMockServer()
    vi.useRealTimers()
  })

  beforeEach(() => {
    resetState()
    resetCapturedRequests()
  })

  it('загрузка → карточки типов событий', async () => {
    renderRoute('/book')

    const consultation = await screen.findByRole('link', { name: /Консультация/ })
    expect(consultation).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Быстрый звонок/ })).toBeInTheDocument()
  })

  it('пустой список → EmptyState', async () => {
    state.eventTypes = []
    renderRoute('/book')

    expect(await screen.findByText(messages.booking.eventTypesEmptyTitle)).toBeInTheDocument()
  })

  it('ошибка → ErrorState, «Повторить» перезапрашивает (500 один раз, затем 200)', async () => {
    let calls = 0
    mockServer.use(
      http.get(`${API_BASE_URL}/event-types`, () => {
        calls += 1
        if (calls === 1) {
          return HttpResponse.json({ code: 500, message: 'Ошибка' }, { status: 500 })
        }
        return HttpResponse.json(state.eventTypes)
      }),
    )

    const { user } = renderRoute('/book')

    const retry = await screen.findByRole('button', { name: 'Повторить' })
    expect(retry).toBeInTheDocument()
    expect(screen.getByText(messages.errors.serverTitle)).toBeInTheDocument()

    await user.click(retry)
    expect(await screen.findByRole('link', { name: /Консультация/ })).toBeInTheDocument()
    expect(calls).toBe(2)
  })
})
