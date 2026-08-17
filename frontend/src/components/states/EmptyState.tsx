import type { ComponentType } from 'react'
import { Inbox } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: ComponentType<{ className?: string }>
  action?: React.ReactNode
  /** Рендерить заголовок как `<h1>` — для страниц, где это единственный заголовок (например 404). */
  asHeading?: boolean
  className?: string
}

/** Плейсхолдер для пустого списка/карточки — нет данных для отображения. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  asHeading = false,
  className,
}: EmptyStateProps) {
  const Heading = asHeading ? 'h1' : 'p'
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <Icon className="size-8 text-muted-foreground" />
        <Heading className="font-medium">{title}</Heading>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
