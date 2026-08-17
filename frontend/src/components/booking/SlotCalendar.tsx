import { ru } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dayKey } from '@/lib/datetime'
import { messages } from '@/lib/messages'

type SlotCalendarProps = {
  month: Date
  onMonthChange: (month: Date) => void
  availableDays: Set<string>
  selectedDay: string | null
  onSelectDay: (day: string) => void
  minMonth: Date
  maxMonth: Date
}

/**
 * Месячный календарь свободных слотов на `react-day-picker`.
 *
 * Доступны только дни со свободными слотами (`disabled`), границы навигации
 * по месяцам берутся из фактических данных слота (`startMonth`/`endMonth`),
 * а не из системной даты клиента — устойчиво к рассинхрону часов с моком.
 *
 * Доступность (role="grid", навигация стрелками, aria-selected/aria-disabled,
 * подписи дней с полной датой) обеспечивает react-day-picker; здесь только
 * настройка локали и ограничений.
 */
export function SlotCalendar({
  month,
  onMonthChange,
  availableDays,
  selectedDay,
  onSelectDay,
  minMonth,
  maxMonth,
}: SlotCalendarProps) {
  const selected = selectedDay ? new Date(`${selectedDay}T00:00:00`) : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{messages.booking.calendarTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          locale={ru}
          weekStartsOn={1}
          month={month}
          onMonthChange={onMonthChange}
          startMonth={minMonth}
          endMonth={maxMonth}
          selected={selected}
          onSelect={(date) => {
            if (date) onSelectDay(dayKey(date))
          }}
          disabled={(date) => !availableDays.has(dayKey(date))}
          classNames={{
            // Недоступные дни несут информацию («в этот день нет слотов»),
            // поэтому без дополнительной прозрачности — контраст как у
            // вторичного текста, а не как у отключённого элемента.
            disabled: 'text-muted-foreground',
            // Тач-таргет дня не должен сжиматься до 28 px на мобильном.
            day_button: 'min-h-10',
          }}
        />
      </CardContent>
    </Card>
  )
}
