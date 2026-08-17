import { describe, expect, it } from 'vitest'
import { EVENT_TYPE_LIMITS, eventTypeCreateSchema } from './eventType'

const { idMaxLength, nameMaxLength, descriptionMaxLength, durationMin, durationMax } =
  EVENT_TYPE_LIMITS

const VALID = {
  id: 'consultation-30',
  name: 'Консультация',
  description: 'Тридцать минут разговора о проекте.',
  durationMinutes: '30',
}

/** Парсит успешный ввод и возвращает данные; при ошибке `parse` бросит исключение. */
function parseOk(input: unknown) {
  return eventTypeCreateSchema.parse(input)
}

/** Проверяет, что парсинг провалился (без ветвлений над результатом). */
function isInvalid(input: unknown): boolean {
  return eventTypeCreateSchema.safeParse(input).success === false
}

describe('id', () => {
  it('принимает валидный kebab-case', () => {
    expect(parseOk(VALID).id).toBe('consultation-30')
  })

  it('отклоняет пустой id', () => {
    expect(isInvalid({ ...VALID, id: '' })).toBe(true)
  })

  it('отклоняет строку из пробелов (trim до пустоты)', () => {
    expect(isInvalid({ ...VALID, id: '   ' })).toBe(true)
  })

  it('принимает id в один символ', () => {
    expect(parseOk({ ...VALID, id: 'a' }).id).toBe('a')
  })

  it(`принимает id длиной ${idMaxLength} символов`, () => {
    expect(parseOk({ ...VALID, id: 'a'.repeat(idMaxLength) }).id).toHaveLength(idMaxLength)
  })

  it(`отклоняет id длиной ${idMaxLength + 1} символов`, () => {
    expect(isInvalid({ ...VALID, id: 'a'.repeat(idMaxLength + 1) })).toBe(true)
  })

  it('принимает id с пробелами вокруг (trim)', () => {
    expect(parseOk({ ...VALID, id: ' consultation-30 ' }).id).toBe('consultation-30')
  })

  it.each([
    ['заглавные буквы', 'Bad_Id'],
    ['заглавная буква', 'Consultation-30'],
    ['подчёркивание', 'consultation_30'],
    ['ведущий дефис', '-consultation-30'],
    ['двойной дефис', 'consultation--30'],
    ['дефис в конце', 'consultation-'],
    ['точка', 'consultation.30'],
    ['слэш', 'consultation/30'],
    ['кириллица', 'консультация'],
  ])('отклоняет нарушение kebab-case: %s', (_label, value) => {
    expect(isInvalid({ ...VALID, id: value })).toBe(true)
  })

  it('соответствует паттерну контракта', () => {
    expect('a'.repeat(64)).toMatch(EVENT_TYPE_LIMITS.idPattern)
    expect('-leading').not.toMatch(EVENT_TYPE_LIMITS.idPattern)
  })
})

describe('name', () => {
  it('отклоняет пустое название', () => {
    expect(isInvalid({ ...VALID, name: '' })).toBe(true)
  })

  it('отклоняет название из пробелов', () => {
    expect(isInvalid({ ...VALID, name: '   ' })).toBe(true)
  })

  it(`принимает название в ${nameMaxLength} символов`, () => {
    expect(parseOk({ ...VALID, name: 'и'.repeat(nameMaxLength) }).name).toHaveLength(nameMaxLength)
  })

  it(`отклоняет название в ${nameMaxLength + 1} символов`, () => {
    expect(isInvalid({ ...VALID, name: 'и'.repeat(nameMaxLength + 1) })).toBe(true)
  })
})

describe('description', () => {
  it('отклоняет пустое описание', () => {
    expect(isInvalid({ ...VALID, description: '' })).toBe(true)
  })

  it(`принимает описание в ${descriptionMaxLength} символов`, () => {
    expect(parseOk({ ...VALID, description: 'и'.repeat(descriptionMaxLength) }).description).toBe(
      'и'.repeat(descriptionMaxLength),
    )
  })

  it(`отклоняет описание в ${descriptionMaxLength + 1} символов`, () => {
    expect(isInvalid({ ...VALID, description: 'и'.repeat(descriptionMaxLength + 1) })).toBe(true)
  })
})

describe('durationMinutes', () => {
  it(`отклоняет значение меньше ${durationMin} минут`, () => {
    expect(isInvalid({ ...VALID, durationMinutes: String(durationMin - 1) })).toBe(true)
  })

  it(`принимает значение ${durationMin} минут`, () => {
    expect(parseOk({ ...VALID, durationMinutes: String(durationMin) }).durationMinutes).toBe(
      durationMin,
    )
  })

  it(`принимает значение ${durationMax} минут`, () => {
    expect(parseOk({ ...VALID, durationMinutes: String(durationMax) }).durationMinutes).toBe(
      durationMax,
    )
  })

  it(`отклоняет значение больше ${durationMax} минут`, () => {
    expect(isInvalid({ ...VALID, durationMinutes: String(durationMax + 1) })).toBe(true)
  })

  it('отклоняет пустое поле', () => {
    expect(isInvalid({ ...VALID, durationMinutes: '' })).toBe(true)
  })

  it('отклоняет нечисловое значение', () => {
    expect(isInvalid({ ...VALID, durationMinutes: 'abc' })).toBe(true)
  })

  it('отклоняет нецелое значение', () => {
    expect(isInvalid({ ...VALID, durationMinutes: '12.5' })).toBe(true)
  })

  it('принимает значение с пробелами вокруг (trim) и приводит к числу', () => {
    expect(parseOk({ ...VALID, durationMinutes: ' 30 ' }).durationMinutes).toBe(30)
    expect(typeof parseOk({ ...VALID, durationMinutes: ' 30 ' }).durationMinutes).toBe('number')
  })
})
