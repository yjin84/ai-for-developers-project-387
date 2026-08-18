package com.hexlet.calendar.booking.service;

import com.hexlet.calendar.booking.model.BookingEntity;
import com.hexlet.calendar.booking.model.EventTypeEntity;
import com.hexlet.calendar.booking.repository.BookingRepository;
import com.hexlet.calendar.booking.repository.EventTypeRepository;
import com.hexlet.calendar.booking.web.BookingCreateRequest;
import com.hexlet.calendar.booking.web.BookingResponse;
import com.hexlet.calendar.booking.web.BookingWithEventTypeResponse;
import com.hexlet.calendar.booking.web.EventTypeResponse;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

    /** Секунд в минуте — перевод {@code durationMinutes} в {@code Instant}. */
    private static final long SECONDS_PER_MINUTE = 60L;

    private final BookingRepository bookingRepository;
    private final EventTypeRepository eventTypeRepository;
    private final SlotGridService slotGridService;
    private final Clock clock;

    public BookingService(BookingRepository bookingRepository,
            EventTypeRepository eventTypeRepository, SlotGridService slotGridService, Clock clock) {
        this.bookingRepository = bookingRepository;
        this.eventTypeRepository = eventTypeRepository;
        this.slotGridService = slotGridService;
        this.clock = clock;
    }

    /**
     * Создать бронь по правилам §7. Старт сверяется с общим валидатором сетки
     * {@link SlotGridService} (рабочий день, часы, шаг, окно дней) — бронь
     * возможна только на слот, который покажет {@code GET /slots}. Конфликт
     * уникального {@code start} ловится локально (unique-индекс) и превращается
     * в 409, минуя глобальный перехват {@link DataIntegrityViolationException}
     * этапа 3.
     */
    @Transactional
    public BookingResponse create(BookingCreateRequest request) {
        EventTypeEntity eventType = eventTypeRepository.findById(request.eventTypeId())
                .orElseThrow(SlotNotAvailableException::new);

        Instant now = clock.instant();
        Instant start = request.start();
        int durationMinutes = eventType.getDurationMinutes();
        if (!slotGridService.isValidStart(start, now, durationMinutes)) {
            throw new SlotNotAvailableException();
        }

        BookingEntity booking = new BookingEntity(
                UUID.randomUUID().toString(),
                eventType,
                start,
                start.plusSeconds(durationMinutes * SECONDS_PER_MINUTE),
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