package com.hexlet.calendar.booking.service;

import com.hexlet.calendar.booking.config.SlotProperties;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.springframework.stereotype.Service;

/**
 * Единственный источник правды о сетке слотов — общий и для генератора
 * свободных слотов, и для приёма брони. Проверяет, что старт легитимен:
 * не в прошлом, в календарном окне {@code [today, today + daysAhead]} зоны
 * {@code SLOT_TIMEZONE}, в рабочий день из {@code SLOT_DAYS_OF_WEEK}, время от
 * {@code SLOT_START_HOUR} до {@code SLOT_END_HOUR} включительно с шагом
 * {@code SLOT_STEP_MIN}, и событие заканчивается не позже
 * {@code endHour + stepMin}.
 */
@Service
public class SlotGridService {

    private static final int MINUTES_PER_HOUR = 60;
    private static final long SECONDS_PER_MINUTE = 60L;

    private final SlotProperties slotProperties;

    public SlotGridService(SlotProperties slotProperties) {
        this.slotProperties = slotProperties;
    }

    public boolean isValidStart(Instant start, Instant now, int durationMinutes) {
        ZoneId zone = ZoneId.of(slotProperties.timezone());
        ZonedDateTime startZdt = start.atZone(zone);
        LocalDate today = now.atZone(zone).toLocalDate();
        LocalDate startDay = startZdt.toLocalDate();

        if (start.isBefore(now)) {
            return false;
        }
        if (startDay.isBefore(today)
                || startDay.isAfter(today.plusDays(slotProperties.daysAhead()))) {
            return false;
        }
        if (!slotProperties.daysOfWeek().contains(startDay.getDayOfWeek().getValue())) {
            return false;
        }

        int startMinute = slotProperties.startHour() * MINUTES_PER_HOUR;
        int endMinute = slotProperties.endHour() * MINUTES_PER_HOUR;
        int minuteOfDay = startZdt.getHour() * MINUTES_PER_HOUR + startZdt.getMinute();
        if (minuteOfDay < startMinute || minuteOfDay > endMinute) {
            return false;
        }
        if ((minuteOfDay - startMinute) % slotProperties.stepMin() != 0) {
            return false;
        }

        Instant dayEnd = startDay.atStartOfDay(zone).toInstant()
                .plusSeconds((endMinute + slotProperties.stepMin()) * SECONDS_PER_MINUTE);
        return start.plusSeconds(durationMinutes * SECONDS_PER_MINUTE).compareTo(dayEnd) <= 0;
    }
}
