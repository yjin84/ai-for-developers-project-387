package com.hexlet.calendar.booking.service;

import com.hexlet.calendar.booking.config.SlotProperties;
import com.hexlet.calendar.booking.model.BookingEntity;
import com.hexlet.calendar.booking.model.EventTypeEntity;
import com.hexlet.calendar.booking.repository.BookingRepository;
import com.hexlet.calendar.booking.repository.EventTypeRepository;
import com.hexlet.calendar.booking.web.BookingCreateRequest;
import com.hexlet.calendar.booking.web.BookingResponse;
import com.hexlet.calendar.booking.web.BookingWithEventTypeResponse;
import com.hexlet.calendar.booking.web.EventTypeResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventTypeRepository eventTypeRepository;
    private final SlotProperties slotProperties;
    private final Clock clock;

    public BookingService(BookingRepository bookingRepository,
            EventTypeRepository eventTypeRepository, SlotProperties slotProperties, Clock clock) {
        this.bookingRepository = bookingRepository;
        this.eventTypeRepository = eventTypeRepository;
        this.slotProperties = slotProperties;
        this.clock = clock;
    }

    /**
     * Создать бронь по правилам §7. Конфликт уникального {@code start} ловится
     * локально (unique-индекс) и превращается в 409, минуя глобальный перехват
     * {@link DataIntegrityViolationException} этапа 3.
     */
    @Transactional
    public BookingResponse create(BookingCreateRequest request) {
        EventTypeEntity eventType = eventTypeRepository.findById(request.eventTypeId())
                .orElseThrow(SlotNotAvailableException::new);

Instant now = clock.instant();
        Instant start = request.start();
        Instant windowEnd = now.plus(Duration.ofDays(slotProperties.daysAhead()));
        if (start.isBefore(now) || start.isAfter(windowEnd)) {
            throw new SlotNotAvailableException();
        }

        BookingEntity booking = new BookingEntity(
                UUID.randomUUID().toString(),
                eventType,
                start,
                start.plusSeconds(eventType.getDurationMinutes() * 60L),
                now);
        try {
            booking = bookingRepository.saveAndFlush(booking);
        } catch (DataIntegrityViolationException ex) {
            throw new SlotAlreadyBookedException();
        }
        return new BookingResponse(booking.getId(), eventType.getId(), booking.getStart(),
                booking.getEnd(), booking.getCreatedAt());
    }

    /** Все бронирования со встроенным типом события — без гарантии сортировки. */
    @Transactional(readOnly = true)
    public List<BookingWithEventTypeResponse> listAll() {
        return bookingRepository.findAll().stream()
                .map(booking -> new BookingWithEventTypeResponse(booking.getId(),
                        EventTypeResponse.from(booking.getEventType()), booking.getStart(),
                        booking.getEnd(), booking.getCreatedAt()))
                .toList();
    }
}