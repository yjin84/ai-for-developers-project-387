import { CircleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

/** Плейсхолдер для ошибки загрузки карточки/списка с кнопкой повтора. */
export function ErrorState({
  title = messages.states.errorTitle,
  description = messages.states.errorDescription,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('border-destructive/30', className)}>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <CircleAlert className="size-8 text-destructive" />
        <p className="font-medium">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            {messages.common.retry}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
