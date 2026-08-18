package com.hexlet.calendar.booking.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BookingApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /bookings — happy path 201 с корректными end/createdAt")
    void createHappyPath() throws Exception {
        createEventType("consultation-30", 30);
        String start = nextGridStart();

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "consultation-30",
                                  "start": "%s"
                                }
                                """.formatted(start)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.eventTypeId").value("consultation-30"))
                .andExpect(jsonPath("$.start").value(start))
                .andExpect(jsonPath("$.end").value(Instant.parse(start).plusSeconds(30 * 60).toString()))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    @DisplayName("GET /bookings — бронь в списке со встроенным eventType")
    void listContainsBookingWithEventType() throws Exception {
        createEventType("consultation-30", "Консультация", 30);
        String start = nextGridStart();
        createBooking(start);

        mockMvc.perform(get("/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").isNotEmpty())
                .andExpect(jsonPath("$[0].eventType.id").value("consultation-30"))
                .andExpect(jsonPath("$[0].eventType.name").value("Консультация"))
                .andExpect(jsonPath("$[0].start").value(start));
    }

    @Test
    @DisplayName("POST /bookings — повторная бронь того же старта → 409 slot_already_booked")
    void duplicateStartConflict() throws Exception {
        createEventType("consultation-30", 30);
        String start = nextGridStart();
        createBooking(start);
        createEventType("quick-call-15", 15);

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "quick-call-15",
                                  "start": "%s"
                                }
                                """.formatted(start)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("slot_already_booked"));
    }

    @Test
    @DisplayName("POST /bookings — старт вне окна → 400 slot_not_available")
    void startOutsideWindow() throws Exception {
        createEventType("consultation-30", 30);
        String beyondWindow = Instant.now().plus(Duration.ofDays(20)).toString();

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "consultation-30",
                                  "start": "%s"
                                }
                                """.formatted(beyondWindow)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("slot_not_available"));
    }

    @Test
    @DisplayName("POST /bookings — старт в прошлом → 400 slot_not_available")
    void pastStartRejected() throws Exception {
        createEventType("consultation-30", 30);
        String past = Instant.now().minus(Duration.ofDays(1)).toString();

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "consultation-30",
                                  "start": "%s"
                                }
                                """.formatted(past)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("slot_not_available"));
    }

    @Test
    @DisplayName("POST /bookings — старт вне сетки (не кратен шагу) → 400 slot_not_available")
    void offGridStartRejected() throws Exception {
        createEventType("consultation-30", 30);
        String offGrid = Instant.parse(nextGridStart()).plusSeconds(60).toString();

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "consultation-30",
                                  "start": "%s"
                                }
                                """.formatted(offGrid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("slot_not_available"));
    }

    @Test
    @DisplayName("POST /bookings — неизвестный тип → 400 slot_not_available")
    void unknownEventType() throws Exception {
        String start = nextGridStart();

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "no-such-type",
                                  "start": "%s"
                                }
                                """.formatted(start)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("slot_not_available"));
    }

    @Test
    @DisplayName("POST /bookings — невалидный eventTypeId → 400 Error{code:400}")
    void invalidEventTypeId() throws Exception {
        String start = nextGridStart();

        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "Bad ID",
                                  "start": "%s"
                                }
                                """.formatted(start)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    @DisplayName("POST /bookings — нечитаемый start → 400 400")
    void malformedStart() throws Exception {
        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "consultation-30",
                                  "start": "not-a-date"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    private void createEventType(String id, int duration) throws Exception {
        createEventType(id, "Консультация", duration);
    }

    private void createEventType(String id, String name, int duration) throws Exception {
        mockMvc.perform(post("/event-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "%s",
                                  "name": "%s",
                                  "description": "Описание консультации",
                                  "durationMinutes": %d
                                }
                                """.formatted(id, name, duration)))
                .andExpect(status().isCreated());
    }

    private void createBooking(String start) throws Exception {
        mockMvc.perform(post("/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventTypeId": "consultation-30",
                                  "start": "%s"
                                }
                                """.formatted(start)))
                .andExpect(status().isCreated());
    }

    /** Следующий рабочий день в 09:00 МСК — гарантированно будущий и в сетке. */
    private String nextGridStart() {
        ZoneId zone = ZoneId.of("Europe/Moscow");
        LocalDate day = Instant.now().atZone(zone).toLocalDate().plusDays(1);
        while (day.getDayOfWeek().getValue() > 5) {
            day = day.plusDays(1);
        }
        return day.atTime(9, 0).atZone(zone).toInstant().toString();
    }
}
