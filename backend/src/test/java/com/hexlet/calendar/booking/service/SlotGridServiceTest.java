package com.hexlet.calendar.booking.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.hexlet.calendar.booking.config.SlotProperties;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SlotGridServiceTest {

    /** 2026-06-25 08:00 UTC = 11:00 МСК (четверг), окно до 09.07.2026. */
    private static final Instant NOW = Instant.parse("2026-06-25T08:00:00Z");

    private SlotGridService service;

    @BeforeEach
    void setUp() {
        service = new SlotGridService(SlotProperties.defaults());
    }

    @Test
    @DisplayName("Валидный будний старт 09:00 и 17:00 принимается")
    void validGridStarts() {
        assertThat(service.isValidStart(Instant.parse("2026-06-26T06:00:00Z"), NOW, 30)).isTrue();
        assertThat(service.isValidStart(Instant.parse("2026-06-26T14:00:00Z"), NOW, 30)).isTrue();
    }

    @Test
    @DisplayName("start == now допустим")
    void startEqualToNow() {
        assertThat(service.isValidStart(NOW, NOW, 30)).isTrue();
    }

    @Test
    @DisplayName("Выходной день отклоняется")
    void weekendRejected() {
        assertThat(service.isValidStart(Instant.parse("2026-06-27T06:00:00Z"), NOW, 30)).isFalse();
    }

    @Test
    @DisplayName("Старт не кратен шагу сетки отклоняется")
    void offStepRejected() {
        assertThat(service.isValidStart(Instant.parse("2026-06-26T06:30:00Z"), NOW, 30)).isFalse();
    }

    @Test
    @DisplayName("Старт раньше начала рабочего окна отклоняется")
    void beforeStartHourRejected() {
        assertThat(service.isValidStart(Instant.parse("2026-06-26T05:00:00Z"), NOW, 30)).isFalse();
    }

    @Test
    @DisplayName("Старт позже конца рабочего окна отклоняется")
    void afterEndHourRejected() {
        assertThat(service.isValidStart(Instant.parse("2026-06-26T15:00:00Z"), NOW, 30)).isFalse();
    }

    @Test
    @DisplayName("Старт в прошлом отклоняется")
    void pastStartRejected() {
        assertThat(service.isValidStart(Instant.parse("2026-06-25T07:00:00Z"), NOW, 30)).isFalse();
    }

    @Test
    @DisplayName("Событие должно заканчиваться не позже endHour + step")
    void durationMustFitInDay() {
        assertThat(service.isValidStart(Instant.parse("2026-06-26T06:00:00Z"), NOW, 480)).isTrue();
        assertThat(service.isValidStart(Instant.parse("2026-06-26T08:00:00Z"), NOW, 480)).isFalse();
        assertThat(service.isValidStart(Instant.parse("2026-06-26T14:00:00Z"), NOW, 90)).isFalse();
    }

    @Test
    @DisplayName("Последний день окна принимается, следующий — нет")
    void windowBounds() {
        assertThat(service.isValidStart(Instant.parse("2026-07-09T14:00:00Z"), NOW, 30)).isTrue();
        assertThat(service.isValidStart(Instant.parse("2026-07-10T06:00:00Z"), NOW, 30)).isFalse();
    }
}
