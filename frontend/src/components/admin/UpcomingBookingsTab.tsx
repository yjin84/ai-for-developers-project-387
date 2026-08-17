import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck } from 'lucide-react'
import * as bookings from '@/api/bookings'
import { queryKeys } from '@/api/queryKeys'
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
import { formatDate, formatDateTime, formatTimeRange } from '@/lib/datetime'
import { format, messages } from '@/lib/messages'

/** Вкладка админки «Предстоящие встречи»: список броней (`GET /bookings`). */
export function UpcomingBookingsTab() {
  const query = useQuery({
    queryKey: queryKeys.bookings.upcoming(),
    queryFn: bookings.listUpcoming,
  })

  // Контракт не гарантирует порядок — сортируем по началу встречи,
  // чтобы ближайшая всегда была сверху.
  const sorted = useMemo(
    () => (query.data ? [...query.data].sort((a, b) => a.start.localeCompare(b.start)) : []),
    [query.data],
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{messages.admin.bookingsHint}</p>

      {query.isPending ? <CardListSkeleton /> : null}

      {query.isError ? (
        <QueryErrorState
          error={query.error}
          fallbackDescription={messages.errors.loadBookings}
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.isSuccess && sorted.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={messages.admin.bookingsEmptyTitle}
          description={messages.admin.bookingsEmptyDescription}
        />
      ) : null}

      {query.isSuccess && sorted.length > 0 ? (
        <>
          {/* Мобильная версия: таблица не сжимается, поэтому на <md — карточки. */}
          <div className="flex flex-col gap-3 md:hidden">
            {sorted.map((booking) => (
              <Card key={booking.id} className="gap-2">
                <CardHeader className="flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">{booking.eventType.name}</CardTitle>
                  <Badge variant="secondary">
                    {format(messages.common.minutesShort, {
                      n: booking.eventType.durationMinutes,
                    })}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm">
                  <p>{formatDate(new Date(booking.start))}</p>
                  <p className="text-muted-foreground">
                    {formatTimeRange(new Date(booking.start), new Date(booking.end))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {messages.admin.bookingsTable.createdAt}:{' '}
                    {formatDateTime(new Date(booking.createdAt))}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden p-0 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{messages.admin.bookingsTable.eventType}</TableHead>
                  <TableHead>{messages.admin.bookingsTable.date}</TableHead>
                  <TableHead>{messages.admin.bookingsTable.time}</TableHead>
                  <TableHead>{messages.admin.bookingsTable.duration}</TableHead>
                  <TableHead className="text-right">
                    {messages.admin.bookingsTable.createdAt}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.eventType.name}</TableCell>
                    <TableCell>{formatDate(new Date(booking.start))}</TableCell>
                    <TableCell>
                      {formatTimeRange(new Date(booking.start), new Date(booking.end))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {format(messages.common.minutesShort, {
                          n: booking.eventType.durationMinutes,
                        })}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(new Date(booking.createdAt))}
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
