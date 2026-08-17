import { afterAll, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { resetCapturedRequests, startMockServer, stopMockServer } from '@/test/server'
import { resetState } from '@/test/state'
import { EventTypesTab } from './EventTypesTab'
import { messages } from '@/lib/messages'

describe('EventTypesTab', () => {
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

  it('рендерит таблицу типов событий', async () => {
    renderWithProviders(<EventTypesTab />)

    // И мобильные карточки, и настольная таблица рендерятся в DOM одновременно.
    const links = await screen.findAllByRole('link', { name: /Консультация/ })
    expect(links.length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /Быстрый звонок/ }).length).toBeGreaterThan(0)
  })

  it('создание типа события закрывает диалог и обновляет таблицу', async () => {
    const { user } = renderWithProviders(<EventTypesTab />)
    await screen.findAllByRole('link', { name: /Консультация/ })

    await user.click(screen.getByRole('button', { name: 'Новый тип события' }))

    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(messages.admin.form.idLabel), 'webinar-60')
    await user.type(within(dialog).getByLabelText(messages.admin.form.nameLabel), 'Вебинар')
    await user.type(
      within(dialog).getByLabelText(messages.admin.form.descriptionLabel),
      'Вебинар на час',
    )
    await user.type(within(dialog).getByLabelText(messages.admin.form.durationLabel), '60')
    await user.click(within(dialog).getByRole('button', { name: 'Создать' }))

    // Диалог закрылся, новый тип появился в таблице (инвалидация кэша).
    await screen.findAllByRole('link', { name: /Вебинар/ })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('дублирующий id показывает ошибку под полем, диалог остаётся открытым', async () => {
    const { user } = renderWithProviders(<EventTypesTab />)
    await screen.findAllByRole('link', { name: /Консультация/ })

    await user.click(screen.getByRole('button', { name: 'Новый тип события' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText(messages.admin.form.idLabel), 'consultation-30')
    await user.type(within(dialog).getByLabelText(messages.admin.form.nameLabel), 'Дубль')
    await user.type(within(dialog).getByLabelText(messages.admin.form.descriptionLabel), 'Дубль')
    await user.type(within(dialog).getByLabelText(messages.admin.form.durationLabel), '30')
    await user.click(within(dialog).getByRole('button', { name: 'Создать' }))

    // Поле id помечается невалидным и ошибка отображается под ним,
    // диалог остаётся открытым.
    await waitFor(() =>
      expect(within(dialog).getByLabelText(messages.admin.form.idLabel)).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
