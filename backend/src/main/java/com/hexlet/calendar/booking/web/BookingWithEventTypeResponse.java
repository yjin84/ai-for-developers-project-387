package com.hexlet.calendar.booking.web;

import java.time.Instant;

/** Бронирование для страницы владельца: вместе с типом события. */
public record BookingWithEventTypeResponse(String id, EventTypeResponse eventType, Instant start,
        Instant end, Instant createdAt) {
}