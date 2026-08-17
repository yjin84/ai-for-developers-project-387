package com.hexlet.calendar.booking.service;

import com.hexlet.calendar.booking.config.SlotProperties;
import com.hexlet.calendar.booking.model.BookingEntity;
import com.hexlet.calendar.booking.model.EventTypeEntity;
import com.hexlet.calendar.booking.repository.BookingRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class SlotScheduleService {

    private final SlotProperties slotProperties;
    private final BookingRepository bookingRepository;
    private final Clock clock;

    public SlotScheduleService(SlotProperties slotProperties, BookingRepository bookingRepository,
            Clock clock) {
        this.slotProperties = slotProperties;
        this.bookingRepository = bookingRepository;
        this.clock = clock;
    }

    /**
     * Свободные слоты типа события на окно записи.
     *
     * Окно — {@code [now, now + daysAhead)} в зоне {@code SLOT_TIMEZONE}. Старты
     * генерируются для каждого дня окна: только рабочие дни из
     * {@code SLOT_DAYS_OF_WEEK}, от {@code SLOT_START_HOUR} до
     * {@code SLOT_END_HOUR} включительно с шагом {@code SLOT_STEP_MIN};
     * {@code end = start + durationMinutes}. Из списка исключаются прошедшие
     * старты (start/end ранее {@code now}) и старты, уже занятые
     * бронированием любого типа.
     */
    public List<AvailableSlot> freeSlotsFor(EventTypeEntity eventType) {
        ZoneId zone = ZoneId.of(slotProperties.timezone());
        Instant now = clock.instant();
        LocalDate today = now.atZone(zone).toLocalDate();
        int durationMinutes = eventType.getDurationMinutes();

        Instant windowStart = now;
        Instant windowEnd = today.plusDays(slotProperties.daysAhead() + 1L)
                .atStartOfDay(zone).toInstant();

        Set<Instant> bookedStarts = bookingRepository.findByStartBetween(windowStart, windowEnd)
                .stream()
                .map(BookingEntity::getStart)
                .collect(Collectors.toSet());

        List<AvailableSlot> slots = new ArrayList<>();
        for (int offset = 0; offset <= slotProperties.daysAhead(); offset++) {
            LocalDate date = today.plusDays(offset);
            if (!isWorkingDay(date)) {
                continue;
            }

            int startMinute = slotProperties.startHour() * 60;
            int endMinute = slotProperties.endHour() * 60;
            for (int minute = startMinute; minute <= endMinute;
                    minute += slotProperties.stepMin()) {
                ZonedDateTime startZdt = date.atStartOfDay(zone).plusMinutes(minute);
                Instant start = startZdt.toInstant();
                Instant end = start.plusSeconds(durationSeconds(eventType));
                if (!end.isAfter(now) || bookedStarts.contains(start)) {
                    continue;
                }
                slots.add(new AvailableSlot(start, end));
            }
        }
        return slots;
    }

    private boolean isWorkingDay(LocalDate date) {
        int dayValue = date.getDayOfWeek().getValue();
        return slotProperties.daysOfWeek().contains(dayValue);
    }

    private long durationSeconds(EventTypeEntity eventType) {
        return eventType.getDurationMinutes() * 60L;
    }
}