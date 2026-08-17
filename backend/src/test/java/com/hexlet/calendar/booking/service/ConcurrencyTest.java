package com.hexlet.calendar.booking.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.hexlet.calendar.booking.model.BookingEntity;
import com.hexlet.calendar.booking.model.EventTypeEntity;
import com.hexlet.calendar.booking.repository.BookingRepository;
import com.hexlet.calendar.booking.repository.EventTypeRepository;
import com.hexlet.calendar.booking.web.BookingCreateRequest;
import com.hexlet.calendar.booking.web.BookingResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ConcurrencyTest {

    private static final int THREADS = 8;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private EventTypeRepository eventTypeRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private EventTypeEntity eventType;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAllInBatch();
        eventTypeRepository.deleteAllInBatch();
        eventType = eventTypeRepository.saveAndFlush(
                new EventTypeEntity("consultation-30", "Консультация", "Описание", 30));
    }

    @Test
    @DisplayName("Параллельные POST /bookings одного старта: ровно один 201, остальные 409")
    void concurrentBookingSameStart() throws Exception {
        // H2 TIMESTAMP не хранит доли секунды: берём старт кратным часу, чтобы
        // значение при записи и выборке findAllByStart совпали один-в-один.
        Instant start = Instant.now().plus(Duration.ofHours(1))
                .truncatedTo(java.time.temporal.ChronoUnit.HOURS);
        BookingCreateRequest request = new BookingCreateRequest("consultation-30", start);

        List<Callable<Object>> tasks = IntStream.range(0, THREADS)
                .mapToObj(i -> (Callable<Object>) () -> {
                    try {
                        bookingService.create(request);
                        return "created";
                    } catch (SlotAlreadyBookedException ex) {
                        return "conflict";
                    }
                })
                .toList();

        List<Object> outcomes = runConcurrently(tasks);

        long created = outcomes.stream().filter("created"::equals).count();
        long conflicts = outcomes.stream().filter("conflict"::equals).count();
        assertThat(created).isEqualTo(1);
        assertThat(conflicts).isEqualTo(THREADS - 1);
        assertThat(bookingRepository.findAllByStart(start)).hasSize(1);
    }

    @Test
    @DisplayName("Конкурентный POST /event-types дубликата id — один 201, остальные 409")
    void concurrentDuplicateEventTypeId() throws Exception {
        // id, отсутствующий в БД до теста (сеед setUp использует consultation-30).
        EventTypeEntity duplicate = new EventTypeEntity("webinar-60", "Дубль", "Описание", 45);

        List<Object> results = runConcurrently(IntStream.range(0, THREADS)
                .mapToObj(i -> (Callable<Object>) () -> {
                    try {
                        eventTypeRepository.saveAndFlush(duplicate);
                        return "created";
                    } catch (org.springframework.dao.DataIntegrityViolationException ex) {
                        return "conflict";
                    }
                })
                .toList());

        long created = results.stream().filter("created"::equals).count();
        long conflicts = results.stream().filter("conflict"::equals).count();
        assertThat(created).isEqualTo(1);
        assertThat(conflicts).isEqualTo(THREADS - 1);
    }

    private List<Object> runConcurrently(List<Callable<Object>> tasks) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(tasks.size());
        CyclicBarrier barrier = new CyclicBarrier(tasks.size());
        try {
            List<Future<Object>> futures = tasks.stream()
                    .map(task -> executor.submit(() -> {
                        barrier.await();
                        return task.call();
                    }))
                    .toList();
            List<Object> results = new java.util.ArrayList<>();
            for (Future<Object> future : futures) {
                results.add(future.get());
            }
            return results;
        } finally {
            executor.shutdownNow();
        }
    }
}