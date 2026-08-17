package com.hexlet.calendar.booking.web;

import com.hexlet.calendar.booking.model.EventTypeEntity;

/** Тип события в ответах API — без прокси-/персист-артефактов JPA. */
public record EventTypeResponse(String id, String name, String description,
        Integer durationMinutes) {

    public static EventTypeResponse from(EventTypeEntity entity) {
        return new EventTypeResponse(entity.getId(), entity.getName(), entity.getDescription(),
                entity.getDurationMinutes());
    }
}