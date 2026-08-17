import { z } from 'zod'
import type { components } from '@/api/schema'
import { format, messages } from '@/lib/messages'

/**
 * Ограничения модели `EventTypeCreate` из контракта TypeSpec
 * (`typespec/models.tsp` → `openapi.yaml`). Значения продублированы здесь
 * вручную, потому что `openapi-typescript` не переносит `pattern`/`minLength`/
 * `minimum` в типы: в `schema.d.ts` остаются только `string` и `number`.
 *
 * Расхождение с контрактом ловится не типами, а прогоном против мока по
 * `openapi.yaml`: тот же ввод, что отклоняет форма, должен отклоняться и
 * сервером (422). Порядок правки — сначала контракт, потом эти константы.
 */
export const EVENT_TYPE_LIMITS = {
  /** `scalar EventTypeId`: kebab-case, чтобы id оставался читаемым в URL. */
  idPattern: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  idMaxLength: 64,
  nameMaxLength: 100,
  descriptionMaxLength: 500,
  durationMin: 5,
  durationMax: 480,
} as const

const { validation } = messages

/**
 * Правила валидации формы создания типа события — зеркалят модель
 * `EventTypeCreate` контракта один-в-один.
 *
 * Поля формы строковые (значение `<input>`), схема приводит
 * `durationMinutes` к числу: `z.input` — то, что вводит пользователь,
 * `z.output` — тело запроса `POST /event-types`.
 */
export const eventTypeCreateSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, validation.idRequired)
    .max(
      EVENT_TYPE_LIMITS.idMaxLength,
      format(validation.idMaxLength, { max: EVENT_TYPE_LIMITS.idMaxLength }),
    )
    .regex(EVENT_TYPE_LIMITS.idPattern, validation.idPattern),
  name: z
    .string()
    .trim()
    .min(1, validation.nameRequired)
    .max(
      EVENT_TYPE_LIMITS.nameMaxLength,
      format(validation.nameMaxLength, { max: EVENT_TYPE_LIMITS.nameMaxLength }),
    ),
  description: z
    .string()
    .trim()
    .min(1, validation.descriptionRequired)
    .max(
      EVENT_TYPE_LIMITS.descriptionMaxLength,
      format(validation.descriptionMaxLength, { max: EVENT_TYPE_LIMITS.descriptionMaxLength }),
    ),
  // Пустое поле должно дать «укажите длительность», а не превратиться в 0,
  // поэтому проверяем строку до приведения к числу.
  durationMinutes: z
    .string()
    .trim()
    .min(1, validation.durationRequired)
    .regex(/^\d+$/, validation.durationInteger)
    .transform(Number)
    .refine(
      (minutes) =>
        minutes >= EVENT_TYPE_LIMITS.durationMin && minutes <= EVENT_TYPE_LIMITS.durationMax,
      format(validation.durationRange, {
        min: EVENT_TYPE_LIMITS.durationMin,
        max: EVENT_TYPE_LIMITS.durationMax,
      }),
    ),
})

/** Значения полей формы (до преобразования) — все поля строковые. */
export type EventTypeCreateFormValues = z.input<typeof eventTypeCreateSchema>

/** Провалидированное тело запроса `POST /event-types`. */
export type EventTypeCreateValues = z.output<typeof eventTypeCreateSchema>

type ContractEventTypeCreate = components['schemas']['EventTypeCreate']

/**
 * Compile-time защита от рассинхрона схемы и контракта.
 *
 * Взаимное присваивание ломает `typecheck`, если в `EventTypeCreate`
 * появится, исчезнет или сменит тип поле. Ограничения (`pattern`, границы)
 * этой проверкой **не** покрываются — их нет в типах; они проверяются
 * прогоном против мока по `openapi.yaml`.
 */
type AssertMirrors<A extends B, B extends C, C = A> = true
export type EventTypeCreateMirrorsContract = AssertMirrors<
  EventTypeCreateValues,
  ContractEventTypeCreate
>
