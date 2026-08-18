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

    private static final int MINUTES_PER_HOUR = 60;
    private static final long SECONDS_PER_MINUTE = 60L;

    private final SlotProperties slotProperties;
    private final BookingRepository bookingRepository;
    private final SlotGridService slotGridService;
    private final Clock clock;

    public SlotScheduleService(SlotProperties slotProperties, BookingRepository bookingRepository,
            SlotGridService slotGridService, Clock clock) {
        this.slotProperties = slotProperties;
        this.bookingRepository = bookingRepository;
        this.slotGridService = slotGridService;
        this.clock = clock;
    }

    /**
     * Свободные слоты типа события на окно записи.
     *
     * Окно — {@code [today, today + daysAhead]} в зоне {@code SLOT_TIMEZONE}.
     * Старты генерируются для каждого дня окна от {@code SLOT_START_HOUR} до
     * {@code SLOT_END_HOUR} включительно с шагом {@code SLOT_STEP_MIN}, затем
     * пропускаются через общий валидатор сетки {@link SlotGridService}
     * (рабочий день, не в прошлом, укладывается в день по длительности);
     * {@code end = start + durationMinutes}. Из списка исключаются старты, уже
     * занятые бронированием любого типа.
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

            int startMinute = slotProperties.startHour() * MINUTES_PER_HOUR;
            int endMinute = slotProperties.endHour() * MINUTES_PER_HOUR;
            for (int minute = startMinute; minute <= endMinute;
                    minute += slotProperties.stepMin()) {
                ZonedDateTime startZdt = date.atStartOfDay(zone).plusMinutes(minute);
                Instant start = startZdt.toInstant();
                if (!slotGridService.isValidStart(start, now, durationMinutes)
                        || bookedStarts.contains(start)) {
                    continue;
                }
                Instant end = start.plusSeconds(durationSeconds(eventType));
                slots.add(new AvailableSlot(start, end));
            }
        }
        return slots;
    }

    private long durationSeconds(EventTypeEntity eventType) {
        return eventType.getDurationMinutes() * SECONDS_PER_MINUTE;
    }
}