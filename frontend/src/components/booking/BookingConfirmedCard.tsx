import { useEffect, useRef } from 'react'
import { CalendarCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Booking } from '@/api/bookings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatFullDate, formatTimeRange } from '@/lib/datetime'
import { messages } from '@/lib/messages'

type BookingConfirmedCardProps = {
  booking: Booking
  eventTypeName: string
}

/**
 * Экран подтверждения успешно созданной брони (`POST /bookings` → 201).
 *
 * Заголовок получает `tabIndex={-1}` и фокус при появлении: кнопка
 * «Подтвердить», на которой был фокус, исчезает вместе с макетом — без
 * переноса фокус теряется и скринридер «проваливается» в конец страницы.
 */
export function BookingConfirmedCard({ booking, eventTypeName }: BookingConfirmedCardProps) {
  const start = new Date(booking.start)
  const end = new Date(booking.end)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <Card className="mx-auto max-w-md border-primary/30">
      <CardHeader className="items-center text-center">
        <CalendarCheck className="size-10 text-primary" />
        <CardTitle ref={titleRef} tabIndex={-1} className="text-xl outline-none">
          {messages.booking.confirmedTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <div>
          <p className="font-medium">{eventTypeName}</p>
          <p className="text-sm capitalize text-muted-foreground">{formatFullDate(start)}</p>
          <p className="text-sm text-muted-foreground">{formatTimeRange(start, end)}</p>
        </div>
        <Button asChild>
          <Link to="/book">{messages.booking.confirmedAgain}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
