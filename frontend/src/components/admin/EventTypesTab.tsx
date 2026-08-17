import { useQuery } from '@tanstack/react-query'
import { ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as eventTypes from '@/api/eventTypes'
import { queryKeys } from '@/api/queryKeys'
import { EventTypeCreateDialog } from '@/components/admin/EventTypeCreateDialog'
import { CardListSkeleton, EmptyState, QueryErrorState } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format, messages } from '@/lib/messages'

/** Вкладка админки «Типы событий»: список (`GET /event-types`) и форма создания. */
export function EventTypesTab() {
  const query = useQuery({
    queryKey: queryKeys.eventTypes.list(),
    queryFn: eventTypes.list,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{messages.admin.eventTypesHint}</p>
        <EventTypeCreateDialog />
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
          icon={ListChecks}
          title={messages.admin.eventTypesEmptyTitle}
          description={messages.admin.eventTypesEmptyDescription}
        />
      ) : null}

      {query.isSuccess && query.data.length > 0 ? (
        <>
          {/* Мобильная версия: таблица не сжимается, поэтому на <md — карточки. */}
          <div className="flex flex-col gap-3 md:hidden">
            {query.data.map((eventType) => (
              <Card key={eventType.id} className="gap-2">
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link className="hover:underline" to={`/book/${eventType.id}`}>
                      {eventType.name}
                    </Link>
                  </CardTitle>
                  <Badge variant="secondary">
                    {format(messages.common.minutesShort, { n: eventType.durationMinutes })}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <code className="text-xs text-muted-foreground">{eventType.id}</code>
                  <p className="text-muted-foreground">{eventType.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden p-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.admin.eventTypesTable.name}</TableHead>
                  <TableHead>{messages.admin.eventTypesTable.id}</TableHead>
                  <TableHead>{messages.admin.eventTypesTable.description}</TableHead>
                  <TableHead className="text-right">
                    {messages.admin.eventTypesTable.duration}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((eventType) => (
                  <TableRow key={eventType.id}>
                    <TableCell className="font-medium">
                      <Link className="hover:underline" to={`/book/${eventType.id}`}>
                        {eventType.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <code className="text-xs">{eventType.id}</code>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-muted-foreground">
                      {eventType.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {format(messages.common.minutesShort, { n: eventType.durationMinutes })}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : null}
    </div>
  )
}
