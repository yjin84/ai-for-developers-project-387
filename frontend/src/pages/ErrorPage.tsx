import { TriangleAlert } from 'lucide-react'
import { Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/states'
import { describeError } from '@/lib/errorMessages'
import { messages } from '@/lib/messages'

/**
 * Страница непойманных ошибок (`errorElement` корневого маршрута).
 *
 * Рендерится при любой ошибке рендера/маршрутизации, которую не обработал
 * ни один экран: рендерится вместо `RootLayout` целиком, поэтому не
 * полагается на его разметку. Текст маппится через `describeError` — тот же
 * словарь, что у `ErrorState` и тостов.
 */
export function ErrorPage() {
  const error = useRouteError()
  const { title, description } = describeError(error, messages.errors.unknownDescription)

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <EmptyState
        asHeading
        icon={TriangleAlert}
        title={title}
        description={description}
        action={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => window.location.reload()}>
              {messages.common.retry}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">{messages.common.home}</Link>
            </Button>
          </div>
        }
      />
    </div>
  )
}
