import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { startOfMonth } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import * as bookings from '@/api/bookings'
import * as eventTypes from '@/api/eventTypes'
import { ApiError } from '@/api/errors'
import { queryKeys } from '@/api/queryKeys'
import * as slotsApi from '@/api/slots'
import type { AvailableSlot } from '@/api/slots'
import { BookingConfirmedCard } from '@/components/booking/BookingConfirmedCard'
import { EventTypeSummaryCard } from '@/components/booking/EventTypeSummaryCard'
import { SlotCalendar } from '@/components/booking/SlotCalendar'
import { SlotTimeList } from '@/components/booking/SlotTimeList'
import { CardListSkeleton, EmptyState, QueryErrorState } from '@/components/states'
import { describeError } from '@/lib/errorMessages'
import { messages } from '@/lib/messages'
import { groupSlotsByDay } from '@/lib/slots'

export function BookSlotPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const eventTypeQuery = useQuery({
    queryKey: queryKeys.eventTypes.detail(eventTypeId ?? ''),
    queryFn: () => eventTypes.get(eventTypeId ?? ''),
    enabled: Boolean(eventTypeId),
  })

  const slotsQuery = useQuery({
    queryKey: queryKeys.slots.list(eventTypeId ?? ''),
    queryFn: () => slotsApi.list(eventTypeId ?? ''),
    enabled: Boolean(eventTypeId),
  })

  const slotsByDay = useMemo(
    () => (slotsQuery.data ? groupSlotsByDay(slotsQuery.data) : new Map<string, AvailableSlot[]>()),
    [slotsQuery.data],
  )
  const sortedDayKeys = useMemo(() => [...slotsByDay.keys()].sort(), [slotsByDay])
  const availableDays = useMemo(() => new Set(sortedDayKeys), [sortedDayKeys])

  const [month, setMonth] = useState<Date | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [slotError, setSlotError] = useState<string | null>(null)
  const timeListRef = useRef<HTMLDivElement>(null)

  // Инициализируем месяц и выбранный день один раз после загрузки слотов —
  // на первый доступный день (или текущий месяц, если свободных слотов нет).
  useEffect(() => {
    if (!slotsQuery.isSuccess || month !== null) return
    const firstDay = sortedDayKeys.at(0)
    setMonth(startOfMonth(firstDay ? new Date(`${firstDay}T00:00:00`) : new Date()))
    setSelectedDay(firstDay ?? null)
  }, [slotsQuery.isSuccess, sortedDayKeys, month])

  const bookMutation = useMutation({
    mutationFn: bookings.create,
    onSuccess: () => {
      toast.success(messages.booking.confirmedToast)
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.upcoming() })
    },
    onError: (error: unknown) => {
      if (
        error instanceof ApiError &&
        (error.kind === 'slot_already_booked' || error.kind === 'slot_not_available')
      ) {
        // Сообщение дублируется в aria-live-регион внутри списка времени:
        // тост может быть пропущен скринридером при смене DOM.
        setSlotError(describeError(error).description)
        setSelectedSlot(null)
        void queryClient.invalidateQueries({ queryKey: queryKeys.slots.list(eventTypeId ?? '') })
        return
      }
      toast.error(describeError(error, messages.errors.createBooking).description)
    },
  })

  if (!eventTypeId) {
    return <Navigate to="/book" replace />
  }

  if (eventTypeQuery.isPending) {
    return <CardListSkeleton count={1} />
  }

  if (eventTypeQuery.isError) {
    return (
      <QueryErrorState
        error={eventTypeQuery.error}
        fallbackDescription={messages.errors.loadEventType}
        onRetry={() => eventTypeQuery.refetch()}
      />
    )
  }

  const eventType = eventTypeQuery.data

  if (bookMutation.isSuccess) {
    return <BookingConfirmedCard booking={bookMutation.data} eventTypeName={eventType.name} />
  }

  const firstDayKey = sortedDayKeys.at(0)
  const lastDayKey = sortedDayKeys.at(-1)
  const minMonth = startOfMonth(firstDayKey ? new Date(`${firstDayKey}T00:00:00`) : new Date())
  const maxMonth = startOfMonth(lastDayKey ? new Date(`${lastDayKey}T00:00:00`) : new Date())
  const daySlots = selectedDay ? slotsByDay.get(selectedDay) : undefined

  const selectDay = (day: string) => {
    setSelectedDay(day)
    setSelectedSlot(null)
    setSlotError(null)
    // На мобильном список времени ниже вьюпорта — результат выбора уходит
    // с экрана, поэтому прокручиваем к нему (на md+ сетка показывает всё сразу).
    if (!window.matchMedia('(min-width: 768px)').matches) {
      requestAnimationFrame(() => {
        timeListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">{eventType.name}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="md:col-span-2 lg:col-span-1">
          <EventTypeSummaryCard
            eventType={eventType}
            selectedDay={selectedDay}
            selectedSlot={selectedSlot}
          />
        </div>

        {slotsQuery.isPending ? <CardListSkeleton count={1} /> : null}

        {slotsQuery.isError ? (
          <QueryErrorState
            className="md:col-span-2 lg:col-span-3"
            error={slotsQuery.error}
            fallbackDescription={messages.errors.loadSlots}
            onRetry={() => slotsQuery.refetch()}
          />
        ) : null}

        {slotsQuery.isSuccess && sortedDayKeys.length === 0 ? (
          <EmptyState
            className="md:col-span-2 lg:col-span-3"
            icon={CalendarDays}
            title={messages.booking.slotsEmptyTitle}
            description={messages.booking.slotsEmptyDescription}
          />
        ) : null}

        {slotsQuery.isSuccess && sortedDayKeys.length > 0 && month ? (
          <>
            <SlotCalendar
              month={month}
              onMonthChange={setMonth}
              availableDays={availableDays}
              selectedDay={selectedDay}
              onSelectDay={selectDay}
              minMonth={minMonth}
              maxMonth={maxMonth}
            />
            <div ref={timeListRef} className="scroll-mt-4">
              <SlotTimeList
                slots={daySlots}
                day={selectedDay}
                errorMessage={slotError}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => {
                  setSlotError(null)
                  setSelectedSlot(slot)
                }}
                onBack={() => navigate('/book')}
                onConfirm={() => {
                  if (!selectedSlot) return
                  bookMutation.mutate({ eventTypeId, start: selectedSlot.start })
                }}
                isSubmitting={bookMutation.isPending}
              />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
