package com.hexlet.calendar.booking.repository;

import com.hexlet.calendar.booking.model.EventTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventTypeRepository extends JpaRepository<EventTypeEntity, String> {
}