package com.hexlet.calendar.booking.web;

import java.time.Instant;

/** Ответ `POST /bookings` и вложенный объект бронирования. */
public record BookingResponse(String id, String eventTypeId, Instant start, Instant end,
        Instant createdAt) {
}