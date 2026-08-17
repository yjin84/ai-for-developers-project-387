import { describe, expect, it } from 'vitest'
import { format, messages, plural } from './messages'

describe('format', () => {
  it('подставляет именованные параметры', () => {
    expect(format(messages.common.minutesShort, { n: 15 })).toBe('15 мин')
  })

  it('подставляет числовой параметр', () => {
    expect(format(messages.validation.idMaxLength, { max: 64 })).toBe('Не длиннее 64 символов.')
  })

  it('оставляет шаблон как есть, если ключа нет в параметрах', () => {
    expect(format(messages.common.minutesShort, { other: 1 })).toBe('{n} мин')
  })

  it('подставляет несколько разных параметров', () => {
    expect(format('{min}–{max}', { min: 5, max: 480 })).toBe('5–480')
  })
})

describe('plural', () => {
  const forms = ['встреча', 'встречи', 'встреч'] as const

  it.each([
    [0, 'встреч'],
    [1, 'встреча'],
    [2, 'встречи'],
    [5, 'встреч'],
    [11, 'встреч'],
    [21, 'встреча'],
    [22, 'встречи'],
    [25, 'встреч'],
    [101, 'встреча'],
    [111, 'встреч'],
  ])('для %i возвращает «%s»', (count, expected) => {
    expect(plural(count, forms)).toBe(expected)
  })

  it('работает с отрицательными числами по модулю', () => {
    expect(plural(-1, forms)).toBe('встреча')
  })
})
