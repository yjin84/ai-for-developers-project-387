import type { EventType } from '@/api/eventTypes'
import type { AvailableSlot } from '@/api/slots'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatFullDate, formatTimeRange } from '@/lib/datetime'
import { format, messages } from '@/lib/messages'

type EventTypeSummaryCardProps = {
  eventType: EventType
  selectedDay: string | null
  selectedSlot: AvailableSlot | null
}

/** Карточка выбранного типа события и сводка текущего выбора даты/времени. */
export function EventTypeSummaryCard({
  eventType,
  selectedDay,
  selectedSlot,
}: EventTypeSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{eventType.name}</CardTitle>
          <Badge variant="secondary">
            {format(messages.common.minutesShort, { n: eventType.durationMinutes })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{eventType.description}</p>
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-xs text-foreground/60">{messages.booking.selectedDateLabel}</p>
          <p className="text-sm font-medium capitalize">
            {selectedDay
              ? formatFullDate(new Date(`${selectedDay}T00:00:00`))
              : messages.booking.selectedDateEmpty}
          </p>
        </div>
        <div className="rounded-md bg-muted px-3 py-2">
          <p className="text-xs text-foreground/60">{messages.booking.selectedTimeLabel}</p>
          <p className="text-sm font-medium">
            {selectedSlot
              ? formatTimeRange(new Date(selectedSlot.start), new Date(selectedSlot.end))
              : messages.booking.selectedTimeEmpty}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
