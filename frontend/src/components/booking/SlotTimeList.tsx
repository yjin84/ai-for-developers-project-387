import { useEffect, useRef } from 'react'
import type { AvailableSlot } from '@/api/slots'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/states'
import { formatFullDate, formatTimeRange } from '@/lib/datetime'
import { format, messages } from '@/lib/messages'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

type SlotTimeListProps = {
  slots: AvailableSlot[] | undefined
  /** Ключ выбранного дня (`yyyy-MM-dd`) — для подписей радиогруппы и вариантов. */
  day: string | null
  /** Сообщение об ошибке брони (409/400), дублируется в aria-live-регионе. */
  errorMessage: string | null
  selectedSlot: AvailableSlot | null
  onSelectSlot: (slot: AvailableSlot) => void
  onBack: () => void
  onConfirm: () => void
  isSubmitting: boolean
}

/**
 * Список свободного времени выбранного дня и переход к подтверждению брони.
 *
 * Кнопки-варианты — семантически радиогруппа: скринридер сообщает выбор
 * одного из. Полная дата в `aria-label` каждого варианта, потому что
 * «09:00–09:15» вне контекста календаря не сообщает день.
 *
 * При ошибке брони выбранный слот сбрасывается (это делает родитель) —
 * фокус возвращается на радиогруппу, чтобы пользователь продолжил с того же
 * места, а сообщение продублировано в `aria-live`.
 */
export function SlotTimeList({
  slots,
  day,
  errorMessage,
  selectedSlot,
  onSelectSlot,
  onBack,
  onConfirm,
  isSubmitting,
}: SlotTimeListProps) {
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (errorMessage) groupRef.current?.focus()
  }, [errorMessage])

  if (!slots) {
    return (
      <EmptyState
        icon={Clock}
        title={messages.booking.slotsPickDayTitle}
        description={messages.booking.slotsPickDayDescription}
      />
    )
  }

  const dayDate = day ? new Date(`${day}T00:00:00`) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{messages.booking.slotsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {errorMessage ? (
          <p
            aria-live="polite"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}
        <div
          ref={groupRef}
          tabIndex={-1}
          role="radiogroup"
          aria-label={
            dayDate
              ? format(messages.booking.slotsGroupLabel, { date: formatFullDate(dayDate) })
              : undefined
          }
          className="flex flex-col gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {slots.map((slot) => {
            const start = new Date(slot.start)
            const end = new Date(slot.end)
            const selected = selectedSlot?.start === slot.start
            return (
              <button
                key={slot.start}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={format(messages.booking.slotOptionLabel, {
                  date: formatFullDate(start),
                  time: formatTimeRange(start, end),
                })}
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  'rounded-md border px-3 py-2.5 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50',
                  selected && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
                )}
              >
                {formatTimeRange(start, end)}
              </button>
            )
          })}
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            {messages.common.back}
          </Button>
          <Button type="button" disabled={!selectedSlot || isSubmitting} onClick={onConfirm}>
            {isSubmitting ? messages.booking.submitting : messages.common.confirm}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
