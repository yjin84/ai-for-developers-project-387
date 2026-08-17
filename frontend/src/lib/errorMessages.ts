import { ApiError, NetworkError } from '@/api/errors'
import { messages } from '@/lib/messages'

/** Пара «заголовок + описание» для показа ошибки пользователю. */
export type ErrorDescription = {
  title: string
  description: string
}

/**
 * Единый маппинг ошибки в текст для пользователя.
 *
 * Порядок распознавания: известная разновидность `ApiError` → HTTP-статус →
 * сетевой сбой → неизвестная ошибка. Для известных случаев показываем свой
 * текст, серверный `message` используется как фолбэк — он приходит от
 * бэкенда и может быть не рассчитан на конечного пользователя.
 *
 * Используется тостами, `ErrorState` и страницей ошибки роутера, чтобы
 * один и тот же сбой везде описывался одинаково.
 */
export function describeError(error: unknown, fallbackDescription?: string): ErrorDescription {
  const { errors } = messages

  if (error instanceof ApiError) {
    if (error.kind === 'slot_already_booked') {
      return {
        title: errors.slotAlreadyBookedTitle,
        description: error.message || errors.slotAlreadyBookedDescription,
      }
    }

    if (error.kind === 'slot_not_available') {
      return {
        title: errors.slotNotAvailableTitle,
        description: error.message || errors.slotNotAvailableDescription,
      }
    }

    if (error.status === 404) {
      return {
        title: errors.notFoundTitle,
        description: fallbackDescription ?? errors.notFoundDescription,
      }
    }

    if (error.status >= 500) {
      return {
        title: errors.serverTitle,
        description: fallbackDescription ?? errors.serverDescription,
      }
    }

    return {
      title: messages.states.errorTitle,
      description: error.message || fallbackDescription || errors.unknownDescription,
    }
  }

  if (error instanceof NetworkError) {
    if (error.timeout) {
      return {
        title: errors.timeoutTitle,
        description: errors.timeoutDescription,
      }
    }

    return {
      title: errors.networkTitle,
      description: errors.networkDescription,
    }
  }

  return {
    title: errors.unknownTitle,
    description: fallbackDescription ?? errors.unknownDescription,
  }
}
