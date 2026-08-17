package com.hexlet.calendar.booking.service;

import java.time.Instant;

/** Свободный слот в календаре выбранного типа события. */
public record AvailableSlot(Instant start, Instant end) {
}