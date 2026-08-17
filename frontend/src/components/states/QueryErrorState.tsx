import { ErrorState } from './ErrorState'
import { describeError, type ErrorDescription } from '@/lib/errorMessages'

type QueryErrorStateProps = {
  /** Ошибка запроса (`useQuery.error`) — маппится через `describeError`. */
  error: unknown
  /** Текст-фолбэк для случая «неизвестная ошибка» (из `messages.errors`). */
  fallbackDescription?: string
  onRetry?: () => void
  className?: string
}

/**
 * `ErrorState` для ошибок загрузки данных: превращает ошибку запроса
 * в пару «заголовок + описание» через `describeError`, чтобы сетевой сбой
 * (`NetworkError`), таймаут, ошибка API (4xx/5xx) и неизвестный сбой
 * показывали разный текст на одном и том же экране.
 */
export function QueryErrorState({
  error,
  fallbackDescription,
  onRetry,
  className,
}: QueryErrorStateProps) {
  const { title, description }: ErrorDescription = describeError(error, fallbackDescription)
  return (
    <ErrorState title={title} description={description} onRetry={onRetry} className={className} />
  )
}
