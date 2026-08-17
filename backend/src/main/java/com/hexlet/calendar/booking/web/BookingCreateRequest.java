package com.hexlet.calendar.booking.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record BookingCreateRequest(
        @NotBlank
        @Size(max = 64)
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$")
        String eventTypeId,

        @NotNull
        Instant start) {
}