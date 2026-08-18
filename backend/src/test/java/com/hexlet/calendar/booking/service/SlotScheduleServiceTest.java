package com.hexlet.calendar.booking.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.hexlet.calendar.booking.config.SlotProperties;
import com.hexlet.calendar.booking.model.BookingEntity;
import com.hexlet.calendar.booking.model.EventTypeEntity;
import com.hexlet.calendar.booking.repository.BookingRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class SlotScheduleServiceTest {

    private static final ZoneId MOSCOW = ZoneId.of("Europe/Moscow");

    /** 2026-06-25 08:00 UTC = 11:00 МСК (четверг), окно до 09.07.2026. */
    private static final Instant NOW = Instant.parse("2026-06-25T08:00:00Z");
    private static final LocalDate TODAY = LocalDate.of(2026, 6, 25);

    private BookingRepository bookingRepository;
    private SlotScheduleService service;

    private final EventTypeEntity eventType = new EventTypeEntity(
            "consultation-30", "Консультация", "Описание", 30);

    @BeforeEach
    void setUp() {
        bookingRepository = Mockito.mock(BookingRepository.class);
        when(bookingRepository.findByStartBetween(Mockito.any(), Mockito.any()))
                .thenReturn(Collections.emptyList());
        service = new SlotScheduleService(SlotProperties.defaults(), bookingRepository,
                new SlotGridService(SlotProperties.defaults()), Clock.fixed(NOW, MOSCOW));
    }

    @Test
    @DisplayName("Окно записи — старты не выходят за 14-е сутки")
    void windowIsFourteenDays() {
        List<AvailableSlot> slots = service.freeSlotsFor(eventType);

        Instant lastStart = slots.stream()
                .map(AvailableSlot::start)
                .max(Instant::compareTo)
                .orElseThrow();
        assertThat(LocalDate.ofInstant(lastStart, MOSCOW))
                .isBeforeOrEqualTo(TODAY.plusDays(14));
    }

    @Test
    @DisplayName("Только рабочие дни — в выходные слотов нет")
    void onlyWorkingDays() {
        List<AvailableSlot> slots = service.freeSlotsFor(eventType);

        for (AvailableSlot slot : slots) {
            LocalDate day = LocalDate.ofInstant(slot.start(), MOSCOW);
            assertThat(day.getDayOfWeek().getValue())
                    .as("слот %s не в выходной день", slot)
                    .isBetween(1, 5);
        }
    }

    @Test
    @DisplayName("Старты 09:00..17:00 шагом 60 минут в рабочий день")
    void hourlySlotsNineToSeventeen() {
        List<LocalTime> hours = service.freeSlotsFor(eventType).stream()
                .map(AvailableSlot::start)
                .filter(start -> LocalDate.ofInstant(start, MOSCOW).equals(TODAY.plusDays(1)))
                .map(start -> LocalTime.ofInstant(start, MOSCOW))
                .sorted()
                .toList();

        assertThat(hours).isEqualTo(List.of(
                LocalTime.of(9, 0), LocalTime.of(10, 0), LocalTime.of(11, 0),
                LocalTime.of(12, 0), LocalTime.of(13, 0), LocalTime.of(14, 0),
                LocalTime.of(15, 0), LocalTime.of(16, 0), LocalTime.of(17, 0)));
    }

    @Test
    @DisplayName("end = start + durationMinutes")
    void endEqualsStartPlusDuration() {
        AvailableSlot slot = service.freeSlotsFor(eventType).get(0);
        assertThat(slot.end()).isEqualTo(slot.start().plusSeconds(30 * 60));
    }

    @Test
    @DisplayName("Присутствует день из следующего месяца")
    void nextMonthDayPresent() {
        boolean nextMonth = service.freeSlotsFor(eventType).stream()
                .anyMatch(slot -> LocalDate.ofInstant(slot.start(), MOSCOW).getMonthValue()
                        != TODAY.getMonthValue());
        assertThat(nextMonth).isTrue();
    }

    @Test
    @DisplayName("Прошедшие старты сегодня не возвращаются (end > now)")
    void pastSlotsTodayExcluded() {
        List<AvailableSlot> slots = service.freeSlotsFor(eventType);

        for (AvailableSlot slot : slots) {
            assertThat(slot.end()).isAfter(NOW);
        }
    }

    @Test
    @DisplayName("Занятые старты исключаются из свободных")
    void bookedStartsExcluded() {
        Instant bookedStart = Instant.parse("2026-06-26T09:00:00Z");
        when(bookingRepository.findByStartBetween(Mockito.any(), Mockito.any()))
                .thenReturn(List.of(new BookingEntity("b-id", eventType, bookedStart,
                        bookedStart.plusSeconds(30 * 60), bookedStart)));

        List<AvailableSlot> slots = service.freeSlotsFor(eventType);
        assertThat(slots).noneMatch(slot -> slot.start().equals(bookedStart));
    }
}