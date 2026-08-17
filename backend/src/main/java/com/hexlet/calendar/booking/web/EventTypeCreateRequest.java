package com.hexlet.calendar.booking.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EventTypeCreateRequest(
        @NotBlank
        @Size(max = 64)
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$")
        String id,

        @NotBlank
        @Size(min = 1, max = 100)
        String name,

        @NotBlank
        @Size(min = 1, max = 500)
        String description,

        @NotNull
        @Min(5)
        @Max(480)
        Integer durationMinutes) {
}