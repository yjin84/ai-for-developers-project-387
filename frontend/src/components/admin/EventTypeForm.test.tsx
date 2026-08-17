import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { EventTypeForm } from './EventTypeForm'
import { renderWithProviders } from '@/test/render'
import { ApiError } from '@/api/errors'
import { messages } from '@/lib/messages'
import type { EventTypeCreateValues } from '@/lib/validation/eventType'

type Submit = (values: EventTypeCreateValues) => Promise<void>

describe('EventTypeForm', () => {
  it('пустой сабмит показывает ошибки по всем полям и не вызывает onSubmit', async () => {
    const onSubmit = vi.fn<Submit>()
    const { user } = renderWithProviders(<EventTypeForm onSubmit={onSubmit} onCancel={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(screen.getByText(messages.validation.idRequired)).toBeInTheDocument()
    expect(screen.getByText(messages.validation.nameRequired)).toBeInTheDocument()
    expect(screen.getByText(messages.validation.descriptionRequired)).toBeInTheDocument()
    expect(screen.getByText(messages.validation.durationRequired)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    // Фокус — на первом поле с ошибкой.
    expect(screen.getByLabelText(messages.admin.form.idLabel)).toHaveFocus()
  })

  it('валидные данные → onSubmit с durationMinutes типа number', async () => {
    const onSubmit = vi.fn<Submit>().mockResolvedValue(undefined)
    const { user } = renderWithProviders(<EventTypeForm onSubmit={onSubmit} onCancel={() => {}} />)

    await user.type(screen.getByLabelText(messages.admin.form.idLabel), 'meeting-15')
    await user.type(screen.getByLabelText(messages.admin.form.nameLabel), 'Встреча')
    await user.type(screen.getByLabelText(messages.admin.form.descriptionLabel), 'Короткая встреча')
    await user.type(screen.getByLabelText(messages.admin.form.durationLabel), '15')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      id: 'meeting-15',
      name: 'Встреча',
      description: 'Короткая встреча',
      durationMinutes: 15,
    })
  })

  it('серверный 409 привязывает ошибку к полю id и возвращает на него фокус', async () => {
    const onSubmit = vi
      .fn<Submit>()
      .mockRejectedValue(new ApiError(409, { code: 409, message: messages.validation.idDuplicate }))
    const { user } = renderWithProviders(<EventTypeForm onSubmit={onSubmit} onCancel={() => {}} />)

    await user.type(screen.getByLabelText(messages.admin.form.idLabel), 'consultation-30')
    await user.type(screen.getByLabelText(messages.admin.form.nameLabel), 'Встреча')
    await user.type(screen.getByLabelText(messages.admin.form.descriptionLabel), 'Описание')
    await user.type(screen.getByLabelText(messages.admin.form.durationLabel), '30')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(await screen.findByText(messages.validation.idDuplicate)).toBeInTheDocument()
    expect(screen.getByLabelText(messages.admin.form.idLabel)).toHaveFocus()
  })
})
