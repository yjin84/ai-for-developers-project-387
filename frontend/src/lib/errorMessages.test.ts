import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from '@/api/errors'
import { describeError } from './errorMessages'
import { messages } from './messages'

const { errors } = messages

describe('describeError', () => {
  it('распознаёт ApiError со знакомой разновидностью slot_already_booked', () => {
    const error = new ApiError(409, { code: 'slot_already_booked', message: 'Слот занят' })
    expect(describeError(error)).toEqual({
      title: errors.slotAlreadyBookedTitle,
      description: 'Слот занят',
    })
  })

  it('использует свой текст для slot_already_booked без серверного сообщения', () => {
    const error = new ApiError(409, { code: 'slot_already_booked', message: '' })
    expect(describeError(error)).toEqual({
      title: errors.slotAlreadyBookedTitle,
      description: errors.slotAlreadyBookedDescription,
    })
  })

  it('распознаёт ApiError со знакомой разновидностью slot_not_available', () => {
    const error = new ApiError(400, { code: 'slot_not_available', message: 'Слот недоступен' })
    expect(describeError(error)).toEqual({
      title: errors.slotNotAvailableTitle,
      description: 'Слот недоступен',
    })
  })

  it('распознаёт 404', () => {
    const error = new ApiError(404, { code: 404, message: 'Not found' })
    expect(describeError(error).title).toBe(errors.notFoundTitle)
  })

  it('использует fallback-описание для 404', () => {
    const error = new ApiError(404, { code: 404, message: 'Not found' })
    expect(describeError(error, 'Свой текст').description).toBe('Свой текст')
  })

  it('распознаёт 500 как серверную ошибку', () => {
    const error = new ApiError(500, { code: 500, message: 'boom' })
    expect(describeError(error).title).toBe(errors.serverTitle)
  })

  it('для неизвестной разновидности показывает сообщение сервера', () => {
    const error = new ApiError(400, { code: 123, message: 'Плохой запрос' })
    expect(describeError(error)).toEqual({
      title: messages.states.errorTitle,
      description: 'Плохой запрос',
    })
  })

  it('для неизвестной разновидности без сообщения использует fallback', () => {
    const error = new ApiError(400, { code: 123, message: '' })
    expect(describeError(error, 'Описание из экрана').description).toBe('Описание из экрана')
  })

  it('для неизвестной разновидности без сообщения и fallback использует дефолт', () => {
    const error = new ApiError(400, { code: 123, message: '' })
    expect(describeError(error).description).toBe(errors.unknownDescription)
  })

  it('распознаёт сетевую ошибку без таймаута', () => {
    const error = new NetworkError(new TypeError('Failed to fetch'))
    expect(describeError(error)).toEqual({
      title: errors.networkTitle,
      description: errors.networkDescription,
    })
  })

  it('распознаёт таймаут по имени причины', () => {
    const cause = new Error('The operation was aborted')
    cause.name = 'TimeoutError'
    const error = new NetworkError(cause)
    expect(describeError(error)).toEqual({
      title: errors.timeoutTitle,
      description: errors.timeoutDescription,
    })
  })

  it('распознаёт таймаут по явному флагу', () => {
    const error = new NetworkError(new Error('x'), { timeout: true })
    expect(describeError(error).title).toBe(errors.timeoutTitle)
  })

  it('использует fallback-описание для неизвестной ошибки', () => {
    expect(describeError({ weird: true }, 'Описание из экрана')).toEqual({
      title: errors.unknownTitle,
      description: 'Описание из экрана',
    })
  })

  it('использует дефолт для неизвестной ошибки без fallback', () => {
    expect(describeError('строка, а не ошибка').description).toBe(errors.unknownDescription)
  })
})
