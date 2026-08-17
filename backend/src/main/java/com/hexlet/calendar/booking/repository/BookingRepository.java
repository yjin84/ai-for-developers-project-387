package com.hexlet.calendar.booking.repository;

import com.hexlet.calendar.booking.model.BookingEntity;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<BookingEntity, String> {

    List<BookingEntity> findByStartBetween(Instant from, Instant to);

    List<BookingEntity> findAllByStart(Instant start);
}