/**
 * Единая точка для ключей запросов TanStack Query — избегаем опечаток и
 * дублирования при инвалидации кэша между экранами.
 */
export const queryKeys = {
  eventTypes: {
    all: ['eventTypes'] as const,
    list: () => [...queryKeys.eventTypes.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.eventTypes.all, 'detail', id] as const,
  },
  slots: {
    all: ['slots'] as const,
    list: (eventTypeId: string) => [...queryKeys.slots.all, eventTypeId] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    upcoming: () => [...queryKeys.bookings.all, 'upcoming'] as const,
  },
} as const
