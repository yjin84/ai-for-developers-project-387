import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './errors'

/**
 * Общий QueryClient приложения.
 *
 * - `staleTime` — небольшое окно свежести по умолчанию, т.к. данные
 *   (типы событий, слоты, брони) меняются нечасто и без пуш-обновлений.
 * - `retry` — ответы с телом ошибки (`ApiError`, 4xx/5xx) повторять
 *   бессмысленно, они не самоустранятся; сетевые сбои (`NetworkError`
 *   и прочие) повторяем несколько раз с задержкой по умолчанию.
 * - Мутации (создание типа события/брони) никогда не повторяются
 *   автоматически — повтор должен быть осознанным действием пользователя.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) return false
        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
