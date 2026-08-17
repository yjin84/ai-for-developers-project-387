import { CalendarRange } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import * as eventTypes from '@/api/eventTypes'
import { queryKeys } from '@/api/queryKeys'
import { CardListSkeleton, EmptyState, QueryErrorState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, messages } from '@/lib/messages'

export function BookEventTypesPage() {
  const query = useQuery({
    queryKey: queryKeys.eventTypes.list(),
    queryFn: eventTypes.list,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">{messages.booking.eventTypesTitle}</h1>
        <p className="text-muted-foreground">{messages.booking.eventTypesSubtitle}</p>
      </div>

      {query.isPending ? <CardListSkeleton /> : null}

      {query.isError ? (
        <QueryErrorState
          error={query.error}
          fallbackDescription={messages.errors.loadEventTypes}
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.isSuccess && query.data.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title={messages.booking.eventTypesEmptyTitle}
          description={messages.booking.eventTypesEmptyDescription}
        />
      ) : null}

      {query.isSuccess && query.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {query.data.map((eventType) => (
            <Link key={eventType.id} to={`/book/${eventType.id}`}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{eventType.name}</CardTitle>
                    <Badge variant="secondary">
                      {format(messages.common.minutesShort, { n: eventType.durationMinutes })}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {eventType.description}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
